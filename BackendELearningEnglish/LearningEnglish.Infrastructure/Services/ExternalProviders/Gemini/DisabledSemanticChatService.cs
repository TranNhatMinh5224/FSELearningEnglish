using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini;


public class DisabledSemanticChatService : ISemanticChatService
{
    private readonly ILogger<DisabledSemanticChatService> _logger;

    public DisabledSemanticChatService(ILogger<DisabledSemanticChatService> logger)
    {
        _logger = logger;
    }

    public Task<string> GetChatCompletionAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "ChatBotAI is not configured (missing ApiKey). Returning a fallback response.");

        return Task.FromResult(
            "Chatbot AI chưa được cấu hình (thiếu ChatBotAI:ApiKey/Gemini:ApiKey). " +
            "Vui lòng cấu hình ApiKey để sử dụng tính năng này.");
    }
}
