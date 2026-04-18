#pragma warning disable SKEXP0001
using Microsoft.SemanticKernel.Embeddings; // cái này chưa interface   ITextEmbeddingGenerationService 
using LearningEnglish.Application.Interface.Services.AI;
using Microsoft.SemanticKernel; // 

namespace LearningEnglish.Infrastructure.Services.AI;

public class EmbeddingService : IEmbeddingService // implement interface IEmbeddingService
{
    private readonly ITextEmbeddingGenerationService _embeddingService; // khai báo service ITextEmbeddingGenerationService = embeddingService

    public EmbeddingService(ITextEmbeddingGenerationService embeddingService) // khai báo DI dùng để inject service ITextEmbeddingGenerationService vào EmbeddingService  
    {
        _embeddingService = embeddingService;
    }
    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<float>();

        // Gọi API Google qua Semantic Kernel . đầu vào là text 
        var result = await _embeddingService.GenerateEmbeddingAsync(text);
        return result.ToArray();
    } 

  

   
}
