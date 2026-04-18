using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Common;

namespace LearningEnglish.Application.Interface.Services.AI;

public interface IAiChatService
{
    /// <summary>
    /// Gửi câu hỏi đến hệ thống Chatbot AI và nhận phản hồi dựa trên kiến thức Wiki.
    /// </summary>
    /// <param name="userId">ID người dùng (nếu cần cá nhân hóa context).</param>
    /// <param name="request">DTO chứa câu hỏi của người dùng.</param>
    /// <returns>DTO phản hồi từ AI.</returns>
    Task<ServiceResponse<ChatResponseDto>> GetChatResponseAsync(int userId, ChatRequestDto request);
}
