namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;

public interface IModuleImageService
{
    Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default);

    string BuildImageUrl(string? imageKey);
}
