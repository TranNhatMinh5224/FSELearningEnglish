
using LearningEnglish.Domain.Enums;
namespace LearningEnglish.Application.DTOs
{
    public class requestPayment
    {
        public int ProductId { get; set; }
        public ProductType typeproduct { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty; // UUID from client to prevent duplicate payments
        public PaymentGateway Gateway { get; set; } = PaymentGateway.PayOs; // Default to PayOs
    }
    // tạo thông tin thanh toán trả về cho client
    public class CreateInforPayment
    {
        public int PaymentId { get; set; }
        public ProductType ProductType { get; set; }
        public int ProductId { get; set; }

        public decimal Amount { get; set; }


    }
    // DTO cho thông tin thanh toán client trả cho server
    public class CompletePayment
    {
        public int PaymentId { get; set; }

        public int ProductId { get; set; }
        public ProductType ProductType { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;

    }

    // PayOS DTOs
    public class CreatePayOSLinkRequest
    {
        public int PaymentId { get; set; }
    }

    public class PayOSLinkResponse
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public int PaymentId { get; set; }
        public string Bin { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string QrCode { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
    }

    public class PayOSWebhookDto
    {
        public string Code { get; set; } = string.Empty; // "00" = thành công
        public long OrderCode { get; set; }
        public string Desc { get; set; } = string.Empty;
        public string Data { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // "PAID", "PENDING", "PROCESSING", "CANCELLED"
    }
}
