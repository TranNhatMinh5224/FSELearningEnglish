namespace LearningEnglish.Application.Configurations
{
    public class GeminiOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string ChatModel { get; set; } = "gemini-flash-latest";
        public string EmbeddingModel { get; set; } = "gemini-embedding-001";
    }
}
