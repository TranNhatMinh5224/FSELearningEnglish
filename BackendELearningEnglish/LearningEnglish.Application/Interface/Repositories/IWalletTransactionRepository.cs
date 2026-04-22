using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Repositories;

public interface IWalletTransactionRepository
{
    Task<WalletTransaction?> GetByIdAsync(int transactionId);
    Task<IEnumerable<WalletTransaction>> GetByUserIdAsync(int userId);
    Task AddAsync(WalletTransaction transaction);
    Task<decimal> GetTotalTopUpAsync();
    Task<decimal> GetTotalSpendAsync();
}
