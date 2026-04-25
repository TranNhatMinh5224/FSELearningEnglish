using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;
using LearningEnglish.API.Extensions;
using Microsoft.Extensions.Configuration;
using LearningEnglish.Application.Common.Pagination;
using Microsoft.Extensions.Logging;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services;

namespace LearningEnglish.API.Controller.User
{
    [ApiController]
    [Route("api/user/payments")]
    [Authorize(Roles = "Student,Teacher")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentController> _logger;
        private readonly IPayOSService _payOSService;

        public PaymentController(
            IPaymentService paymentService,
            IConfiguration configuration,
            ILogger<PaymentController> logger,
            IPayOSService payOSService)
        {
            _paymentService = paymentService;
            _configuration = configuration;
            _logger = logger;
            _payOSService = payOSService;
        }

       
        [HttpPost("process")]
        public async Task<IActionResult> ProcessPayment([FromBody] requestPayment request)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.ProcessPaymentAsync(userId, request);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }


        // endpoint Student lấy lịch sử giao dịch (phân trang)
        [HttpGet("history")]
        public async Task<IActionResult> GetTransactionHistory([FromQuery] PageRequest request)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.GetTransactionHistoryAsync(userId, request);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        // endpoint Student lấy chi tiết giao dịch theo paymentId
        [HttpGet("transaction/{paymentId}")]
        public async Task<IActionResult> GetTransactionDetail(int paymentId)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.GetTransactionDetailAsync(paymentId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        // endpoint Student tạo link thanh toán PayOS
        [HttpPost("payos/create-link/{paymentId}")]
        public async Task<IActionResult> CreatePayOSLink(int paymentId)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.CreatePayOSPaymentLinkAsync(paymentId, userId);
            
            if (!result.Success)
            {
                if (result.Message?.Contains("PayOS error") == true || 
                    result.Message?.Contains("PayOS") == true)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = result.Message,
                        statusCode = 400 
                    });
                }
                return StatusCode(result.StatusCode, result);
            }
            
            return Ok(result);
        }

        // endpoint PayOS return URL
        [HttpGet("payos/return")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOSReturn(
            [FromQuery] string? code,
            [FromQuery] string? desc,
            [FromQuery] string? data,
            [FromQuery] long? orderCode,
            [FromQuery] bool? cancel,
            [FromQuery] string? status,
            [FromQuery] string? signature)
        {
            var frontendUrl = GetFrontendBaseUrl();

            if (cancel == true || string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Payment cancelled: OrderCode={OrderCode}", orderCode);
                return Redirect($"{frontendUrl}/payment-failed?reason=cancelled&orderCode={orderCode}");
            }

            // If PayOS provided a signature for return data, verify it before doing anything else.
            // Even with a valid signature, we will still verify status with PayOS API in the service layer.
            if (!string.IsNullOrEmpty(data) && !string.IsNullOrEmpty(signature))
            {
                var isValidSignature = await _payOSService.VerifyWebhookSignature(data, signature);
                if (!isValidSignature)
                {
                    _logger.LogWarning("Invalid PayOS return signature: OrderCode={OrderCode}", orderCode);
                    return Redirect($"{frontendUrl}/payment-failed?reason=invalid_signature&orderCode={orderCode}");
                }
            }

            var result = await _paymentService.ProcessPayOSReturnAsync(
                code ?? string.Empty, 
                desc ?? string.Empty, 
                data ?? string.Empty, 
                orderCode?.ToString(), 
                status);
            
            if (result.Success && result.Data != null && !string.IsNullOrEmpty(result.Data.RedirectUrl))
            {
                return Redirect(result.Data.RedirectUrl);
            }
            
            return Redirect($"{frontendUrl}/payment-failed?reason={Uri.EscapeDataString(result.Message ?? "Server error")}");
        }

        // endpoint PayOS cancel URL
        [HttpGet("payos/cancel")]
        [AllowAnonymous]
        public IActionResult PayOSCancel([FromQuery] long? orderCode)
        {
            var frontendUrl = GetFrontendBaseUrl();
            _logger.LogInformation("Payment cancelled by user: OrderCode={OrderCode}", orderCode);
            
            if (orderCode.HasValue)
            {
                var paymentRes = await _paymentService.ProcessPayOSReturnAsync("00", "cancelled", string.Empty, orderCode.Value.ToString(), "CANCELLED");
                // Fallback: manually cancel if ProcessPayOSReturnAsync doesn't do it
            }

            return Redirect($"{frontendUrl}/payment-failed?reason=cancelled&orderCode={orderCode}");
        }

        // endpoint PayOS webhook
        [HttpPost("payos/webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOSWebhook([FromBody] PayOSWebhookDto webhookData)
        {
            _logger.LogInformation("PayOS Webhook: OrderCode={OrderCode}", webhookData.OrderCode);
            
            var result = await _paymentService.ProcessPayOSWebhookAsync(webhookData);
            
            return result.Success 
                ? Ok(new { message = "Success", orderCode = webhookData.OrderCode }) 
                : StatusCode(result.StatusCode, new { message = result.Message });
        }

        // endpoint Student xác nhận thanh toán PayOS
        [HttpPost("payos/confirm/{paymentId}")]
        public async Task<IActionResult> ConfirmPayOSPayment(int paymentId)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.ConfirmPayOSPaymentAsync(paymentId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        // endpoint Student chủ động hủy giao dịch
        [HttpPost("cancel/{paymentId}")]
        public async Task<IActionResult> CancelPayment(int paymentId)
        {
            var userId = User.GetUserId();
            var result = await _paymentService.CancelPaymentAsync(paymentId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        private string GetFrontendBaseUrl()
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"]?.Trim();
            if (string.IsNullOrWhiteSpace(frontendUrl) || !Uri.TryCreate(frontendUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("Frontend:BaseUrl is missing or invalid. Please configure a valid absolute URL.");
            }

            return frontendUrl.TrimEnd('/');
        }
    }
}
