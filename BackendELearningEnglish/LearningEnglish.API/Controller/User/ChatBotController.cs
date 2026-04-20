using LearningEnglish.Application.DTOs.Common;
using LearningEnglish.Application.Interface.Services.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LearningEnglish.API.Controller.User;

[Route("api/user/chatbot")]
[ApiController]
[Authorize]
public class ChatBotController : ControllerBase
{
    private readonly IAiChatService _aiChatService;

    public ChatBotController(IAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }
    // POST: api/user/chatbot/chat hỗ trợ mua khóa học ....

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message cannot be empty");
        }

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var response = await _aiChatService.GetChatResponseAsync(userId, request);

        if (!response.Success)
        {
            return BadRequest(response.Message);
        }

        return Ok(response.Data);
    }
}
