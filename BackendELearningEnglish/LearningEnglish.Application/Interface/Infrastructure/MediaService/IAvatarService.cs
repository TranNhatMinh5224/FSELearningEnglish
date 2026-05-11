using Microsoft.AspNetCore.Http;
using LearningEnglish.Application.Common;

namespace LearningEnglish.Application.Interface.Infrastructure.MediaService;

public interface IAvatarService
{
    Task<ServiceResponse<(string AvatarKey, string ContentType)>> UploadTempAvatarAsync(IFormFile file, CancellationToken cancellationToken = default);
    
    Task<ServiceResponse<(string AvatarKey, string ContentType)>> CommitAvatarAsync(string tempKey, CancellationToken cancellationToken = default);

    Task DeleteAvatarAsync(string avatarKey, CancellationToken cancellationToken = default);

    string BuildAvatarUrl(string? avatarKey);
}
