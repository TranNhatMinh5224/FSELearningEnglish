using LearningEnglish.Application.Interface.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningEnglish.API.Controller.Admin.AdminManagement
{
    [ApiController]
    [Route("api/admin/payments")]
    [Authorize(Roles = "SuperAdmin,FinanceAdmin")]
    public class AdminPaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public AdminPaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet("failed-webhooks")]
        public async Task<IActionResult> GetFailedWebhooks()
        {
            var response = await _paymentService.GetFailedWebhooksAsync();
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("failed-webhooks/{webhookId}/retry")]
        public async Task<IActionResult> RetryWebhook(int webhookId)
        {
            var response = await _paymentService.RetryWebhookAsync(webhookId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
