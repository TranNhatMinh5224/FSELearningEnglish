namespace LearningEnglish.Application.Interface.Services.AI;

public interface IEmbeddingService
{
    
    // Chuyển đổi một đoạn văn bản (Markdown Wiki) thành mảng Vector số thực.
    
    // <param name="text">Nội dung văn bản cần nhúng.</param>
   
    Task<float[]> GenerateEmbeddingAsync(string text);
    
}
