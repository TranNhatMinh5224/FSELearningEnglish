using LearningEnglish.Application.DTOs.ChatBotAI;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using Microsoft.AspNetCore.Mvc;

namespace LearningEnglish.API.Controller.Common;

/// <summary>
/// Public ChatBot controller — không cần authentication.
/// Tư vấn khóa học hệ thống và gói nâng cấp Teacher dựa trên câu hỏi của người dùng.
/// </summary>
[ApiController]
[Route("api/public/chatbot")]
public class ChatBotController : ControllerBase
{
    private readonly IChatBotAIService _chatBotAiService;

    public ChatBotController(IChatBotAIService chatBotAiService)
    {
        _chatBotAiService = chatBotAiService;
    }

    /// <summary>
    /// POST: api/public/chatbot/consult
    /// Gửi câu hỏi để nhận tư vấn khóa học hệ thống/gói Teacher từ AI.
    /// </summary>
    [HttpPost("consult")]
    [ProducesResponseType(typeof(ChatBotConsultResponseDto), 200)]
    public async Task<IActionResult> Consult([FromBody] ChatBotConsultRequestDto request)
    {
        var result = await _chatBotAiService.GetChatBotResponseAsync(request);
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }
}
