namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;

public interface IAssetFrontendMediaService
{
    Task<ServiceResponse<(string KeyImage, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string keyImage, CancellationToken cancellationToken = default);

    string BuildImageUrl(string? keyImage);
}
