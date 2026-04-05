namespace LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini.Models;

internal sealed class GeminiEmbeddingResponse
{
    public EmbeddingPayload? Embedding { get; set; }
}

internal sealed class EmbeddingPayload
{
    public List<float>? Values { get; set; }
}
