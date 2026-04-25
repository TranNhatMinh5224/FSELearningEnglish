using System.Text.Json;
using System.Text;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Configurations;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;
using LearningEnglish.Application.Interface.Infrastructure;

namespace LearningEnglish.Application.Service
{
    public class DictionaryService : IDictionaryService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<DictionaryService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IMinioFileStorage _minioService;
        private readonly IAzureSpeechService _azureSpeechService;
        private readonly IFlashCardMediaService _flashCardMediaService;
        
        // New interfaces injected via Clean Architecture refactoring
        private readonly IFreeDictionaryClient _freeDictionaryClient;
        private readonly ITranslatorClient _translatorClient;
        private readonly IOxfordClient _oxfordClient;
        private readonly IUnsplashClient _unsplashClient;

        public DictionaryService(
            IHttpClientFactory httpClientFactory,
            ILogger<DictionaryService> logger,
            IConfiguration configuration,
            IMinioFileStorage minioService,
            IAzureSpeechService azureSpeechService,
            IFlashCardMediaService flashCardMediaService,
            IFreeDictionaryClient freeDictionaryClient,
            ITranslatorClient translatorClient,
            IOxfordClient oxfordClient,
            IUnsplashClient unsplashClient)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
            _minioService = minioService;
            _azureSpeechService = azureSpeechService;
            _flashCardMediaService = flashCardMediaService;
            _freeDictionaryClient = freeDictionaryClient;
            _translatorClient = translatorClient;
            _oxfordClient = oxfordClient;
            _unsplashClient = unsplashClient;
        }

        public async Task<ServiceResponse<DictionaryLookupResultDto>> LookupWordAsync(string word, string? targetLanguage = "vi")
        {
            var response = new ServiceResponse<DictionaryLookupResultDto>();

            try
            {
                if (string.IsNullOrWhiteSpace(word))
                {
                    response.Success = false;
                    response.Message = "Word cannot be empty";
                    return response;
                }

                // Try Oxford API first
                var oxfordResult = await _oxfordClient.LookupWordAsync(word);
                if (oxfordResult.Success && oxfordResult.Data != null)
                {
                    response.Data = oxfordResult.Data;
                }
                else
                {
                    // Fallback to Free Dictionary API
                    _logger.LogInformation("Oxford API unavailable or failed, falling back to Free Dictionary API for word: {Word}", word);
                    var freeDictResult = await _freeDictionaryClient.LookupWordAsync(word);
                    if (freeDictResult.Success && freeDictResult.Data != null)
                    {
                        response.Data = freeDictResult.Data;
                    }
                }

                if (response.Data == null)
                {
                    response.Success = false;
                    response.Message = $"Word '{word}' not found in any dictionary";
                    return response;
                }

                // Add Vietnamese translation for the word itself (Concise meaning)
                var translationResult = await _translatorClient.TranslateTextAsync(word, targetLanguage ?? "vi");
                if (translationResult.Success)
                {
                    response.Data.WordTranslation = translationResult.Data;
                }

                response.Success = true;
                response.Message = "Word lookup successful";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up word: {Word}", word);
                response.Success = false;
                response.Message = "An error occurred during word lookup";
            }

            return response;
        }
        // gen flashcard from word 

        public async Task<ServiceResponse<GenerateFlashCardPreviewResponseDto>> GenerateFlashCardFromWordAsync(string word)
        {
            var response = new ServiceResponse<GenerateFlashCardPreviewResponseDto>();

            try
            {
                // Lookup word in dictionary with audio URL extraction
                var lookupResult = await LookupWordWithAudioAsync(word, "vi");

                if (!lookupResult.Success || lookupResult.Data == null)
                {
                    response.Success = false;
                    response.Message = lookupResult.Message;
                    return response;
                }

                var dictData = lookupResult.Data;
                var flashCard = new Domain.Entities.FlashCard
                {
                    Word = dictData.Word,
                    Pronunciation = dictData.Phonetic
                };

                // Handle audio generation with priority: Oxford audio → Azure TTS → null
                string? audioTempKey = null;
                if (!string.IsNullOrEmpty(dictData.AudioUrl))
                {
                    // Oxford provided audio URL, download and upload to MinIO
                    try
                    {
                        var audioStream = await DownloadAudioFromUrlAsync(dictData.AudioUrl);
                        if (audioStream != null)
                        {
                            audioTempKey = await UploadAudioToMinioAsync(audioStream, $"{word}.mp3");
                            _logger.LogInformation("Successfully uploaded Oxford audio for word: {Word}", word);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to download/upload Oxford audio for word: {Word}", word);
                    }
                }

                // Fallback to Azure TTS if Oxford audio failed
                if (string.IsNullOrEmpty(audioTempKey))
                {
                    try
                    {
                        var ttsStream = await _azureSpeechService.GenerateSpeechAsync(word, "en-US", "en-US-JennyNeural");
                        if (ttsStream != null)
                        {
                            audioTempKey = await UploadAudioToMinioAsync(ttsStream, $"{word}_tts.mp3");
                            _logger.LogInformation("Successfully generated and uploaded Azure TTS audio for word: {Word}", word);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to generate Azure TTS audio for word: {Word}", word);
                    }
                }

                flashCard.AudioKey = audioTempKey;

                // Handle image generation from Unsplash
                string? imageTempKey = null;
                try
                {
                    var imageStream = await SearchAndDownloadImageFromUnsplashAsync(word);
                    if (imageStream != null)
                    {
                        imageTempKey = await UploadImageToMinioAsync(imageStream, $"{word}.jpg");
                        _logger.LogInformation("Successfully uploaded Unsplash image for word: {Word}", word);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to download/upload Unsplash image for word: {Word}", word);
                }

                flashCard.ImageKey = imageTempKey;

                // PRIORITIZE CONCISE MEANING
                // 1. Try to get a word-to-word translation from Google
                var wordTranslation = await _translatorClient.TranslateTextAsync(word, "vi");
                string? finalShortMeaning = wordTranslation.Success ? wordTranslation.Data : null;

                // 2. Aggressively clean the meaning if it looks like a definition
                if (!string.IsNullOrEmpty(finalShortMeaning))
                {
                    // If it contains a comma or semicolon, take only the first part
                    var parts = finalShortMeaning.Split(new[] { ',', ';', '.' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length > 0)
                    {
                        finalShortMeaning = parts[0].Trim();
                    }

                    // If it's still too long (more than 3 words), it's likely a definition
                    var words = finalShortMeaning.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (words.Length > 3)
                    {
                        _logger.LogInformation("Translation for '{Word}' is still too long: {Translation}. Using first 2 words.", word, finalShortMeaning);
                        finalShortMeaning = string.Join(" ", words.Take(2));
                    }
                }

                flashCard.Meaning = !string.IsNullOrEmpty(finalShortMeaning) ? finalShortMeaning : word;

                // Get first meaning as primary
                var primaryMeaning = dictData.Meanings.FirstOrDefault();
                if (primaryMeaning != null)
                {
                    flashCard.PartOfSpeech = primaryMeaning.PartOfSpeech;

                    // Get first definition data
                    var primaryDef = primaryMeaning.Definitions.FirstOrDefault();
                    if (primaryDef != null)
                    {
                        flashCard.Example = primaryDef.Example;

                        // Translate example if exists
                        if (!string.IsNullOrEmpty(primaryDef.Example))
                        {
                            var exampleTranslation = await TranslateTextAsync(primaryDef.Example, "vi");
                            if (exampleTranslation.Success && !string.IsNullOrEmpty(exampleTranslation.Data))
                            {
                                flashCard.ExampleTranslation = exampleTranslation.Data;
                            }
                        }
                    }

                    // Combine all synonyms
                    var allSynonyms = dictData.Meanings
                        .SelectMany(m => m.Synonyms)
                        .Distinct()
                        .Take(10)
                        .ToList();

                    if (allSynonyms.Count != 0)
                    {
                        flashCard.Synonyms = JsonSerializer.Serialize(allSynonyms);
                    }

                    // Combine all antonyms
                    var allAntonyms = dictData.Meanings
                        .SelectMany(m => m.Antonyms)
                        .Distinct()
                        .Take(10)
                        .ToList();

                    if (allAntonyms.Count != 0)
                    {
                        flashCard.Antonyms = JsonSerializer.Serialize(allAntonyms);
                    }
                }

                // Map to GenerateFlashCardPreviewResponseDto with URLs and temp keys
                var previewDto = new GenerateFlashCardPreviewResponseDto
                {
                    Word = flashCard.Word,
                    Pronunciation = flashCard.Pronunciation,
                    PartOfSpeech = flashCard.PartOfSpeech,
                    Meaning = flashCard.Meaning,
                    Example = flashCard.Example,
                    ExampleTranslation = flashCard.ExampleTranslation,
                    Synonyms = flashCard.Synonyms,
                    Antonyms = flashCard.Antonyms,
                    // URLs for preview
                    AudioUrl = !string.IsNullOrWhiteSpace(flashCard.AudioKey) ? _flashCardMediaService.BuildAudioUrl(flashCard.AudioKey) : null,
                    ImageUrl = !string.IsNullOrWhiteSpace(flashCard.ImageKey) ? _flashCardMediaService.BuildImageUrl(flashCard.ImageKey) : null,
                    // Temp keys for create operation
                    AudioTempKey = flashCard.AudioKey,
                    ImageTempKey = flashCard.ImageKey
                };

                response.Data = previewDto;
                response.Message = "FlashCard generated successfully for review";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating FlashCard from word: {Word}", word);
                response.Success = false;
                response.Message = "An error occurred while generating FlashCard data";
            }

            return response;
        }

        private async Task<ServiceResponse<string>> TranslateTextAsync(string text, string targetLanguage)
        {
            return await _translatorClient.TranslateTextAsync(text, targetLanguage);
        }

        private async Task<ServiceResponse<DictionaryLookupResultDto>> LookupWordWithAudioAsync(string word, string? targetLanguage = "vi")
        {
            var response = await LookupWordAsync(word, targetLanguage);

            // Try to extract audio URL from Oxford or Free Dictionary
            if (response.Success && response.Data != null)
            {
                var audioUrl = await ExtractAudioUrlAsync(word);
                response.Data.AudioUrl = audioUrl;
            }

            return response;
        }

        private async Task<string?> ExtractAudioUrlAsync(string word)
        {
            try
            {
                // Try Oxford API first
                var audioUrl = await _oxfordClient.ExtractAudioUrlAsync(word);
                if (!string.IsNullOrEmpty(audioUrl))
                {
                    return audioUrl;
                }

                // Fallback to Free Dictionary API
                var freeDictResult = await _freeDictionaryClient.LookupWordAsync(word);
                if (freeDictResult.Success && freeDictResult.Data != null)
                {
                    return freeDictResult.Data.AudioUrl;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract audio URL for word: {Word}", word);
            }

            return null;
        }

        private async Task<Stream?> DownloadAudioFromUrlAsync(string audioUrl)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync(audioUrl);

                if (response.IsSuccessStatusCode)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    return new MemoryStream(bytes);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download audio from URL: {Url}", audioUrl);
            }

            return null;
        }

        private async Task<string?> UploadAudioToMinioAsync(Stream audioStream, string fileName)
        {
            try
            {
                // Convert Stream to IFormFile for MinIO upload
                var memoryStream = new MemoryStream();
                await audioStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var formFile = new FormFile(memoryStream, 0, memoryStream.Length, "audio", fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "audio/mpeg"
                };

                // Sử dụng FlashCardMediaService - không cần biết bucket/folder
                return await _flashCardMediaService.UploadTempAudioAsync(formFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload audio to MinIO: {FileName}", fileName);
            }

            return null;
        }

        private async Task<Stream?> SearchAndDownloadImageFromUnsplashAsync(string query)
        {
            return await _unsplashClient.SearchAndDownloadImageAsync(query);
        }

        private async Task<string?> UploadImageToMinioAsync(Stream imageStream, string fileName)
        {
            try
            {
                // Convert Stream to IFormFile for MinIO upload
                var memoryStream = new MemoryStream();
                await imageStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var formFile = new FormFile(memoryStream, 0, memoryStream.Length, "image", fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "image/jpeg"
                };

                // Sử dụng FlashCardMediaService - không cần biết bucket/folder
                return await _flashCardMediaService.UploadTempImageAsync(formFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload image to MinIO: {FileName}", fileName);
            }

            return null;
        }
    }
}
