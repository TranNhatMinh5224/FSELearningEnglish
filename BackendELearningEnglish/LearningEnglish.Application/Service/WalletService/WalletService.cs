using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Payment;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.IPayment;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service.WalletService;

public class WalletService : IWalletService
{
    private readonly IUserRepository _userRepository;
    private readonly IWalletTransactionRepository _walletTransactionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<WalletService> _logger;

    public WalletService(
        IUserRepository userRepository,
        IWalletTransactionRepository walletTransactionRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<WalletService> logger)
    {
        _userRepository = userRepository;
        _walletTransactionRepository = walletTransactionRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ServiceResponse<decimal>> GetBalanceAsync(int userId)
    {
        var response = new ServiceResponse<decimal>();
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "Người dùng không tồn tại.";
                return response;
            }

            response.Data = user.Balance;
            response.Success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy số dư cho người dùng {UserId}", userId);
            response.Success = false;
            response.Message = "Lỗi hệ thống khi lấy số dư.";
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> TopUpAsync(int userId, decimal amount, string? referenceId = null)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "Người dùng không tồn tại.";
                return response;
            }

            decimal balanceBefore = user.Balance;
            user.Balance += amount;
            user.UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = user.Balance,
                Type = WalletTransactionType.TopUp,
                Description = $"Nạp tiền vào ví. Tham chiếu: {referenceId ?? "N/A"}",
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            await _walletTransactionRepository.AddAsync(transaction);
            await _userRepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Nạp tiền thành công cho người dùng {UserId}: {Amount}. Số dư mới: {NewBalance}", 
                userId, amount, user.Balance);

            response.Data = true;
            response.Success = true;
            response.Message = "Nạp tiền thành công.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi nạp tiền cho người dùng {UserId}", userId);
            response.Data = false;
            response.Success = false;
            response.Message = "Lỗi hệ thống khi nạp tiền.";
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> SpendAsync(int userId, decimal amount, string description, string? referenceId = null)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "Người dùng không tồn tại.";
                return response;
            }

            if (user.Balance < amount)
            {
                response.Success = false;
                response.Message = "Số dư không đủ để thực hiện giao dịch.";
                return response;
            }

            decimal balanceBefore = user.Balance;
            user.Balance -= amount;
            user.UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = -amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = user.Balance,
                Type = WalletTransactionType.Purchase,
                Description = description,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            await _walletTransactionRepository.AddAsync(transaction);
            await _userRepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Thanh toán thành công cho người dùng {UserId}: {Amount}. Nội dung: {Description}. Số dư mới: {NewBalance}", 
                userId, amount, description, user.Balance);

            response.Data = true;
            response.Success = true;
            response.Message = "Thanh toán thành công.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thanh toán cho người dùng {UserId}", userId);
            response.Data = false;
            response.Success = false;
            response.Message = "Lỗi hệ thống khi thực hiện thanh toán.";
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> AdminAdjustBalanceAsync(int adminId, int userId, decimal amount, string reason)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "Người dùng không tồn tại.";
                return response;
            }

            decimal balanceBefore = user.Balance;
            user.Balance += amount; // amount can be negative for deduction
            user.UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = user.Balance,
                Type = WalletTransactionType.AdminAdjustment,
                Description = $"Admin điều chỉnh: {reason}",
                ReferenceId = $"ADMIN-{adminId}",
                CreatedAt = DateTime.UtcNow
            };

            await _walletTransactionRepository.AddAsync(transaction);
            await _userRepository.UpdateUserAsync(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Admin {AdminId} điều chỉnh số dư cho người dùng {UserId}: {Amount}. Lý do: {Reason}", 
                adminId, userId, amount, reason);

            response.Data = true;
            response.Success = true;
            response.Message = "Điều chỉnh số dư thành công.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi admin điều chỉnh số dư cho người dùng {UserId}", userId);
            response.Data = false;
            response.Success = false;
            response.Message = "Lỗi hệ thống khi điều chỉnh số dư.";
        }
        return response;
    }

    public async Task<ServiceResponse<IEnumerable<WalletTransactionDto>>> GetTransactionHistoryAsync(int userId)
    {
        var response = new ServiceResponse<IEnumerable<WalletTransactionDto>>();
        try
        {
            var transactions = await _walletTransactionRepository.GetByUserIdAsync(userId);
            response.Data = _mapper.Map<IEnumerable<WalletTransactionDto>>(transactions);
            response.Success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy lịch sử giao dịch cho người dùng {UserId}", userId);
            response.Success = false;
            response.Message = "Lỗi hệ thống khi lấy lịch sử giao dịch.";
        }
        return response;
    }
}
