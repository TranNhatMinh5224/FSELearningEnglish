using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.ChatBotAI;

namespace LearningEnglish.Application.Interface.Infrastructure.ChatBotAI
{
    public interface IChatBotAIService
    {
        Task<ServiceResponse<ChatBotConsultResponseDto>> GetChatBotResponseAsync(ChatBotConsultRequestDto request, CancellationToken cancellationToken = default);
    }
}