namespace LearningEnglish.Application.Cofigurations;

public class ChatBotAIOptions
{
    // Provider name for observability/config only (Gemini, OpenAI, AzureOpenAI, ...)
    public string Provider { get; set; } = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;

    // Generic model fields for chatbot use-cases
    public string ChatModel { get; set; } = string.Empty;
    public string EmbeddingModel { get; set; } = string.Empty;

    // Legacy compatibility with old config schema (Gemini:Model)
    public string Model { get; set; } = string.Empty;

    public int EmbeddingDimension { get; set; }
}
