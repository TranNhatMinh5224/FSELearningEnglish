namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;

public interface IQuizGroupMediaService
{
    Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);
    
    Task<ServiceResponse<(string VideoKey, string ContentType)>> CommitVideoAsync(string tempKey, CancellationToken cancellationToken = default);

    Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default);
    
    Task DeleteVideoAsync(string videoKey, CancellationToken cancellationToken = default);

    Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default);

    string BuildImageUrl(string? imageKey);
    
    string BuildVideoUrl(string? videoKey);

    string BuildAudioUrl(string? audioKey);
}
