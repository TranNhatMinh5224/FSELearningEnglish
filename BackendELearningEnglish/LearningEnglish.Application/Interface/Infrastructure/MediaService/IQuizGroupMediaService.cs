namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;

public interface IQuizGroupMediaService
{
    Task<string> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);
    
    Task<string> CommitVideoAsync(string tempKey, CancellationToken cancellationToken = default);

    Task<string> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default);
    
    Task DeleteVideoAsync(string videoKey, CancellationToken cancellationToken = default);

    Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default);

    string BuildImageUrl(string? imageKey);
    
    string BuildVideoUrl(string? videoKey);

    string BuildAudioUrl(string? audioKey);
}
