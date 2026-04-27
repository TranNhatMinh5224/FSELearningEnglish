
using Microsoft.SemanticKernel.Embeddings; 
using Microsoft.Extensions.AI;
using LearningEnglish.Application.Interface.Services.AI;
using Microsoft.SemanticKernel; 

namespace LearningEnglish.Infrastructure.Services.AI;

public class EmbeddingService : IEmbeddingService // implement interface IEmbeddingService
{
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embeddingGenerator; 
    public EmbeddingService(IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator) 
    {
        _embeddingGenerator = embeddingGenerator;
    }
    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<float>();

        var result = await _embeddingGenerator.GenerateAsync(new[] { text });
        return result.First().Vector.ToArray();
    } 

  

   
}
