using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class AvatarService : IAvatarService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<AvatarService> _logger;

    public AvatarService(IMinioFileStorage minioFileStorage, ILogger<AvatarService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string AvatarKey, string ContentType)>> UploadTempAvatarAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string AvatarKey, string ContentType)>();
        var result = await _minioFileStorage.UpLoadFileTempAsync(file, StorageConstants.AvatarBucket, "temp");
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        
        // Vì là upload temp, ContentType lấy từ IFormFile hoặc metadata temp
        response.Data = (result.Data.TempKey, file.ContentType);
        return response;
    }

    public async Task<ServiceResponse<(string AvatarKey, string ContentType)>> CommitAvatarAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string AvatarKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.AvatarBucket, StorageConstants.AvatarFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteAvatarAsync(string avatarKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(avatarKey, StorageConstants.AvatarBucket);
    public string BuildAvatarUrl(string? avatarKey) => string.IsNullOrWhiteSpace(avatarKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.AvatarBucket, avatarKey);
}
