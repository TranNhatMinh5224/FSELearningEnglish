using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.Common.Pagination;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    public class TeacherEssaySubmissionService : ITeacherEssaySubmissionService
    {
        private readonly IEssaySubmissionRepository _essaySubmissionRepository;
        private readonly IEssayRepository _essayRepository;
        private readonly IAssessmentRepository _assessmentRepository;
        private readonly IEssayAttachmentService _attachmentService;
        private readonly IAvatarService _avatarService;
        private readonly IMapper _mapper;
        private readonly ILogger<TeacherEssaySubmissionService> _logger;


        public TeacherEssaySubmissionService(
            IEssaySubmissionRepository essaySubmissionRepository,
            IEssayRepository essayRepository,
            IAssessmentRepository assessmentRepository,
            IEssayAttachmentService attachmentService,
            IAvatarService avatarService,
            IMapper mapper,
            ILogger<TeacherEssaySubmissionService> logger)
        {
            _essaySubmissionRepository = essaySubmissionRepository;
            _essayRepository = essayRepository;
            _assessmentRepository = assessmentRepository;
            _attachmentService = attachmentService;
            _avatarService = avatarService;
            _mapper = mapper;
            _logger = logger;
        }

        private async Task<bool> ValidateEssayOwnershipAsync(int essayId, int teacherId)
        {
            var essay = await _essayRepository.GetEssayByIdAsync(essayId);
            if (essay == null)
                return false;

            // Check if teacher owns the essay through assessment's module's lesson's course
            return essay.Assessment?.Module?.Lesson?.Course?.TeacherId == teacherId;
        }

        private async Task<bool> ValidateSubmissionEssayOwnershipAsync(int submissionId, int teacherId)
        {
            var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
            if (submission?.Essay == null)
                return false;

            return await ValidateEssayOwnershipAsync(submission.EssayId, teacherId);
        }

        public async Task<ServiceResponse<PagedResult<EssaySubmissionListDto>>> GetSubmissionsByEssayIdPagedAsync(
            int essayId,
            int teacherId,
            PageRequest request)
        {
            var response = new ServiceResponse<PagedResult<EssaySubmissionListDto>>();

            try
            {
                if (!await ValidateEssayOwnershipAsync(essayId, teacherId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền xem submissions của essay này";
                    return response;
                }

                var totalCount = await _essaySubmissionRepository.GetSubmissionsCountByEssayIdAsync(essayId);
                var submissions = await _essaySubmissionRepository.GetSubmissionsByEssayIdPagedAsync(
                    essayId, 
                    request.PageNumber, 
                    request.PageSize);

                var submissionListDtos = _mapper.Map<List<EssaySubmissionListDto>>(submissions);

                foreach (var submissionDto in submissionListDtos)
                {
                    var submission = submissions.FirstOrDefault(s => s.SubmissionId == submissionDto.SubmissionId);
                    if (submission?.User != null && !string.IsNullOrWhiteSpace(submission.User.AvatarKey))
                    {
                        submissionDto.UserAvatarUrl = _avatarService.BuildAvatarUrl(submission.User.AvatarKey);
                    }
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = $"Lấy danh sách {submissionListDtos.Count} submission thành công";
                response.Data = new PagedResult<EssaySubmissionListDto>
                {
                    Items = submissionListDtos,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách submission theo Essay {EssayId}", essayId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống khi lấy danh sách submission";
                return response;
            }
        }

        public async Task<ServiceResponse<EssaySubmissionDto>> GetSubmissionDetailAsync(
            int submissionId,
            int teacherId)
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

                if (!await ValidateSubmissionEssayOwnershipAsync(submissionId, teacherId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền xem submission này";
                    return response;
                }

                var submissionDto = _mapper.Map<EssaySubmissionDto>(submission);

                if (!string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    submissionDto.AttachmentUrl = _attachmentService.BuildAttachmentUrl(submission.AttachmentKey);
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Message = "Lấy thông tin submission thành công";
                response.Data = submissionDto;

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin submission");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Lỗi hệ thống khi lấy thông tin submission";
                return response;
            }
        }

        public async Task<ServiceResponse<(Stream fileStream, string fileName, string contentType)>> DownloadSubmissionFileAsync(
            int submissionId,
            int teacherId)
        {
            var response = new ServiceResponse<(Stream, string, string)>();

            try
            {
                var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    response.Success = false;
                    response.Message = "Không tìm thấy bài nộp";
                    response.StatusCode = 404;
                    return response;
                }

                if (!await ValidateSubmissionEssayOwnershipAsync(submissionId, teacherId))
                {
                    response.Success = false;
                    response.Message = "Bạn không có quyền tải file của submission này";
                    response.StatusCode = 403;
                    return response;
                }

                if (string.IsNullOrWhiteSpace(submission.AttachmentKey))
                {
                    response.Success = false;
                    response.Message = "Bài nộp không có file đính kèm";
                    response.StatusCode = 404;
                    return response;
                }

                var downloadResult = await _attachmentService.DownloadAttachmentAsync(submission.AttachmentKey);
                if (!downloadResult.Success || downloadResult.Data == null)
                {
                    response.Success = false;
                    response.Message = $"Không thể tải file: {downloadResult.Message}";
                    response.StatusCode = downloadResult.StatusCode;
                    return response;
                }

                var fileName = Path.GetFileName(submission.AttachmentKey);
                var contentType = submission.AttachmentType ?? "application/octet-stream";

                response.Data = (downloadResult.Data, fileName, contentType);
                response.Success = true;
                response.Message = "Tải file thành công";
                response.StatusCode = 200;

                _logger.LogInformation("Teacher {TeacherId} downloaded submission file. SubmissionId={SubmissionId}, FileName={FileName}", 
                    teacherId, submissionId, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tải file submission. SubmissionId={SubmissionId}", submissionId);
                response.Success = false;
                response.Message = $"Lỗi: {ex.Message}";
                response.StatusCode = 500;
            }

            return response;
        }

        public async Task<ServiceResponse<EssaySubmissionDto>> GradeSubmissionAsync(int submissionId, int teacherId, decimal score, string? feedback)
        {
            var response = new ServiceResponse<EssaySubmissionDto>();

            try
            {
                // Validate ownership
                if (!await ValidateSubmissionEssayOwnershipAsync(submissionId, teacherId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền chấm bài nộp này";
                    return response;
                }

                var submission = await _essaySubmissionRepository.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy bài nộp";
                    return response;
                }

                var essay = await _essayRepository.GetEssayByIdAsync(submission.EssayId);
                if (essay == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy bài essay";
                    return response;
                }

                var assessment = await _assessmentRepository.GetAssessmentById(essay.AssessmentId);
                if (assessment == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy assessment";
                    return response;
                }

                // Validate score
                if (score < 0 || score > essay.TotalPoints)
                {
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = $"Điểm không hợp lệ. Phải từ 0 đến {essay.TotalPoints}";
                    return response;
                }

                // Update score (dùng TeacherScore để override AI score)
                submission.TeacherScore = score;
                submission.TeacherFeedback = feedback;
                submission.GradedByTeacherId = teacherId;
                submission.TeacherGradedAt = DateTime.UtcNow;
                submission.Status = SubmissionStatus.Graded;

                await _essaySubmissionRepository.UpdateSubmissionAsync(submission);

                response.Data = _mapper.Map<EssaySubmissionDto>(submission);
                response.Success = true;
                response.Message = "Chấm điểm thành công";
                response.StatusCode = 200;

                _logger.LogInformation("Teacher {TeacherId} graded submission {SubmissionId} with score {Score}", teacherId, submissionId, score);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error grading submission {SubmissionId}", submissionId);
                response.Success = false;
                response.Message = $"Lỗi: {ex.Message}";
                response.StatusCode = 500;
            }

            return response;
        }

        public async Task<ServiceResponse<EssayStatisticsDto>> GetEssayStatisticsAsync(int essayId, int teacherId)
        {
            var response = new ServiceResponse<EssayStatisticsDto>();

            try
            {
                // Validate ownership
                if (!await ValidateEssayOwnershipAsync(essayId, teacherId))
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn không có quyền xem thống kê essay này";
                    return response;
                }

                var submissions = await _essaySubmissionRepository.GetSubmissionsByEssayIdAsync(essayId);

                var stats = new EssayStatisticsDto
                {
                    EssayId = essayId,
                    TotalSubmissions = submissions.Count,
                    Pending = submissions.Count(s => s.Status != SubmissionStatus.Graded),
                    GradedByAi = submissions.Count(s => s.Status == SubmissionStatus.Graded && s.GradedByTeacherId == null),
                    GradedByTeacher = submissions.Count(s => s.GradedByTeacherId != null),
                    NoTextContent = submissions.Count(s => string.IsNullOrWhiteSpace(s.TextContent))
                };

                response.Data = stats;
                response.Success = true;
                response.Message = "Lấy thống kê thành công";
                response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics for essay {EssayId}", essayId);
                response.Success = false;
                response.Message = $"Lỗi: {ex.Message}";
                response.StatusCode = 500;
            }

            return response;
        }

    }
}
