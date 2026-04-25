using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Configurations;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LearningEnglish.Infrastructure.Services
{
    public class FreeDictionaryClient : IFreeDictionaryClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FreeDictionaryClient> _logger;
        private readonly FreeDictionaryOptions _options;

        public FreeDictionaryClient(HttpClient httpClient, ILogger<FreeDictionaryClient> logger, IOptions<FreeDictionaryOptions> options)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<ServiceResponse<DictionaryLookupResultDto>> LookupWordAsync(string word)
        {
            var response = new ServiceResponse<DictionaryLookupResultDto>();

            try
            {
                var apiUrl = $"{_options.BaseUrl}/{word.Trim().ToLower()}";
                var apiResponse = await _httpClient.GetAsync(apiUrl);

                if (!apiResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Free Dictionary API returned {StatusCode} for word: {Word}", apiResponse.StatusCode, word);
                    response.Success = false;
                    response.Message = $"Word '{word}' not found in dictionary";
                    return response;
                }

                var jsonContent = await apiResponse.Content.ReadAsStringAsync();
                
                // Using a generic way or mapping to the specific classes if we have them
                // I will use JsonDocument to avoid relying on internal DTOs if they are tight-coupled, or since we know DictionaryLookupResultDto, we will map it manually or fetch it via DTO.
                // But we know DictionaryApiResponse exists in Application layer, let's use it.
                var dictionaryData = JsonSerializer.Deserialize<List<DictionaryApiResponse>>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (dictionaryData == null || dictionaryData.Count == 0)
                {
                    response.Success = false;
                    response.Message = "No data found for this word";
                    return response;
                }

                var firstEntry = dictionaryData.First();
                var result = new DictionaryLookupResultDto
                {
                    Word = firstEntry.Word ?? word,
                    Phonetic = firstEntry.Phonetic ?? firstEntry.Phonetics?.FirstOrDefault()?.Text,
                    SourceUrl = firstEntry.SourceUrls?.FirstOrDefault(),
                    AudioUrl = firstEntry.Phonetics?.FirstOrDefault(p => !string.IsNullOrEmpty(p.Audio))?.Audio
                };

                if (firstEntry.Meanings != null)
                {
                    foreach (var meaning in firstEntry.Meanings)
                    {
                        var meaningDto = new DictionaryMeaningDto
                        {
                            PartOfSpeech = meaning.PartOfSpeech ?? "unknown"
                        };

                        if (meaning.Definitions != null)
                        {
                            foreach (var def in meaning.Definitions.Take(3))
                            {
                                meaningDto.Definitions.Add(new DictionaryDefinitionDto
                                {
                                    Definition = def.Definition ?? "",
                                    Example = def.Example
                                });
                            }
                        }

                        if (meaning.Synonyms != null)
                        {
                            meaningDto.Synonyms = meaning.Synonyms.Take(10).ToList();
                        }

                        if (meaning.Antonyms != null)
                        {
                            meaningDto.Antonyms = meaning.Antonyms.Take(10).ToList();
                        }

                        result.Meanings.Add(meaningDto);
                    }
                }

                response.Data = result;
                response.Message = "Word lookup successful from Free Dictionary";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up word in Free Dictionary: {Word}", word);
                response.Success = false;
                response.Message = "Dictionary service unavailable";
            }

            return response;
        }
    }
}
