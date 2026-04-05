namespace LearningEnglish.Application.Interface.Infrastructure.ChatBotAI
{
    public interface IEmbeddingService
    {
        // Tạo embedding vector từ văn bản
        Task<float[]> CreateEmbeddingAsync(string input);
    }
   
}
     