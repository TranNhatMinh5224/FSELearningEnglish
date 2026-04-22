using LearningEnglish.Domain.Enums;

namespace LearningEnglish.Domain.Entities;

public class WalletTransaction
{
    public int WalletTransactionId { get; set; }
    public int UserId { get; set; }
    
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    
    public WalletTransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User User { get; set; } = null!;
}
