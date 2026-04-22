using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Pagination;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Services
{
    public interface IPaymentService
    {
       
        // Tạo payment record (POST /api/payments)
       
        Task<ServiceResponse<CreateInforPayment>> ProcessPaymentAsync(int userId, requestPayment request);

        // Tạo PayOS payment link (POST /api/payments/{paymentId}/payos)
        
        Task<ServiceResponse<PayOSLinkResponse>> CreatePayOSPaymentLinkAsync(int paymentId, int userId);

        
        // Confirm payment thủ công (POST /api/payments/confirm)
        
        Task<ServiceResponse<bool>> ConfirmPaymentAsync(CompletePayment paymentDto, int userId);

       
        // Xử lý PayOS webhook với signature verification (POST /api/payments/payos/webhook)
       
        Task<ServiceResponse<bool>> ProcessPayOSWebhookAsync(PayOSWebhookDto webhookData);

        
        // Xử lý webhook từ queue (retry mechanism) - không cần signature
        
        Task<ServiceResponse<bool>> ProcessWebhookFromQueueAsync(PayOSWebhookDto webhookData);

   
        //Confirm PayOS payment với validation PayOS status (GET /api/payments/payos/confirm/{paymentId})
      
        Task<ServiceResponse<bool>> ConfirmPayOSPaymentAsync(int paymentId, int userId);


        // Xử lý PayOS return URL (GET /api/payments/payos/return)
       
        Task<ServiceResponse<PayOSReturnResult>> ProcessPayOSReturnAsync(
            string code, 
            string desc, 
            string data, 
            string? orderCode = null, 
            string? status = null);

    
        // Lấy lịch sử giao dịch với phân trang (GET /api/payments/history)
 
        Task<ServiceResponse<PagedResult<TransactionHistoryDto>>> GetTransactionHistoryAsync(int userId, PageRequest request);

    
        // Lấy chi tiết giao dịch (GET /api/payments/{paymentId})
    
        Task<ServiceResponse<TransactionDetailDto>> GetTransactionDetailAsync(int paymentId, int userId);

       
        //Lấy danh sách webhook lỗi (DeadLetter) - Dành cho Admin
      
        Task<ServiceResponse<IEnumerable<PaymentWebhookQueue>>> GetFailedWebhooksAsync();

      
        // Thử lại một webhook lỗi - Dành cho Admin
        Task<ServiceResponse<bool>> RetryWebhookAsync(int webhookId);

        // Lấy tất cả giao dịch trong hệ thống - Dành cho Admin
        Task<ServiceResponse<PagedResult<TransactionHistoryDto>>> GetAllTransactionsAsync(
            AdminTransactionRequest request);
    }
}
