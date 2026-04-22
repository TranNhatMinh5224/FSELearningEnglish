using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Payment;
using LearningEnglish.API.Extensions;
using LearningEnglish.Application.Interface.Services.IPayment;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.API.Controller.User.UserPayment
{
    [ApiController]
    [Route("api/user/wallet")]
    [Authorize(Roles = "Student,Teacher")]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly ILogger<WalletController> _logger;

        public WalletController(
            IWalletService walletService,
            ILogger<WalletController> logger)
        {
            _walletService = walletService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy số dư hiện tại của người dùng
        /// </summary>
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            var userId = User.GetUserId();
            var result = await _walletService.GetBalanceAsync(userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy lịch sử giao dịch ví của người dùng
        /// </summary>
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactionHistory()
        {
            var userId = User.GetUserId();
            var result = await _walletService.GetTransactionHistoryAsync(userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }
    }
}
