using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using LearningEnglish.Application.Configurations;
using LearningEnglish.Application.Interface.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LearningEnglish.Infrastructure.Services
{
    public class UnsplashClient : IUnsplashClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UnsplashClient> _logger;
        private readonly UnsplashOptions _options;

        public UnsplashClient(HttpClient httpClient, ILogger<UnsplashClient> logger, IOptions<UnsplashOptions> options)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<Stream?> SearchAndDownloadImageAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_options.AccessKey))
                {
                    _logger.LogWarning("Unsplash Access Key not configured");
                    return null;
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Client-ID {_options.AccessKey}");
                
                var searchUrl = $"{_options.BaseUrl}/search/photos?query={Uri.EscapeDataString(query)}&per_page=1&orientation=landscape";
                var searchResponse = await _httpClient.GetAsync(searchUrl);

                if (!searchResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Unsplash search failed with status: {StatusCode} for query: {Query}",
                        searchResponse.StatusCode, query);
                    return null;
                }

                var searchContent = await searchResponse.Content.ReadAsStringAsync();
                
                // Instead of strongly typing to UnsplashSearchResponse, using JsonDocument 
                // to avoid moving DTOs if they aren't globally needed, but since it's infrastructure, parsing doc is quick and clean.
                using var doc = JsonDocument.Parse(searchContent);
                var root = doc.RootElement;
                if (root.TryGetProperty("results", out var results) && results.ValueKind == JsonValueKind.Array && results.GetArrayLength() > 0)
                {
                    var firstImage = results[0];
                    if (firstImage.TryGetProperty("urls", out var urls) && urls.TryGetProperty("regular", out var regularUrl))
                    {
                        var imageUrl = regularUrl.GetString();
                        if (!string.IsNullOrEmpty(imageUrl))
                        {
                            _logger.LogInformation("Found Unsplash image for '{Query}': {Url}", query, imageUrl);

                            var imageResponse = await _httpClient.GetAsync(imageUrl);
                            if (imageResponse.IsSuccessStatusCode)
                            {
                                var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
                                return new MemoryStream(imageBytes);
                            }
                            _logger.LogWarning("Failed to download Unsplash image from URL: {Url}", imageUrl);
                        }
                    }
                }

                _logger.LogWarning("No images found on Unsplash for query: {Query}", query);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching/downloading image from Unsplash for query: {Query}", query);
                return null;
            }
        }
    }
}
