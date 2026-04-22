

using LearningEnglish.Domain.Enums;
namespace LearningEnglish.Application.DTOs
{
    public class TransactionHistoryDto
    {
        public int PaymentId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public ProductType ProductType { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? ProviderTransactionId { get; set; }
        public string UserDisplayName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
    }

    public class TransactionDetailDto
    {
        public int PaymentId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public ProductType ProductType { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? ProviderTransactionId { get; set; }
    }

    public class AdminTransactionRequest : LearningEnglish.Application.Common.Pagination.PageRequest
    {
        public PaymentStatus? Status { get; set; }
        public PaymentGateway? Gateway { get; set; }
        public string? SearchTerm { get; set; } // Tìm theo email user, order code...
    }
}
