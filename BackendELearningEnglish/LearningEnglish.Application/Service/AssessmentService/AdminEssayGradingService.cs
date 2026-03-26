using AutoMapper;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services;
using LearningEnglish.Application.Common;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service.EssayGrading;


public class AdminEssayGradingService : IAdminEssayGradingService
{
    private readonly IEssaySubmissionRepository _submissionRepository;
    private readonly IEssayRepository _essayRepository;
    private readonly IAssessmentRepository _assessmentRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<AdminEssayGradingService> _logger;

    public AdminEssayGradingService(
        IEssaySubmissionRepository submissionRepository,
        IEssayRepository essayRepository,
        IAssessmentRepository assessmentRepository,
        IMapper mapper,
        ILogger<AdminEssayGradingService> logger)
    {
        _submissionRepository = submissionRepository;
        _essayRepository = essayRepository;
        _assessmentRepository = assessmentRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ServiceResponse<EssayGradingResultDto>> GradeByAdminAsync(
        int submissionId, 
        TeacherGradingDto dto, 
        CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<EssayGradingResultDto>();
        
        try
        {
            _logger.LogInformation("👨‍💼 Admin grading submission {SubmissionId}", submissionId);

            var submission = await _submissionRepository.GetSubmissionByIdAsync(submissionId);
            if (submission == null)
            {
                response.Success = false;
                response.StatusCode = 404;
                response.Message = $"Không tìm thấy bài nộp với ID {submissionId}";
                return response;
            }

            var essay = await _essayRepository.GetEssayByIdAsync(submission.EssayId);
            if (essay == null)
            {
                response.Success = false;
                response.StatusCode = 404;
                response.Message = "Không tìm thấy đề bài essay";
                return response;
            }

            var assessment = await _assessmentRepository.GetAssessmentById(essay.AssessmentId);
            if (assessment == null)
            {
                response.Success = false;
                response.StatusCode = 404;
                response.Message = "Không tìm thấy bài kiểm tra";
                return response;
            }

            var maxScore = essay.TotalPoints;

            if (dto.Score > maxScore)
            {
                response.Success = false;
                response.StatusCode = 400;
                response.Message = $"Điểm ({dto.Score}) vượt quá điểm tối đa ({maxScore})";
                return response;
            }

            if (dto.Score < 0)
            {
                response.Success = false;
                response.StatusCode = 400;
                response.Message = "Điểm không thể âm";
                return response;
            }

            submission.TeacherScore = dto.Score;
            submission.TeacherFeedback = dto.Feedback;
            submission.GradedByTeacherId = null; // Admin không có teacherId
            submission.TeacherGradedAt = DateTime.UtcNow;
            submission.Status = SubmissionStatus.Graded;

            await _submissionRepository.UpdateSubmissionAsync(submission);

            _logger.LogInformation("✅ Admin grading completed for submission {SubmissionId}. Score: {Score}/{MaxScore}", 
                submissionId, dto.Score, maxScore);

            var result = _mapper.Map<EssayGradingResultDto>(submission);
            result.MaxScore = maxScore;

            response.Success = true;
            response.StatusCode = 200;
            response.Message = "Chấm điểm thành công bởi Admin";
            response.Data = result;
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error in admin grading for submission {SubmissionId}", submissionId);
            response.Success = false;
            response.StatusCode = 500;
            response.Message = "Có lỗi xảy ra khi chấm điểm";
            return response;
        }
    }

    }
