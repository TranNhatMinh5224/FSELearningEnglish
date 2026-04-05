namespace LearningEnglish.Application.Interface;

[Obsolete("Use IChatBotAIService in Interface/Infrastructure/ChatBotAI instead of provider-specific interfaces.")]
public interface IGeminiService
{
    Task<GeminiResponse> GenerateContentAsync(string prompt, CancellationToken cancellationToken = default);
}

public class GeminiResponse
{
    public string Content { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
