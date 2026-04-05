using System.Net.Http.Json;
using System.Text.Json;
using LearningEnglish.Application.Cofigurations;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini.Models;
using Microsoft.Extensions.Options;

namespace LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini;

public class GeminiEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly ChatBotAIOptions _aiOptions;
    private const string DefaultEndpoint = "https://generativelanguage.googleapis.com/v1beta";
    private const string DefaultEmbeddingModel = "gemini-embedding-001";

    public GeminiEmbeddingService(HttpClient httpClient, IOptions<ChatBotAIOptions> aiOptions)
    {
        _httpClient = httpClient;
        _aiOptions = aiOptions.Value;
    }

    public async Task<float[]> CreateEmbeddingAsync(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            throw new ArgumentException("Input text cannot be null or empty.", nameof(input));

        if (string.IsNullOrWhiteSpace(_aiOptions.ApiKey))
            throw new InvalidOperationException("ChatBotAI API key is not configured.");

        var endpoint = string.IsNullOrWhiteSpace(_aiOptions.Endpoint)
            ? DefaultEndpoint
            : _aiOptions.Endpoint.TrimEnd('/');

        var embeddingModel = !string.IsNullOrWhiteSpace(_aiOptions.EmbeddingModel)
            ? _aiOptions.EmbeddingModel
            : (!string.IsNullOrWhiteSpace(_aiOptions.Model) &&
               _aiOptions.Model.Contains("embedding", StringComparison.OrdinalIgnoreCase)
                ? _aiOptions.Model
                : DefaultEmbeddingModel);

        var url = $"{endpoint}/models/{embeddingModel}:embedContent?key={_aiOptions.ApiKey}";

        var requestBody = new
        {
            content = new
            {
                parts = new[]
                {
                    new { text = input }
                }
            }
        };

        using var response = await _httpClient.PostAsJsonAsync(url, requestBody);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Gemini embedding API failed: {(int)response.StatusCode} - {json}");

        var embeddingResponse = JsonSerializer.Deserialize<GeminiEmbeddingResponse>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        var values = embeddingResponse?.Embedding?.Values;
        if (values == null || values.Count == 0)
            throw new InvalidOperationException("Gemini embedding response is empty.");

        return values.ToArray();
    }
}
