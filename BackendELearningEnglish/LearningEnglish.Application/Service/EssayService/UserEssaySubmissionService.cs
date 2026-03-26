using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services.Module;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
  
    public class UserEssaySubmissionService : IUserEssaySubmissionService
    {
        private readonly IEssaySubmissionRepository _essaySubmissionRepository;
        private readonly IEssayRepository _essayRepository;
        private readonly IAssessmentRepository _assessmentRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IModuleProgressService _moduleProgressService;
        private readonly IEssayAttachmentService _attachmentService;
        private readonly ICourseRepository _courseRepository;
        private readonly IModuleRepository _moduleRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UserEssaySubmissionService> _logger;

        public UserEssaySubmissionService(
            IEssaySubmissionRepository essaySubmissionRepository,
            IEssayRepository essayRepository,
            IAssessmentRepository assessmentRepository,
            INotificationRepository notificationRepository,
            IModuleProgressService moduleProgressService,
            IEssayAttachmentService attachmentService,
            ICourseRepository courseRepository,
            IModuleRepository moduleRepository,
            ILessonRepository lessonRepository,
            IMapper mapper,
            ILogger<UserEssaySubmissionService> logger)
        {
            _essaySubmissionRepository = essaySubmissionRepository;
            _essayRepository = essayRepository;
            _assessmentRepository = assessmentRepository;
            _notificationRepository = notificationRepository;
            _moduleProgressService = moduleProgressService;
            _attachmentService = attachmentService;
            _courseRepository = courseRepository;
            _moduleRepository = moduleRepository;
            _lessonRepository = lessonRepository;
            _mapper = mapper;
            _logger = logger;
        }

        // Tạo notification khi user nộp essay
        private async Task CreateEssaySubmissionNotificationAsync(int userId, string essayTitle)
        {
            try
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    UserId = userId,
                    Title = " Nộp bài essay thành công",
                    Message = $"Bạn đã nộp bài essay '{essayTitle}' thành công. Giáo viên sẽ chấm điểm sớm.",
                    Type = NotificationType.AssessmentGraded,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create essay submission notification failed for UserId: {UserId}, EssayTitle: {EssayTitle}. Error: {Error}", 
                    userId, essayTitle, ex.ToString());
            }
        }

        // User nộp bài essay
        public async Task<ServiceResponse<EssaySubmissionDto>> CreateSubmissionAsync(CreateEssaySubmissionDto dto, int userId)
        {
            var response = new ServiceResponse<EssaySubmissionDto>();

            try
            {
                // Kiểm tra essay tồn tại
                var essay = await _essayRepository.GetEssayByIdAsync(dto.EssayId);
                if (essay == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Essay không tồn tại";
                    return response;
                }

                // Kiểm tra hạn nộp assessment
                var assessment = await _assessmentRepository.GetAssessmentById(essay.AssessmentId);
                if (assessment == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy Assessment";
                    return response;
                }

                // Check enrollment: User phải enroll vào course để nộp essay
                var module = await _moduleRepository.GetModuleWithCourseAsync(assessment.ModuleId);
                if (module == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy Module";
                    return response;
                }

                var courseId = module.Lesson?.CourseId;
                if (!courseId.HasValue)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy khóa học";
                    return response;
                }

                var isEnrolled = await _courseRepository.IsUserEnrolled(courseId.Value, userId);
                if (!isEnrolled)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn cần đăng ký khóa học để nộp Essay này";
                    _logger.LogWarning("User {UserId} attempted to submit essay {EssayId} without enrollment", 
                        userId, dto.EssayId);
                    return response;
                }

                if (assessment.DueAt != null && DateTime.UtcNow > assessment.DueAt)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Assessment đã quá hạn nộp bài";
                    return response;
                }

                // Không cho nộp lại
                var existed = await _essaySubmissionRepository
                    .GetUserSubmissionForEssayAsync(userId, dto.EssayId);

                if (existed != null)
                {
                    response.Success = false;
                    response.StatusCode = 409;
                    response.Message = "Bạn đã nộp bài essay này rồi";
                    return response;
                }

                // Commit file attachment
                string? attachmentKey = null;
                if (!string.IsNullOrWhiteSpace(dto.AttachmentTempKey))
                {
                    try
                    {
                        attachmentKey = await _attachmentService.CommitAttachmentAsync(dto.AttachmentTempKey);
                    }
                    catch (Exception attachEx)
                    {
                        _logger.LogError(attachEx, "Failed to commit essay attachment");
                        response.Success = false;
                        response.StatusCode = 400;
                        response.Message = "Không thể lưu file đính kèm";
                        return response;
                    }
                }

                // Tạo submission
                var submission = new EssaySubmission
                {
                    EssayId = dto.EssayId,
                    UserId = userId,
                    TextContent = dto.TextContent,
                    AttachmentKey = attachmentKey,
                    AttachmentType = dto.AttachmentType,
                    SubmittedAt = DateTime.UtcNow,
                    Status = SubmissionStatus.Submitted
                };

                var created = await _essaySubmissionRepository.CreateSubmissionAsync(submission);

                // Hoàn thành module nếu có
                if (assessment?.ModuleId != null)
                    await _moduleProgressService.CompleteModuleAsync(userId, assessment.ModuleId);

                // Tạo notification
                await CreateEssaySubmissionNotificationAsync(userId, essay.Title);

                // Map DTO
                var dtoResult = _mapper.Map<EssaySubmissionDto>(created);
                if (!string.IsNullOrWhiteSpace(created.AttachmentKey))
                {
                    dtoResult.AttachmentUrl = _attachmentService.BuildAttachmentUrl(created.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 201;
                response.Message = "Nộp bài Essay thành công";
                response.Data = dtoResult;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateSubmission failed for UserId: {UserId}, EssayId: {EssayId}. Error: {Error}", 
                    userId, dto.EssayId, ex.ToString());
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống khi nộp bài Essay";
                return response;
            }
        }

        // Lấy submission của chính user theo submissionId
        public async Task<ServiceResponse<EssaySubmissionDto>> GetMySubmissionByIdAsync(int submissionId, int userId)
        {
            var response = new ServiceResponse<EssaySubmissionDto>();

            try
            {
                var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Submission không tồn tại";
                    return response;
                }

                if (submission.UserId != userId)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Không có quyền truy cập submission này";
                    return response;
                }

                var dto = _mapper.Map<EssaySubmissionDto>(submission);
                if (!string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    dto.AttachmentUrl = _attachmentService.BuildAttachmentUrl(submission.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Lấy submission thành công";
                response.Data = dto;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetMySubmissionById failed for SubmissionId: {SubmissionId}, UserId: {UserId}. Error: {Error}", 
                    submissionId, userId, ex.ToString());
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống";
                return response;
            }
        }

        // Lấy submission của user theo essayId
        public async Task<ServiceResponse<EssaySubmissionDto?>> GetMySubmissionForEssayAsync(int userId, int essayId)
        {
            var response = new ServiceResponse<EssaySubmissionDto?>();

            try
            {
                var submission = await _essaySubmissionRepository
                    .GetUserSubmissionForEssayAsync(userId, essayId);

                if (submission == null)
                {
                    response.Success = true;
                    response.StatusCode = 200;
                    response.Message = "User chưa nộp bài";
                    response.Data = null;
                    return response;
                }

                var dto = _mapper.Map<EssaySubmissionDto>(submission);
                if (!string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    dto.AttachmentUrl = _attachmentService.BuildAttachmentUrl(submission.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Lấy submission thành công";
                response.Data = dto;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetMySubmissionForEssay failed for UserId: {UserId}, EssayId: {EssayId}. Error: {Error}", 
                    userId, essayId, ex.ToString());
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống";
                return response;
            }
        }

        // User cập nhật bài nộp
        public async Task<ServiceResponse<EssaySubmissionDto>> UpdateSubmissionAsync(
            int submissionId, UpdateEssaySubmissionDto dto, int userId)
        {
            var response = new ServiceResponse<EssaySubmissionDto>();

            try
            {
                var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Submission không tồn tại";
                    return response;
                }

                if (!await _essaySubmissionRepository.IsUserOwnerOfSubmissionAsync(userId, submissionId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Không có quyền cập nhật";
                    return response;
                }

                // Xóa attachment cũ nếu yêu cầu
                if (dto.RemoveAttachment && !string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    await _attachmentService.DeleteAttachmentAsync(submission.AttachmentKey);
                    submission.AttachmentKey = null;
                    submission.AttachmentType = null;
                }

                // Commit attachment mới
                if (!string.IsNullOrWhiteSpace(dto.AttachmentTempKey))
                {
                    try
                    {
                        var attachmentKey = await _attachmentService.CommitAttachmentAsync(dto.AttachmentTempKey);
                        submission.AttachmentKey = attachmentKey;
                        submission.AttachmentType = dto.AttachmentType;
                    }
                    catch (Exception attachEx)
                    {
                        _logger.LogError(attachEx, "Failed to commit new essay attachment");
                        response.Success = false;
                        response.StatusCode = 400;
                        response.Message = "Không thể lưu file mới";
                        return response;
                    }
                }

                submission.TextContent = dto.TextContent;

                var updated = await _essaySubmissionRepository.UpdateSubmissionAsync(submission);

                var result = _mapper.Map<EssaySubmissionDto>(updated);
                if (!string.IsNullOrWhiteSpace(updated.AttachmentKey))
                {
                    result.AttachmentUrl = _attachmentService.BuildAttachmentUrl(updated.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Cập nhật submission thành công";
                response.Data = result;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateSubmission failed for SubmissionId: {SubmissionId}, UserId: {UserId}. Error: {Error}", 
                    submissionId, userId, ex.ToString());
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống";
                return response;
            }
        }

        // User xóa bài nộp
        public async Task<ServiceResponse<bool>> DeleteSubmissionAsync(int submissionId, int userId)
        {
            var response = new ServiceResponse<bool>();

            try
            {
                var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Submission không tồn tại";
                    return response;
                }

                if (!await _essaySubmissionRepository.IsUserOwnerOfSubmissionAsync(userId, submissionId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Không có quyền xóa";
                    return response;
                }

                await _essaySubmissionRepository.DeleteSubmissionAsync(submissionId);

                if (!string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    await _attachmentService.DeleteAttachmentAsync(submission.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Xóa submission thành công";
                response.Data = true;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeleteSubmission failed for SubmissionId: {SubmissionId}, UserId: {UserId}. Error: {Error}", 
                    submissionId, userId, ex.ToString());
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống";
                return response;
            }
        }

    }
}
