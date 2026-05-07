using AutoMapper;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Services;
using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Application.Interface.Services.IPayment;
using Microsoft.Extensions.Logging;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Pagination;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text.Json;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.TeacherPackage;

namespace LearningEnglish.Application.Service.PaymentService
{
    public class PaymentService : IPaymentService
    {
        private const long PayOsMaxOrderCode = 9007199254740991L; // 2^53 - 1

        private static long GeneratePayOsOrderCode()
        {
            // PayOS requires order_code <= 2^53-1.
            // unixTimeMilliseconds (≈ 1.7e12) * 1000 + 0..999 => ≈ 1.7e15, safely below 2^53-1.
            var baseMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var suffix = RandomNumberGenerator.GetInt32(0, 1000);
            var code = checked(baseMs * 1000L + suffix);
            return code <= PayOsMaxOrderCode ? code : baseMs;
        }

        private readonly IPaymentRepository _paymentRepository;
        private readonly IPaymentValidator _paymentValidator;
        private readonly IMapper _mapper;
        private readonly ILogger<PaymentService> _logger;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPayOSService _payOSService;
        private readonly IConfiguration _configuration;
        private readonly IPaymentWebhookQueueRepository _webhookQueueRepository;
        private readonly ICacheService _cache;
        private readonly IWalletService _walletService;
        private readonly ICourseRepository _courseRepository;
        private readonly ITeacherPackageRepository _teacherPackageRepository;
        private readonly IUserEnrollmentService _userEnrollmentService;
        private readonly ITeacherSubscriptionService _teacherSubscriptionService;
        private readonly INotificationRepository _notificationRepository;
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IPaymentValidator paymentValidator,
            IMapper mapper,
            ILogger<PaymentService> logger,
            IUnitOfWork unitOfWork,
            IPayOSService payOSService,
            IConfiguration configuration,
            IPaymentWebhookQueueRepository webhookQueueRepository,
            ICacheService cache,
            IWalletService walletService,
            ICourseRepository courseRepository,
            ITeacherPackageRepository teacherPackageRepository,
            IUserEnrollmentService userEnrollmentService,
            ITeacherSubscriptionService teacherSubscriptionService,
            INotificationRepository notificationRepository,
            IEmailService emailService,
            IUserRepository userRepository)
        {
            _paymentRepository = paymentRepository;
            _paymentValidator = paymentValidator;
            _mapper = mapper;
            _logger = logger;
            _unitOfWork = unitOfWork;
            _payOSService = payOSService;
            _configuration = configuration;
            _webhookQueueRepository = webhookQueueRepository;
            _cache = cache;
            _walletService = walletService;
            _courseRepository = courseRepository;
            _teacherPackageRepository = teacherPackageRepository;
            _userEnrollmentService = userEnrollmentService;
            _teacherSubscriptionService = teacherSubscriptionService;
            _notificationRepository = notificationRepository;
            _emailService = emailService;
            _userRepository = userRepository;
        }

        // POST /api/payments - Create Payment
        public async Task<ServiceResponse<CreateInforPayment>> ProcessPaymentAsync(int userId, requestPayment request)
        {
            var response = new ServiceResponse<CreateInforPayment>();
            try
            {
                _logger.LogInformation("Processing payment: User {UserId}, Product {ProductId}, Type {TypeProduct}, Gateway {Gateway}",
                    userId, request.ProductId, request.typeproduct, request.Gateway);

                // 1. Idempotency Check
                if (!string.IsNullOrEmpty(request.IdempotencyKey))
                {
                    var existingPayment = await _paymentRepository.GetPaymentByIdempotencyKeyAsync(userId, request.IdempotencyKey);
                    if (existingPayment != null)
                    {
                        response.Success = true;
                        response.StatusCode = 200;
                        response.Data = _mapper.Map<CreateInforPayment>(existingPayment);
                        return response;
                    }
                }

                // 2. Gateway Resolution (Business Rule)
                if (request.typeproduct != ProductType.TopUp)
                {
                    // Everything except TopUp MUST go through the wallet
                    request.Gateway = PaymentGateway.InternalWallet;
                }
                else
                {
                    // TopUp MUST go through an external gateway (currently PayOS)
                    if (request.Gateway == PaymentGateway.InternalWallet)
                    {
                        return new ServiceResponse<CreateInforPayment> 
                        { 
                            Success = false, 
                            Message = "Không thể nạp tiền bằng chính ví nội bộ.", 
                            StatusCode = 400 
                        };
                    }
                    request.Gateway = PaymentGateway.PayOs;
                }

                // 3. Validation
                var userCheck = await _paymentValidator.ValidateUserPaymentAsync(userId, request.ProductId, request.typeproduct);
                if (!userCheck.Success) return new ServiceResponse<CreateInforPayment> { Success = false, Message = userCheck.Message, StatusCode = 400 };

                var productCheck = await _paymentValidator.ValidateProductAsync(request.ProductId, request.typeproduct);
                if (!productCheck.Success) return new ServiceResponse<CreateInforPayment> { Success = false, Message = productCheck.Message, StatusCode = 404 };

                var amount = productCheck.Data;
                var productName = await GetProductNameAsync(request.ProductId, request.typeproduct);
                var orderCode = GeneratePayOsOrderCode();

                // 4. Persistence & Execution
                await _unitOfWork.BeginTransactionAsync();
                try
                {
                    var payment = new Payment
                    {
                        UserId = userId,
                        ProductType = request.typeproduct,
                        ProductId = request.ProductId,
                        OrderCode = orderCode,
                        IdempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey,
                        Gateway = request.Gateway,
                        Amount = amount,
                        Status = PaymentStatus.Pending,
                        Description = request.typeproduct == ProductType.TopUp 
                            ? $"Nap tien vao vi {amount:N0} VND" 
                            : $"Thanh toán {productName}",
                        CreatedAt = DateTime.UtcNow,
                        ExpiredAt = DateTime.UtcNow.AddMinutes(15),
                        ProviderTransactionId = request.Gateway == PaymentGateway.InternalWallet ? $"WALLET-{orderCode}" : orderCode.ToString()
                    };

                    await _paymentRepository.AddPaymentAsync(payment);
                    await _unitOfWork.SaveChangesAsync();

                    // PATH A: Wallet Purchase Flow (includes Free products)
                    if (request.Gateway == PaymentGateway.InternalWallet)
                    {
                        // Always call SpendAsync (even for 0 VND) for consistent audit trail
                        var spendResult = await _walletService.SpendAsync(userId, amount, payment.Description, $"PAYMENT-{payment.PaymentId}");
                        if (!spendResult.Success)
                        {
                            await _unitOfWork.RollbackAsync();
                            return new ServiceResponse<CreateInforPayment> { Success = false, Message = spendResult.Message, StatusCode = 400 };
                        }

                        payment.Status = PaymentStatus.Completed;
                        payment.PaidAt = DateTime.UtcNow;
                        payment.UpdatedAt = DateTime.UtcNow;
                        await _paymentRepository.UpdatePaymentStatusAsync(payment);
                        await _unitOfWork.SaveChangesAsync();

                        var postResult = await ProcessPostPaymentLogicAsync(payment.UserId, payment.ProductId, payment.ProductType, payment.PaymentId);
                        if (!postResult.Success)
                        {
                            await _unitOfWork.RollbackAsync();
                            return new ServiceResponse<CreateInforPayment> { Success = false, Message = postResult.Message, StatusCode = 500 };
                        }

                        response.Message = amount == 0 ? "Nhận sản phẩm miễn phí thành công" : "Thanh toán bằng ví thành công";
                    }
                    // PATH B: External Gateway Flow (Top-up ONLY)
                    else 
                    {
                        _logger.LogInformation("Pending PayOS Top-Up created for User {UserId}", userId);
                    }

                    await _unitOfWork.CommitAsync();

                    response.Success = true;
                    response.StatusCode = 200;
                    response.Data = new CreateInforPayment
                    {
                        PaymentId = payment.PaymentId,
                        ProductId = payment.ProductId,
                        ProductType = payment.ProductType,
                        Amount = payment.Amount
                    };
                }
                catch (Exception ex)
                {
                    await _unitOfWork.RollbackAsync();
                    _logger.LogError(ex, "Transaction failed for User {UserId}", userId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Payment processing failed for User {UserId}", userId);
                return new ServiceResponse<CreateInforPayment> { Success = false, Message = "Đã xảy ra lỗi khi xử lý thanh toán", StatusCode = 500 };
            }
            return response;
        }

        private async Task<ServiceResponse<bool>> ProcessPostPaymentLogicAsync(int userId, int productId, ProductType type, int paymentId)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                if (type == ProductType.Course)
                {
                    _logger.LogInformation("Relocating enrollment logic for Course {CourseId}, User {UserId}", productId, userId);
                    var enrollDto = new EnrollCourseDto { CourseId = productId };
                    var enrollResult = await _userEnrollmentService.EnrollInCourseAsync(enrollDto, userId);
                    if (!enrollResult.Success)
                    {
                        response.Success = false;
                        response.Message = enrollResult.Message;
                        response.StatusCode = enrollResult.StatusCode;
                        return response;
                    }

                    // Send Notification
                    var course = await _courseRepository.GetCourseById(productId);
                    if (course != null)
                    {
                        await _notificationRepository.AddAsync(new Notification
                        {
                            UserId = userId,
                            Title = "Thanh toán thành công",
                            Message = $"Bạn đã đăng ký thành công khóa học '{course.Title}'. Chúc bạn học tốt!",
                            Type = NotificationType.PaymentSuccess,
                            RelatedEntityType = "Course",
                            RelatedEntityId = productId,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
                else if (type == ProductType.TeacherPackage)
                {
                    _logger.LogInformation("Relocating upgrade logic for TeacherPackage {PackageId}, User {UserId}", productId, userId);
                    var user = await _userRepository.GetByIdAsync(userId);
                    if (user == null) return new ServiceResponse<bool> { Success = false, Message = "Người dùng không tồn tại" };

                    await _userRepository.UpdateRoleTeacher(userId);
                    var subResult = await _teacherSubscriptionService.AddTeacherSubscriptionAsync(new PurchaseTeacherPackageDto { IdTeacherPackage = productId }, userId, paymentId);
                    if (!subResult.Success)
                    {
                        response.Success = false;
                        response.Message = subResult.Message;
                        response.StatusCode = subResult.StatusCode;
                        return response;
                    }

                    // Send Notification & Email
                    var package = await _teacherPackageRepository.GetTeacherPackageByIdAsync(productId);
                    if (package != null)
                    {
                        try 
                        {
                            await _notificationRepository.AddAsync(new Notification
                            {
                                UserId = userId,
                                Title = "Chào mừng Giáo viên mới",
                                Message = $"Bạn đã nâng cấp thành công gói '{package.PackageName}'.",
                                Type = NotificationType.PaymentSuccess,
                                RelatedEntityType = "TeacherPackage",
                                RelatedEntityId = productId,
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            });

                            await _emailService.SendNotifyPurchaseTeacherPackageAsync(user.Email, package.PackageName, user.FullName, package.Price, subResult.Data?.EndDate ?? DateTime.UtcNow);
                        }
                        catch (Exception emailEx)
                        {
                            // We don't want to rollback the transaction if only the email/notification fails
                            _logger.LogWarning(emailEx, "Failed to send notification/email for TeacherPackage purchase, but transaction will proceed.");
                        }
                    }
                }
                else if (type == ProductType.TopUp)
                {
                    _logger.LogInformation("Relocating top-up logic for User {UserId}, Amount {Amount}", userId, productId);
                    var topUpResult = await _walletService.TopUpAsync(userId, productId, $"PAYMENT-{paymentId}");
                    if (!topUpResult.Success)
                    {
                        response.Success = false;
                        response.Message = topUpResult.Message;
                        response.StatusCode = topUpResult.StatusCode;
                        return response;
                    }

                    await _notificationRepository.AddAsync(new Notification
                    {
                        UserId = userId,
                        Title = "Nạp tiền thành công",
                        Message = $"Bạn đã nạp thành công {productId:N0} VNĐ vào ví.",
                        Type = NotificationType.PaymentSuccess,
                        RelatedEntityType = "Wallet",
                        RelatedEntityId = paymentId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                response.Success = true;
                response.Data = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProcessPostPaymentLogicAsync for Payment {PaymentId}", paymentId);
                response.Success = false;
                response.Message = "Lỗi xử lý sau thanh toán";
            }
            return response;
        }

        private async Task<string> GetProductNameAsync(int productId, ProductType type)
        {
            if (type == ProductType.Course)
            {
                var course = await _courseRepository.GetCourseById(productId);
                return course?.Title ?? "Khóa học";
            }
            if (type == ProductType.TeacherPackage)
            {
                var package = await _teacherPackageRepository.GetTeacherPackageByIdAsync(productId);
                return package?.PackageName ?? "Gói giáo viên";
            }
            if (type == ProductType.TopUp)
            {
                return $"Nap tien vao vi ({productId:N0} VND)";
            }
            return "Sản phẩm";
        }
        private async Task<ServiceResponse<bool>> InternalCompletePaymentAsync(Payment payment, PayOSWebhookDto? rawWebhook = null)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                if (payment.Status != PaymentStatus.Pending)
                {
                    response.Data = true;
                    response.Message = "Thanh toán đã được xử lý";
                    return response;
                }

                await _unitOfWork.BeginTransactionAsync();
                try
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.PaidAt = DateTime.UtcNow;
                    payment.UpdatedAt = DateTime.UtcNow;

                    await _paymentRepository.UpdatePaymentStatusAsync(payment);
                    await _unitOfWork.SaveChangesAsync();
                    _cache.RemoveByPrefix(CacheKeys.StatisticsPrefix);

                    var postPaymentResult = await ProcessPostPaymentLogicAsync(payment.UserId, payment.ProductId, payment.ProductType, payment.PaymentId);
                    if (!postPaymentResult.Success)
                    {
                        // ENTERPRISE LOGIC: Nếu nghiệp vụ (enroll, upgrade) lỗi, nhưng tiền đã nạp thành công ở PayOS
                        // Chúng ta vẫn COMMIT trạng thái thanh toán, nhưng ném lỗi để hệ thống ghi vào Queue xử lý sau
                        _logger.LogError("Post-payment logic failed for Payment {PaymentId}: {Message}. Committing payment status but flagged for retry.", 
                            payment.PaymentId, postPaymentResult.Message);
                        
                        await _unitOfWork.CommitAsync(); // Chấp nhận nạp tiền thành công
                        
                        response.Success = false;
                        response.Message = postPaymentResult.Message;
                        response.StatusCode = 500;
                        return response;
                    }

                    await _unitOfWork.CommitAsync();
                    response.Data = true;
                    return response;
                }
                catch (Exception)
                {
                    await _unitOfWork.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finalizing payment {PaymentId}", payment.PaymentId);
                response.Success = false;
                response.Message = "Lỗi hệ thống khi hoàn tất thanh toán";
                response.StatusCode = 500;
                return response;
            }
        }


        // Service lấy ra thông tin lịch sử giao dịch (Phân trang)
        public async Task<ServiceResponse<PagedResult<TransactionHistoryDto>>> GetTransactionHistoryAsync(int userId, PageRequest request)
        {
            var response = new ServiceResponse<PagedResult<TransactionHistoryDto>>();
            try
            {
                _logger.LogInformation("Getting transaction history for User {UserId}, Page {PageNumber}, Size {PageSize}",
                    userId, request.PageNumber, request.PageSize);

                var (payments, totalCount) = await _paymentRepository.GetTransactionHistoryPagedAsync(userId, request.PageNumber, request.PageSize);

                var transactionDtos = new List<TransactionHistoryDto>();
                foreach (var payment in payments)
                {
                    var dto = _mapper.Map<TransactionHistoryDto>(payment);
                    
                    // Get product name directly
                    dto.ProductName = await GetProductNameAsync(payment.ProductId, payment.ProductType);
                    
                    transactionDtos.Add(dto);
                }

                response.Data = new PagedResult<TransactionHistoryDto>
                {
                    Items = transactionDtos,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

                _logger.LogInformation("Retrieved {Count} transactions for User {UserId}", transactionDtos.Count, userId);
                response.Success = true;
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting transaction history for User {UserId}", userId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi lấy lịch sử giao dịch";
            }
            return response;
        }

        // Service lấy chi tiết giao dịch
        public async Task<ServiceResponse<TransactionDetailDto>> GetTransactionDetailAsync(int paymentId, int userId)
        {
            var response = new ServiceResponse<TransactionDetailDto>();
            try
            {
                _logger.LogInformation("Getting transaction detail for Payment {PaymentId}, User {UserId}", paymentId, userId);

                var payment = await _paymentRepository.GetTransactionDetailAsync(paymentId, userId);
                if (payment == null)
                {
                    _logger.LogWarning("User {UserId} cố gắng xem payment {PaymentId} không tồn tại hoặc không thuộc về mình", userId, paymentId);
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy giao dịch";
                    return response;
                }

                // Repository đã filter theo userId, nhưng thêm explicit check
                if (payment.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} cố gắng xem payment {PaymentId} của user khác (Owner: {OwnerId})", 
                        userId, paymentId, payment.UserId);
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền xem giao dịch này";
                    return response;
                }

                var dto = _mapper.Map<TransactionDetailDto>(payment);
                
                // Get product name directly
                dto.ProductName = await GetProductNameAsync(payment.ProductId, payment.ProductType);

                response.Data = dto;

                _logger.LogInformation("Retrieved transaction detail for Payment {PaymentId}", paymentId);
                response.Success = true;
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting transaction detail for Payment {PaymentId}", paymentId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi lấy chi tiết giao dịch";
            }
            return response;
        }

        public async Task<ServiceResponse<PayOSLinkResponse>> CreatePayOSPaymentLinkAsync(int paymentId, int userId)
        {
            var response = new ServiceResponse<PayOSLinkResponse>();
            try
            {
                _logger.LogInformation("Creating PayOS payment link for Payment {PaymentId}, User {UserId}", paymentId, userId);

                var payment = await _paymentRepository.GetPaymentByIdAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("Payment {PaymentId} not found for User {UserId}", paymentId, userId);
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy thanh toán";
                    return response;
                }

                // Explicit ownership check
                if (payment.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} cố gắng tạo link cho payment {PaymentId} của user khác (Owner: {OwnerId})", 
                        userId, paymentId, payment.UserId);
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền truy cập thanh toán này";
                    return response;
                }

                if (payment.Status != PaymentStatus.Pending)
                {
                    _logger.LogWarning("Payment {PaymentId} already processed with status {Status}", paymentId, payment.Status);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Payment already processed";
                    return response;
                }

                // Validate PayOS specific requirements
                if (payment.OrderCode == 0)
                {
                    _logger.LogError("Payment {PaymentId} has no OrderCode", paymentId);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Payment OrderCode is missing";
                    return response;
                }

                if (payment.Gateway != PaymentGateway.PayOs)
                {
                    _logger.LogWarning("Payment {PaymentId} gateway is {Gateway}, not PayOS", paymentId, payment.Gateway);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Payment is not configured for PayOS gateway";
                    return response;
                }

                if (payment.ExpiredAt.HasValue && payment.ExpiredAt.Value < DateTime.UtcNow)
                {
                    _logger.LogWarning("Payment {PaymentId} has expired at {ExpiredAt}", paymentId, payment.ExpiredAt);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Payment link has expired";
                    return response;
                }

                // Get product name directly
                var productName = await GetProductNameAsync(payment.ProductId, payment.ProductType);
                
                var description = !string.IsNullOrEmpty(payment.Description) 
                    ? payment.Description 
                    : productName;

                // Hard-block link generation for non-topup products
                if (payment.ProductType != ProductType.TopUp)
                {
                    _logger.LogWarning("Payment {PaymentId} không phải là nạp tiền. Từ chối tạo link PayOS.", paymentId);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Không thể tạo link thanh toán trực tiếp cho sản phẩm. Vui lòng thanh toán qua ví.";
                    return response;
                }

                var linkRequest = new CreatePayOSLinkRequest
                {
                    PaymentId = payment.PaymentId
                };

                var linkResponse = await _payOSService.CreatePaymentLinkAsync(
                    linkRequest, 
                    payment.Amount, 
                    productName, 
                    description,
                    payment.OrderCode);

                // Xử lý code 231: OrderCode đã tồn tại
                if (!linkResponse.Success && linkResponse.Message?.Contains("231") == true)
                {
                    _logger.LogWarning("PayOS returned code 231 (orderCode exists) for Payment {PaymentId}. Generating new orderCode...", paymentId);
                    
                    await _unitOfWork.BeginTransactionAsync();
                    try
                    {
                        var newOrderCode = GeneratePayOsOrderCode();
                        
                        payment.OrderCode = newOrderCode;
                        payment.ProviderTransactionId = newOrderCode.ToString();
                        await _paymentRepository.UpdatePaymentStatusAsync(payment);
                        await _unitOfWork.SaveChangesAsync();
                        
                        _logger.LogInformation("Updated Payment {PaymentId} with new OrderCode: {OrderCode}", paymentId, newOrderCode);
                        
                        await _unitOfWork.CommitAsync();
                        
                        linkResponse = await _payOSService.CreatePaymentLinkAsync(
                            linkRequest, 
                            payment.Amount, 
                            productName, 
                            description,
                            newOrderCode);
                    }
                    catch (Exception transactionEx)
                    {
                        await _unitOfWork.RollbackAsync();
                        _logger.LogError(transactionEx, "Failed to update OrderCode for Payment {PaymentId}", paymentId);
                        throw;
                    }
                }

                if (!linkResponse.Success || linkResponse.Data == null)
                {
                    _logger.LogError("Failed to create PayOS link: {Message}", linkResponse.Message);
                    response.Success = false;
                    response.StatusCode = 500;
                    response.Message = linkResponse.Message ?? "Failed to create PayOS payment link";
                    return response;
                }

                // Update payment with CheckoutUrl - wrap in transaction
                await _unitOfWork.BeginTransactionAsync();
                try
                {
                    payment.CheckoutUrl = linkResponse.Data.CheckoutUrl;
                    payment.UpdatedAt = DateTime.UtcNow;
                    await _paymentRepository.UpdatePaymentStatusAsync(payment);
                    await _unitOfWork.SaveChangesAsync();
                    
                    await _unitOfWork.CommitAsync();
                    
                    _logger.LogInformation("PayOS payment link created successfully for Payment {PaymentId}, OrderCode: {OrderCode}",
                        paymentId, payment.OrderCode);
                }
                catch (Exception transactionEx)
                {
                    await _unitOfWork.RollbackAsync();
                    _logger.LogError(transactionEx, "Failed to update CheckoutUrl for Payment {PaymentId}", paymentId);
                    throw;
                }

                response.Data = linkResponse.Data;
                response.Success = true;
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayOS link for Payment {PaymentId}", paymentId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
            }

            return response;
        }

        public async Task<ServiceResponse<bool>> ProcessWebhookFromQueueAsync(PayOSWebhookDto webhookData)
        {
            var response = new ServiceResponse<bool>();
            PaymentWebhookQueue? queueItem = null;

            try
            {
                _logger.LogInformation("Processing webhook for OrderCode {OrderCode}", webhookData.OrderCode);

                // SECURITY: Always verify signature before processing, even from queue
                var isValid = await _payOSService.VerifyWebhookSignature(webhookData.Data, webhookData.Signature);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid webhook signature during queue processing for OrderCode {OrderCode}", webhookData.OrderCode);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Invalid signature";
                    return response;
                }

                // 1. Log or Get Queue Item for Idempotency/Audit
                queueItem = await _webhookQueueRepository.GetByOrderCodeAsync(webhookData.OrderCode);
                if (queueItem == null)
                {
                    queueItem = new PaymentWebhookQueue
                    {
                        OrderCode = webhookData.OrderCode,
                        WebhookData = JsonSerializer.Serialize(webhookData),
                        Signature = webhookData.Signature,
                        Status = WebhookStatus.Processing,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _webhookQueueRepository.AddWebhookAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();
                }
                else if (queueItem.Status == WebhookStatus.Processed)
                {
                    _logger.LogInformation("Webhook for OrderCode {OrderCode} already processed successfully.", webhookData.OrderCode);
                    response.Success = true;
                    response.Data = true;
                    return response;
                }

                var payment = await _paymentRepository.GetPaymentByTransactionIdAsync(webhookData.OrderCode.ToString());
                if (payment == null)
                {
                    _logger.LogWarning("Payment not found for OrderCode {OrderCode}", webhookData.OrderCode);
                    queueItem.Status = WebhookStatus.Failed;
                    queueItem.LastError = "Payment not found";
                    await _webhookQueueRepository.UpdateWebhookStatusAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();
                    
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Payment not found";
                    return response;
                }

                queueItem.PaymentId = payment.PaymentId;

                if (webhookData.Code != "00")
                {
                    _logger.LogWarning("Payment failed from PayOS: Code={Code}, Desc={Desc}", webhookData.Code, webhookData.Desc);
                    payment.Status = PaymentStatus.Failed;
                    payment.UpdatedAt = DateTime.UtcNow;
                    await _paymentRepository.UpdatePaymentStatusAsync(payment);
                    
                    queueItem.Status = WebhookStatus.Failed;
                    queueItem.LastError = $"PayOS Error: {webhookData.Desc}";
                    await _webhookQueueRepository.UpdateWebhookStatusAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();

                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = $"Payment failed: {webhookData.Desc}";
                    return response;
                }

                // Call internal completion logic
                var resultConfirm = await InternalCompletePaymentAsync(payment, webhookData);

                if (resultConfirm.Success)
                {
                    queueItem.Status = WebhookStatus.Processed;
                    await _webhookQueueRepository.UpdateWebhookStatusAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();
                }
                else
                {
                    queueItem.Status = WebhookStatus.Failed;
                    queueItem.LastError = resultConfirm.Message;
                    queueItem.RetryCount++;
                    queueItem.NextRetryAt = DateTime.UtcNow.AddMinutes(Math.Pow(2, queueItem.RetryCount)); // Exponential backoff
                    await _webhookQueueRepository.UpdateWebhookStatusAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();
                }

                response.Success = resultConfirm.Success;
                response.StatusCode = resultConfirm.StatusCode;
                response.Message = resultConfirm.Message;
                response.Data = resultConfirm.Data;

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook for OrderCode {OrderCode}", webhookData.OrderCode);
                if (queueItem != null)
                {
                    queueItem.Status = WebhookStatus.Failed;
                    queueItem.LastError = ex.Message;
                    queueItem.ErrorStackTrace = ex.StackTrace;
                    await _webhookQueueRepository.UpdateWebhookStatusAsync(queueItem);
                    await _webhookQueueRepository.SaveChangesAsync();
                }
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
                return response;
            }
        }

        // Xử lý PayOS webhook với signature verification
        public async Task<ServiceResponse<bool>> ProcessPayOSWebhookAsync(PayOSWebhookDto webhookData)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                _logger.LogInformation("Processing PayOS webhook: code={Code}, orderCode={OrderCode}", 
                    webhookData.Code, webhookData.OrderCode);

                var isValid = await _payOSService.VerifyWebhookSignature(webhookData.Data, webhookData.Signature);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid webhook signature for OrderCode {OrderCode}", webhookData.OrderCode);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Invalid signature";
                    return response;
                }

                return await ProcessWebhookFromQueueAsync(webhookData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayOS webhook for OrderCode {OrderCode}", webhookData.OrderCode);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
                return response;
            }
        }

        // Xác nhận thanh toán PayOS
        public async Task<ServiceResponse<bool>> ConfirmPayOSPaymentAsync(int paymentId, int userId)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                var payment = await _paymentRepository.GetPaymentByIdAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("Payment {PaymentId} not found for User {UserId}", paymentId, userId);
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Payment not found";
                    return response;
                }

                if (payment.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to confirm payment {PaymentId} of another user", userId, paymentId);
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Payment not found";
                    return response;
                }

                // Verify PayOS payment status
                if (payment.Gateway == PaymentGateway.PayOs)
                {
                    if (string.IsNullOrEmpty(payment.ProviderTransactionId) ||
                        !long.TryParse(payment.ProviderTransactionId, out var orderCode))
                    {
                        _logger.LogError("Payment {PaymentId} is missing valid ProviderTransactionId for PayOS verification", paymentId);
                        response.Success = false;
                        response.StatusCode = 400;
                        response.Message = "Không thể xác thực giao dịch: thiếu mã tham chiếu PayOS";
                        return response;
                    }

                    var payosInfo = await _payOSService.GetPaymentInformationAsync(orderCode);
                    if (!payosInfo.Success || payosInfo.Data == null || payosInfo.Data.Code != "00")
                    {
                        _logger.LogWarning("Payment {PaymentId} not found or error on PayOS. OrderCode: {OrderCode}", paymentId, orderCode);
                        response.Success = false;
                        response.StatusCode = 400;
                        response.Message = "Giao dịch chưa được tạo hoặc không tồn tại trên PayOS";
                        return response;
                    }

                    if (string.IsNullOrEmpty(payosInfo.Data.Status) || !string.Equals(payosInfo.Data.Status, "PAID", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation("Payment {PaymentId} status is {Status}, not PAID", paymentId, payosInfo.Data.Status ?? "unknown");
                        response.Success = false;
                        response.StatusCode = 200; 
                        response.Message = $"Giao dịch đang ở trạng thái {payosInfo.Data.Status ?? "chờ"}, vui lòng hoàn tất thanh toán";
                        return response;
                    }
                }
                else if (payment.Gateway == PaymentGateway.InternalWallet)
                {
                    // Internal wallet payments are usually completed immediately in ProcessPaymentAsync.
                    // If arrived here, something is unusual.
                    _logger.LogWarning("ConfirmPayOSPaymentAsync called for InternalWallet payment {PaymentId}", paymentId);
                }

                return await InternalCompletePaymentAsync(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming PayOS payment {PaymentId} for User {UserId}", paymentId, userId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
                return response;
            }
        }

        // Xử lý PayOS return URL
        public async Task<ServiceResponse<PayOSReturnResult>> ProcessPayOSReturnAsync(string code, string desc, string data, string? orderCode = null, string? status = null)
        {
            var response = new ServiceResponse<PayOSReturnResult>();
            var result = new PayOSReturnResult();

            try
            {
                _logger.LogInformation("Processing PayOS return: code={Code}, hasData={HasData}", code, !string.IsNullOrEmpty(data));

                if (code != "00")
                {
                    _logger.LogWarning("PayOS payment failed: {Desc}", desc);
                    result.Success = false;
                    result.RedirectUrl = $"{GetFrontendUrl()}/payment-failed?reason={Uri.EscapeDataString(desc ?? "Payment failed")}";
                    result.Message = desc ?? "Payment failed";
                    response.Data = result;
                    return response;
                }

                Payment? payment = null;
                string? finalOrderCode = orderCode;

                if (!string.IsNullOrEmpty(data))
                {
                    try
                    {
                        var webhookData = JsonSerializer.Deserialize<JsonElement>(data);
                        if (webhookData.TryGetProperty("orderCode", out var orderCodeElement))
                        {
                            finalOrderCode = orderCodeElement.GetInt64().ToString();
                            payment = await _paymentRepository.GetPaymentByTransactionIdAsync(finalOrderCode);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error parsing PayOS return data");
                    }
                    catch (KeyNotFoundException ex)
                    {
                        _logger.LogError(ex, "PayOS return data missing orderCode");
                    }
                }

                if (payment == null && !string.IsNullOrEmpty(finalOrderCode) && long.TryParse(finalOrderCode, out var parsedOrderCode))
                {
                    payment = await _paymentRepository.GetPaymentByOrderCodeAsync(parsedOrderCode);
                }

                if (payment == null)
                {
                    _logger.LogWarning("Payment not found from PayOS return. Code={Code}, HasData={HasData}, OrderCode={OrderCode}", 
                        code, !string.IsNullOrEmpty(data), finalOrderCode ?? "null");
                    result.Success = false;
                    result.RedirectUrl = $"{GetFrontendUrl()}/payment-failed?reason=Payment not found";
                    result.Message = "Payment not found";
                    response.Data = result;
                    return response;
                }

                _logger.LogInformation("PayOS return successful for Payment {PaymentId}, OrderCode {OrderCode}",
                    payment.PaymentId, finalOrderCode ?? payment.OrderCode.ToString());

                result.PaymentId = payment.PaymentId;
                result.OrderCode = finalOrderCode ?? payment.OrderCode.ToString();

                // SECURITY: never trust querystring status for confirming payment.
                // Always verify status with PayOS API for the orderCode.
                string? paymentStatus = null;
                if (!string.IsNullOrEmpty(finalOrderCode) && long.TryParse(finalOrderCode, out var orderCodeForStatus))
                {
                    var payosInfo = await _payOSService.GetPaymentInformationAsync(orderCodeForStatus);
                    if (payosInfo.Success && payosInfo.Data != null)
                    {
                        paymentStatus = payosInfo.Data.Status;

                        if (!string.Equals(payosInfo.Data.Code, "00", StringComparison.OrdinalIgnoreCase))
                        {
                            _logger.LogWarning("PayOS API returned non-success code for OrderCode={OrderCode}: Code={Code}, Desc={Desc}",
                                orderCodeForStatus, payosInfo.Data.Code, payosInfo.Data.Desc);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Could not verify PayOS status for OrderCode={OrderCode}. Using pending redirect.", orderCodeForStatus);
                    }
                }

                if (string.IsNullOrEmpty(paymentStatus) || !string.Equals(paymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                {
                    // If PayOS didn't confirm PAID, treat as pending (even if querystring says PAID).
                    var statusHint = !string.IsNullOrEmpty(paymentStatus) ? paymentStatus : (status ?? "");

                    _logger.LogWarning("Payment {PaymentId} not confirmed PAID by PayOS: VerifiedStatus={VerifiedStatus}, StatusHint={StatusHint}",
                        payment.PaymentId, paymentStatus ?? "null", statusHint);

                    result.Success = false;
                    result.RedirectUrl = $"{GetFrontendUrl()}/payment-pending?orderCode={finalOrderCode}&status={Uri.EscapeDataString(statusHint)}";
                    result.Message = $"Payment status: {(paymentStatus ?? statusHint ?? "unknown")}";
                    response.Data = result;
                    return response;
                }

                // Auto-confirm payment if still pending
                if (payment.Status == PaymentStatus.Pending)
                {
                    _logger.LogInformation("Auto-confirming Payment {PaymentId} via Return URL (Status=PAID)", payment.PaymentId);

                    var confirmResult = await InternalCompletePaymentAsync(payment);

                    if (confirmResult.Success)
                    {
                        _logger.LogInformation("Payment {PaymentId} auto-confirmed successfully via Return URL", payment.PaymentId);
                    }
                    else
                    {
                        _logger.LogWarning("Payment {PaymentId} confirmation failed or already processed: {Message}",
                            payment.PaymentId, confirmResult.Message);
                    }
                }

                // Redirect based on product type
                if (payment.ProductType == ProductType.Course)
                {
                    result.Success = true;
                    result.RedirectUrl = $"{GetFrontendUrl()}/course/{payment.ProductId}";
                    result.Message = "Payment confirmed successfully";
                }
                else if (payment.ProductType == ProductType.TeacherPackage)
                {
                    result.Success = true;
                    result.RedirectUrl = $"{GetFrontendUrl()}/home";
                    result.Message = "Payment confirmed successfully";
                }
                else
                {
                    result.Success = true;
                    result.RedirectUrl = $"{GetFrontendUrl()}/home";
                    result.Message = "Payment confirmed successfully";
                }

                response.Success = true;
                response.Data = result;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayOS return");
                result.Success = false;
                result.RedirectUrl = $"{GetFrontendUrl()}/payment-failed?reason=Server error";
                result.Message = "Server error";
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
                response.Data = result;
                return response;
            }
        }

        public async Task<ServiceResponse<IEnumerable<PaymentWebhookQueue>>> GetFailedWebhooksAsync()
        {
            var response = new ServiceResponse<IEnumerable<PaymentWebhookQueue>>();
            try
            {
                var webhooks = await _webhookQueueRepository.GetDeadLetterWebhooksAsync();
                response.Data = webhooks;
                response.Success = true;
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failed webhooks");
                response.Success = false;
                response.Message = "Lỗi khi lấy danh sách webhook thất bại";
            }
            return response;
        }

        public async Task<ServiceResponse<bool>> RetryWebhookAsync(int webhookId)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                var webhook = await _webhookQueueRepository.GetWebhookByIdAsync(webhookId);
                if (webhook == null)
                {
                    response.Success = false;
                    response.Message = "Webhook không tồn tại";
                    return response;
                }

                // Reset status to Pending and retry count
                webhook.Status = WebhookStatus.Pending;
                webhook.RetryCount = 0;
                webhook.NextRetryAt = DateTime.UtcNow;
                
                await _webhookQueueRepository.UpdateWebhookStatusAsync(webhook);
                await _webhookQueueRepository.SaveChangesAsync();
                
                response.Success = true;
                response.Data = true;
                response.Message = "Đã đặt lại trạng thái webhook để thử lại";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying webhook {WebhookId}", webhookId);
                response.Success = false;
                response.Message = "Lỗi khi thử lại webhook";
            }
            return response;
        }

        private string GetFrontendUrl()
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"]?.Trim();
            if (string.IsNullOrWhiteSpace(frontendUrl) || !Uri.TryCreate(frontendUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("Frontend:BaseUrl is missing or invalid. Please configure a valid absolute URL.");
            }

            return frontendUrl.TrimEnd('/');
        }
        public async Task<ServiceResponse<PagedResult<TransactionHistoryDto>>> GetAllTransactionsAsync(
            AdminTransactionRequest request)
        {
            var response = new ServiceResponse<PagedResult<TransactionHistoryDto>>();
            try
            {
                _logger.LogInformation("Getting all transactions for Admin. Page {PageNumber}, Size {PageSize}, Status {Status}, Gateway {Gateway}",
                    request.PageNumber, request.PageSize, request.Status, request.Gateway);

                var (payments, totalCount) = await _paymentRepository.GetAllTransactionsPagedAsync(
                    request.PageNumber, request.PageSize, request.Status, request.Gateway, request.SearchTerm);

                var transactionDtos = new List<TransactionHistoryDto>();
                foreach (var payment in payments)
                {
                    var dto = _mapper.Map<TransactionHistoryDto>(payment);
                    
                    // Lấy Product Name trực tiếp từ Repository
                    if (payment.ProductType == ProductType.Course)
                    {
                        var course = await _courseRepository.GetCourseById(payment.ProductId);
                        dto.ProductName = course?.Title ?? "Khóa học";
                    }
                    else if (payment.ProductType == ProductType.TeacherPackage)
                    {
                        var pkg = await _teacherPackageRepository.GetTeacherPackageByIdAsync(payment.ProductId);
                        dto.ProductName = pkg?.PackageName ?? "Gói giáo viên";
                    }
                    else if (payment.ProductType == ProductType.TopUp)
                    {
                        dto.ProductName = "Nạp tiền vào ví";
                    }
                    else
                    {
                        dto.ProductName = "Sản phẩm";
                    }
                    
                    // Set User info
                    if (payment.User != null)
                    {
                        dto.UserDisplayName = payment.User.FullName;
                        dto.UserEmail = payment.User.Email;
                    }

                    transactionDtos.Add(dto);
                }

                response.Data = new PagedResult<TransactionHistoryDto>
                {
                    Items = transactionDtos,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

                response.Success = true;
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all transactions for Admin");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi lấy danh sách giao dịch";
            }
            return response;
        }
        public async Task<ServiceResponse<bool>> CancelPaymentAsync(int paymentId, int userId)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                _logger.LogInformation("Cancelling payment {PaymentId} for User {UserId}", paymentId, userId);

                var payment = await _paymentRepository.GetPaymentByIdAsync(paymentId);
                if (payment == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy giao dịch";
                    return response;
                }

                if (payment.UserId != userId)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền hủy giao dịch này";
                    return response;
                }

                if (payment.Status != PaymentStatus.Pending)
                {
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = $"Không thể hủy giao dịch đang ở trạng thái {payment.Status}";
                    return response;
                }

                await _unitOfWork.BeginTransactionAsync();
                payment.Status = PaymentStatus.Cancelled;
                payment.UpdatedAt = DateTime.UtcNow;

                await _paymentRepository.UpdatePaymentStatusAsync(payment);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitAsync();

                _logger.LogInformation("Payment {PaymentId} cancelled successfully", paymentId);
                response.Data = true;
                response.Success = true;
                response.Message = "Đã hủy giao dịch thành công";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "Error cancelling payment {PaymentId}", paymentId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống khi hủy giao dịch";
            }
            return response;
        }
    }
}
