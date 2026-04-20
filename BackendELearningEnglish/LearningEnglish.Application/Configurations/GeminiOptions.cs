namespace LearningEnglish.Application.Configurations
{
    public class GeminiOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string ChatModel { get; set; } = "gemini-2.5-flash";
        public string EmbeddingModel { get; set; } = "gemini-embedding-001";
    }
}
