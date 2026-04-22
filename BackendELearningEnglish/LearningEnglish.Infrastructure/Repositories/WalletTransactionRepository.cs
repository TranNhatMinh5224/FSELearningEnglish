using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningEnglish.Infrastructure.Repositories
{
    public class WalletTransactionRepository : IWalletTransactionRepository
    {
        private readonly AppDbContext _context;

        public WalletTransactionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WalletTransaction?> GetByIdAsync(int transactionId)
        {
            return await _context.WalletTransactions
                .Include(wt => wt.User)
                .FirstOrDefaultAsync(wt => wt.WalletTransactionId == transactionId);
        }

        public async Task<IEnumerable<WalletTransaction>> GetByUserIdAsync(int userId)
        {
            return await _context.WalletTransactions
                .Where(wt => wt.UserId == userId)
                .OrderByDescending(wt => wt.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(WalletTransaction transaction)
        {
            await _context.WalletTransactions.AddAsync(transaction);
        }

        public async Task<decimal> GetTotalTopUpAsync()
        {
            return await _context.WalletTransactions
                .Where(wt => wt.Type == WalletTransactionType.TopUp)
                .SumAsync(wt => wt.Amount);
        }

        public async Task<decimal> GetTotalSpendAsync()
        {
            return await _context.WalletTransactions
                .Where(wt => wt.Type == WalletTransactionType.Purchase)
                .SumAsync(wt => Math.Abs(wt.Amount));
        }
    }
}
