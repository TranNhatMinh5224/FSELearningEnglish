using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Configurations;
using LearningEnglish.Application.Interface.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LearningEnglish.Infrastructure.Services
{
    public class GoogleTranslateClient : ITranslatorClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GoogleTranslateClient> _logger;
        private readonly GoogleTranslateOptions _options;

        public GoogleTranslateClient(HttpClient httpClient, ILogger<GoogleTranslateClient> logger, IOptions<GoogleTranslateOptions> options)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<ServiceResponse<string>> TranslateTextAsync(string text, string targetLanguage = "vi")
        {
            var response = new ServiceResponse<string>();

            try
            {
                var url = $"{_options.BaseUrl}?client=gtx&sl=en&tl={targetLanguage}&dt=t&q={Uri.EscapeDataString(text)}";
                var apiResponse = await _httpClient.GetAsync(url);
                
                if (apiResponse.IsSuccessStatusCode)
                {
                    var content = await apiResponse.Content.ReadAsStringAsync();
                    var translatedText = ParseGoogleTranslateResponse(content);

                    response.Data = translatedText ?? text;
                    response.Message = "Translation successful";
                }
                else
                {
                    response.Data = text;
                    response.Message = "Translation unavailable, using original text";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Translation failed, using original text");
                response.Data = text;
            }

            return response;
        }

        private static string? ParseGoogleTranslateResponse(string json)
        {
            try
            {
                var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var firstArray = root[0];
                    if (firstArray.ValueKind == JsonValueKind.Array && firstArray.GetArrayLength() > 0)
                    {
                        var translation = firstArray[0];
                        if (translation.ValueKind == JsonValueKind.Array && translation.GetArrayLength() > 0)
                        {
                            return translation[0].GetString();
                        }
                    }
                }
            }
            catch
            {
                // Ignore parse errors
            }
            return null;
        }
    }
}
