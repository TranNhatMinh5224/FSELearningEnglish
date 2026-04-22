using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.IPayment;
using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Strategies.Payment
{
    public class TopUpPaymentProcessor : IPaymentStrategy
    {
        public ProductType ProductType => ProductType.TopUp;

        private readonly IWalletService _walletService;
        private readonly INotificationRepository _notificationRepository;
        private readonly ILogger<TopUpPaymentProcessor> _logger;

        public TopUpPaymentProcessor(
            IWalletService walletService,
            INotificationRepository notificationRepository,
            ILogger<TopUpPaymentProcessor> logger)
        {
            _walletService = walletService;
            _notificationRepository = notificationRepository;
            _logger = logger;
        }

        public async Task<ServiceResponse<bool>> ProcessPostPaymentAsync(int userId, int productId, int paymentId)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                _logger.LogInformation("Xử lý nạp tiền sau thanh toán: PaymentId={PaymentId}, UserId={UserId}, Amount={Amount}", 
                    paymentId, userId, productId);

                // productId ở đây chính là số tiền (Amount) do ValidateProductAsync trả vềProductId làm Amount
                decimal amount = productId;

                var topUpResult = await _walletService.TopUpAsync(userId, amount, $"PAYMENT-{paymentId}");

                if (!topUpResult.Success)
                {
                    _logger.LogError("Nạp tiền vào ví thất bại cho Payment {PaymentId}: {Message}", paymentId, topUpResult.Message);
                    response.Success = false;
                    response.Message = "Thanh toán thành công nhưng không thể cộng tiền vào ví: " + topUpResult.Message;
                    return response;
                }

                // Tạo notification nạp tiền thành công
                try
                {
                    var notification = new Notification
                    {
                        UserId = userId,
                        Title = "Nạp tiền thành công",
                        Message = $"Bạn đã nạp thành công {amount:N0} VNĐ vào ví. Chúc bạn học tốt!",
                        Type = NotificationType.PaymentSuccess,
                        RelatedEntityType = "Wallet",
                        RelatedEntityId = paymentId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _notificationRepository.AddAsync(notification);
                }
                catch (Exception notifEx)
                {
                    _logger.LogWarning(notifEx, "Tạo notification thất bại cho nạp tiền {PaymentId}", paymentId);
                }

                response.Data = true;
                response.Success = true;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý post-payment cho TopUp {Amount}, User {UserId}", productId, userId);
                response.Success = false;
                response.Message = "Đã xảy ra lỗi khi cộng tiền vào ví";
                return response;
            }
        }

        public async Task<ServiceResponse<decimal>> ValidateProductAsync(int productId)
        {
            var response = new ServiceResponse<decimal>();

            try
            {
                // Đối với TopUp, ProductId chính là số tiền (VND)
                if (productId <= 0)
                {
                    response.Success = false;
                    response.Message = "Số tiền nạp không hợp lệ";
                    return response;
                }

                response.Success = true;
                response.Data = (decimal)productId;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi validate TopUp amount {Amount}", productId);
                response.Success = false;
                response.Message = "Đã xảy ra lỗi khi kiểm tra số tiền nạp";
                return response;
            }
        }

        public async Task<string> GetProductNameAsync(int productId)
        {
            return $"Nạp tiền vào ví ({productId:N0} VNĐ)";
        }
    }
}
