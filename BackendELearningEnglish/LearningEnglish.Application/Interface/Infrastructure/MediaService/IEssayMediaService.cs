namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;

public interface IEssayMediaService
{
    Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default);

    Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default);

    string BuildAudioUrl(string? audioKey);

    string BuildImageUrl(string? imageKey);
}
