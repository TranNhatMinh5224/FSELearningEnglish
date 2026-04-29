using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service.PaymentService
{
    public class PaymentValidator : IPaymentValidator
    {
        private readonly IUserRepository _userRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly ITeacherPackageRepository _teacherPackageRepository;
        private readonly ITeacherSubscriptionRepository _teacherSubscriptionRepository;
        private readonly ILogger<PaymentValidator> _logger;

        public PaymentValidator(
            IUserRepository userRepository,
            IPaymentRepository paymentRepository,
            ICourseRepository courseRepository,
            ITeacherPackageRepository teacherPackageRepository,
            ITeacherSubscriptionRepository teacherSubscriptionRepository,
            ILogger<PaymentValidator> logger)
        {
            _userRepository = userRepository;
            _paymentRepository = paymentRepository;
            _courseRepository = courseRepository;
            _teacherPackageRepository = teacherPackageRepository;
            _teacherSubscriptionRepository = teacherSubscriptionRepository;
            _logger = logger;
        }

        public async Task<ServiceResponse<decimal>> ValidateProductAsync(int productId, ProductType productType)
        {
            var response = new ServiceResponse<decimal>();

            try
            {
                if (productType == ProductType.Course)
                {
                    var course = await _courseRepository.GetCourseById(productId);
                    if (course == null)
                    {
                        response.Success = false;
                        response.Message = "Khóa học không tồn tại";
                        return response;
                    }
                    response.Success = true;
                    response.Data = course.Price ?? 0;
                }
                else if (productType == ProductType.TeacherPackage)
                {
                    var package = await _teacherPackageRepository.GetTeacherPackageByIdAsync(productId);
                    if (package == null)
                    {
                        response.Success = false;
                        response.Message = "Gói giáo viên không tồn tại";
                        return response;
                    }
                    response.Success = true;
                    response.Data = package.Price;
                }
                else if (productType == ProductType.TopUp)
                {
                    // Đối với TopUp, productId chính là số tiền (VND)
                    if (productId <= 0)
                    {
                        response.Success = false;
                        response.Message = "Số tiền nạp không hợp lệ";
                        return response;
                    }
                    response.Success = true;
                    response.Data = (decimal)productId;
                }
                else
                {
                    response.Success = false;
                    response.Message = "Loại sản phẩm không được hỗ trợ";
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi validate sản phẩm {ProductId}, Loại {ProductType}", productId, productType);
                response.Success = false;
                response.Message = "Đã xảy ra lỗi khi validate sản phẩm";
                return response;
            }
        }

        public async Task<ServiceResponse<bool>> ValidateUserPaymentAsync(int userId, int productId, ProductType productType)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                // Kiểm tra user tồn tại
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Không tìm thấy User {UserId}", userId);
                    response.Success = false;
                    response.Message = "Không tìm thấy người dùng";
                    return response;
                }

                // Kiểm tra duplicate payment
                if (productType == ProductType.Course)
                {
                    // Course: Không cho mua lại nếu đã enrolled
                    var existingPayment = await _paymentRepository.GetSuccessfulPaymentByUserAndProductAsync(userId, productId, productType);
                    if (existingPayment != null)
                    {
                        _logger.LogWarning("User {UserId} đã mua Course {ProductId}", userId, productId);
                        response.Success = false;
                        response.Message = "Bạn đã mua khóa học này rồi";
                        return response;
                    }
                }
                else if (productType == ProductType.TeacherPackage)
                {
                    // TeacherPackage: Check for an ACTIVE subscription instead of any past payment
                    var activeSub = await _teacherSubscriptionRepository.GetActiveSubscriptionAsync(userId);
                    if (activeSub != null && activeSub.EndDate > DateTime.UtcNow)
                    {
                        _logger.LogWarning("User {UserId} already has an active TeacherPackage subscription until {EndDate}", userId, activeSub.EndDate);
                        response.Success = false;
                        response.Message = "Bạn đã có gói giáo viên đang hoạt động. Vui lòng đợi gói hiện tại hết hạn trước khi mua gói mới.";
                        return response;
                    }
                }

                response.Success = true;
                response.Data = true;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi validate user payment cho User {UserId}", userId);
                response.Success = false;
                response.Message = "Đã xảy ra lỗi khi kiểm tra thông tin thanh toán";
            }

            return response;
        }
    }
}
