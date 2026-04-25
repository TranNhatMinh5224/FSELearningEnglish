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
    public class OxfordClient : IOxfordClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OxfordClient> _logger;
        private readonly OxfordDictionaryOptions _options;

        public OxfordClient(HttpClient httpClient, ILogger<OxfordClient> logger, IOptions<OxfordDictionaryOptions> options)
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
                if (string.IsNullOrWhiteSpace(_options.AppId) || string.IsNullOrWhiteSpace(_options.AppKey))
                {
                    response.Success = false;
                    response.Message = "Oxford API credentials not configured";
                    return response;
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("app_id", _options.AppId);
                _httpClient.DefaultRequestHeaders.Add("app_key", _options.AppKey);

                var apiUrl = $"{_options.BaseUrl}/entries/en-us/{word.Trim().ToLower()}";
                var apiResponse = await _httpClient.GetAsync(apiUrl);

                if (!apiResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Oxford API returned {StatusCode} for word: {Word}", apiResponse.StatusCode, word);
                    response.Success = false;
                    response.Message = $"Word '{word}' not found in Oxford dictionary";
                    return response;
                }

                var jsonContent = await apiResponse.Content.ReadAsStringAsync();
                var oxfordData = JsonSerializer.Deserialize<OxfordApiResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (oxfordData?.Results == null || oxfordData.Results.Count == 0)
                {
                    response.Success = false;
                    response.Message = "No data found in Oxford dictionary";
                    return response;
                }

                var result = new DictionaryLookupResultDto
                {
                    Word = oxfordData.Id ?? word
                };

                foreach (var oxfordResult in oxfordData.Results)
                {
                    if (oxfordResult.LexicalEntries == null) continue;

                    foreach (var lexEntry in oxfordResult.LexicalEntries)
                    {
                        var meaningDto = new DictionaryMeaningDto
                        {
                            PartOfSpeech = lexEntry.LexicalCategory?.Text ?? "unknown"
                        };

                        if (lexEntry.Pronunciations != null && lexEntry.Pronunciations.Count != 0)
                        {
                            result.Phonetic = lexEntry.Pronunciations.First().PhoneticSpelling;
                        }

                        if (lexEntry.Entries != null)
                        {
                            foreach (var entry in lexEntry.Entries)
                            {
                                if (entry.Senses == null) continue;

                                foreach (var sense in entry.Senses.Take(3))
                                {
                                    var definition = sense.Definitions?.FirstOrDefault();
                                    if (!string.IsNullOrEmpty(definition))
                                    {
                                        meaningDto.Definitions.Add(new DictionaryDefinitionDto
                                        {
                                            Definition = definition,
                                            Example = sense.Examples?.FirstOrDefault()?.Text
                                        });
                                    }

                                    if (sense.Synonyms != null)
                                    {
                                        meaningDto.Synonyms.AddRange(sense.Synonyms.Select(s => s.Text ?? "").Where(t => !string.IsNullOrEmpty(t)));
                                    }

                                    if (sense.Antonyms != null)
                                    {
                                        meaningDto.Antonyms.AddRange(sense.Antonyms.Select(a => a.Text ?? "").Where(t => !string.IsNullOrEmpty(t)));
                                    }
                                }
                            }
                        }

                        if (meaningDto.Definitions.Count != 0)
                        {
                            result.Meanings.Add(meaningDto);
                        }
                    }
                }

                if (result.Meanings.Count == 0)
                {
                    response.Success = false;
                    response.Message = "No definitions found in Oxford dictionary";
                    return response;
                }

                response.Data = result;
                response.Message = "Word lookup successful from Oxford Dictionary";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up word from Oxford API: {Word}", word);
                response.Success = false;
                response.Message = "An error occurred during Oxford dictionary lookup";
            }

            return response;
        }

        public async Task<string?> ExtractAudioUrlAsync(string word)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_options.AppId) || string.IsNullOrWhiteSpace(_options.AppKey))
                {
                    return null;
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("app_id", _options.AppId);
                _httpClient.DefaultRequestHeaders.Add("app_key", _options.AppKey);

                var apiUrl = $"{_options.BaseUrl}/entries/en-us/{word.Trim().ToLower()}";
                var apiResponse = await _httpClient.GetAsync(apiUrl);

                if (apiResponse.IsSuccessStatusCode)
                {
                    var jsonContent = await apiResponse.Content.ReadAsStringAsync();
                    var oxfordData = JsonSerializer.Deserialize<OxfordApiResponse>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    var audioFile = oxfordData?.Results
                        ?.SelectMany(r => r.LexicalEntries ?? new List<OxfordLexicalEntry>())
                        ?.SelectMany(le => le.Pronunciations ?? new List<OxfordPronunciation>())
                        ?.FirstOrDefault(p => !string.IsNullOrEmpty(p.AudioFile))
                        ?.AudioFile;

                    if (!string.IsNullOrEmpty(audioFile))
                    {
                        return audioFile;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract audio from Oxford API for word: {Word}", word);
            }

            return null;
        }
    }
}
