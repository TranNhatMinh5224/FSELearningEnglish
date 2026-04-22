using LearningEnglish.Domain.Enums;
using System;

namespace LearningEnglish.Application.DTOs.Payment;

public class WalletTransactionDto
{
    public int WalletTransactionId { get; set; }
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public WalletTransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WalletBalanceDto
{
    public decimal Balance { get; set; }
}

public class AdminAdjustBalanceRequest
{
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}
