using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Payment;

namespace LearningEnglish.Application.Interface.Services.IPayment;

public interface IWalletService
{
    Task<ServiceResponse<decimal>> GetBalanceAsync(int userId);
    Task<ServiceResponse<bool>> TopUpAsync(int userId, decimal amount, string? referenceId = null);
    Task<ServiceResponse<bool>> SpendAsync(int userId, decimal amount, string description, string? referenceId = null);
    Task<ServiceResponse<bool>> AdminAdjustBalanceAsync(int adminId, int userId, decimal amount, string reason);
    Task<ServiceResponse<IEnumerable<WalletTransactionDto>>> GetTransactionHistoryAsync(int userId);
}
