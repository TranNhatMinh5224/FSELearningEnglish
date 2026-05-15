using Microsoft.AspNetCore.Http;
using LearningEnglish.Application.Common;

namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;

public interface IFlashCardMediaService
{
    Task<string?> UploadTempImageAsync(IFormFile file, CancellationToken cancellationToken = default);
    
    Task<string?> UploadTempAudioAsync(IFormFile file, CancellationToken cancellationToken = default);
    
    Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default);

    Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default);

    Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default);

    string BuildImageUrl(string? imageKey);

    string BuildAudioUrl(string? audioKey);
}
