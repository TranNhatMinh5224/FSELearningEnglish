using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface.Services.TeacherPackage;
using LearningEnglish.Application.Common;
using LearningEnglish.Domain.Entities;
using AutoMapper;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;
using LearningEnglish.Application.Interface;

namespace LearningEnglish.Application.Service
{
    public class TeacherSubscriptionService : ITeacherSubscriptionService
    {
        private readonly ITeacherSubscriptionRepository _teacherSubscriptionRepository;
        private readonly ITeacherPackageRepository _teacherPackageRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TeacherSubscriptionService> _logger;

        public TeacherSubscriptionService(
            ITeacherSubscriptionRepository teacherSubscriptionRepository, 
            ITeacherPackageRepository teacherPackageRepository,
            IMapper mapper, 
            ILogger<TeacherSubscriptionService> logger)
        {
            _teacherSubscriptionRepository = teacherSubscriptionRepository;
            _teacherPackageRepository = teacherPackageRepository;
            _mapper = mapper;
            _logger = logger;
        }





        // xử lý mua gói teacher 




        public async Task<ServiceResponse<ResPurchaseTeacherPackageDto>> AddTeacherSubscriptionAsync(PurchaseTeacherPackageDto dto, int userId, int? paymentId = null)
        { 
            var response = new ServiceResponse<ResPurchaseTeacherPackageDto>();
            try
            {
                // 1. Double-check existing active subscription
                var existingSubscription = await _teacherSubscriptionRepository.GetActiveSubscriptionAsync(userId);
                if (existingSubscription != null && existingSubscription.EndDate > DateTime.UtcNow)
                {
                    _logger.LogWarning("User {UserId} already has an active subscription until {EndDate}", userId, existingSubscription.EndDate);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Bạn đã có gói giáo viên đang hoạt động. Vui lòng đợi gói hiện tại hết hạn trước khi mua gói mới";
                    return response;
                }

                // 2. Fetch package to get details (Price, Duration)
                var package = await _teacherPackageRepository.GetTeacherPackageByIdAsync(dto.IdTeacherPackage);
                if (package == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy thông tin gói giáo viên.";
                    return response;
                }

                // 3. Create new subscription
                var startDate = DateTime.UtcNow;
                var durationMonths = package.DurationMonths > 0 ? package.DurationMonths : 12; // Fallback to 12
                
                var teacherSubscription = new TeacherSubscription
                {
                    UserId = userId,
                    TeacherPackageId = dto.IdTeacherPackage,
                    StartDate = startDate,
                    EndDate = startDate.AddMonths(durationMonths),
                    Status = SubscriptionStatus.Active,
                    PaymentId = paymentId,
                    CreatedAt = DateTime.UtcNow
                };

                await _teacherSubscriptionRepository.AddTeacherSubscriptionAsync(teacherSubscription);

                // 4. Map to Result DTO
                // Manually assign package info because navigation property might be null after save
                var resultDto = _mapper.Map<ResPurchaseTeacherPackageDto>(teacherSubscription);
                resultDto.PackageName = package.PackageName;
                resultDto.Price = package.Price;

                _logger.LogInformation("User {UserId} successfully purchased package {PackageName}. Valid until {EndDate}", 
                    userId, package.PackageName, teacherSubscription.EndDate);

                response.Data = resultDto;
                response.Success = true;
                response.StatusCode = 201;
                response.Message = "Gói giáo viên đã được kích hoạt thành công.";
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding teacher subscription for user {UserId}", userId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi kích hoạt gói giáo viên.";
                return response;
            }
        }
        // xử lý hủy gói teacher
        public async Task<ServiceResponse<bool>> DeleteTeacherSubscriptionAsync(DeleteTeacherSubscriptionDto dto, int userId)
        { 
            var response = new ServiceResponse<bool>();
            try
            {
                // Check ownership: user chỉ có thể xóa subscription của chính mình
                var teacherSubscription = await _teacherSubscriptionRepository.GetTeacherSubscriptionByIdAndUserIdAsync(
                    dto.TeacherSubscriptionId, userId);
                
                if (teacherSubscription == null)
                {
                    _logger.LogWarning("User {UserId} attempted to delete subscription {SubscriptionId} that doesn't exist or doesn't belong to them", 
                        userId, dto.TeacherSubscriptionId);
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Data = false;
                    response.Message = "Không tìm thấy subscription hoặc bạn không có quyền xóa subscription này";
                    return response;
                }

                await _teacherSubscriptionRepository.DeleteTeacherSubscriptionAsync(teacherSubscription);

                response.Data = true;
                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Teacher subscription deleted successfully.";
                return response;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting teacher subscription {SubscriptionId} for user {UserId}", 
                    dto.TeacherSubscriptionId, userId);
                response.Success = false;
                response.StatusCode = 500;
                response.Data = false;
                response.Message = "An error occurred while deleting the teacher subscription.";
                return response;
                
            }
        }
    }
}
