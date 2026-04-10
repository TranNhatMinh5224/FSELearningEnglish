namespace LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;

/// <summary>
/// Semantic Kernel-powered chat completion service.
/// Wraps SK Kernel to generate natural language answers from a system prompt + user prompt.
/// </summary>
public interface ISemanticChatService
{
    
    Task<string> GetChatCompletionAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}
