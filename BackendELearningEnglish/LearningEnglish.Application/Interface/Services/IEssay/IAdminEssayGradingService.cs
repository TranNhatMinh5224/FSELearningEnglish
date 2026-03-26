using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Common;

namespace LearningEnglish.Application.Interface
{
    public interface IAdminEssayGradingService
    {
        // Admin có thể grade thủ công bất kỳ submission nào
        Task<ServiceResponse<EssayGradingResultDto>> GradeByAdminAsync(int submissionId, TeacherGradingDto dto, CancellationToken cancellationToken = default);
    }
}
