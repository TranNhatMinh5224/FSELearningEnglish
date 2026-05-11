namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;

public interface IQuestionMediaService
{
    Task<ServiceResponse<(string MediaKey, string ContentType)>> CommitMediaAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteMediaAsync(string mediaKey, CancellationToken cancellationToken = default);

    string BuildMediaUrl(string? mediaKey);
}
