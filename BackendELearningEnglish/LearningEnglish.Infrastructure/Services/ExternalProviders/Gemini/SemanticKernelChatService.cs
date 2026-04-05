using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini;

/// <summary>
/// Implements <see cref="ISemanticChatService"/> using Microsoft Semantic Kernel
/// with the Google AI Gemini chat completion connector.
/// </summary>
public class SemanticKernelChatService : ISemanticChatService
{
    private readonly Kernel _kernel;

    public SemanticKernelChatService(Kernel kernel)
    {
        _kernel = kernel;
    }

    public async Task<string> GetChatCompletionAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        var chatHistory = new ChatHistory(systemPrompt);
        chatHistory.AddUserMessage(userPrompt);

        var chatService = _kernel.GetRequiredService<IChatCompletionService>();
        var result = await chatService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);

        return result?.Content ?? string.Empty;
    }
}
