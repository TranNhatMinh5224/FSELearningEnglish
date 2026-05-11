using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class EssayMediaService : IEssayMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<EssayMediaService> _logger;

    public EssayMediaService(IMinioFileStorage minioFileStorage, ILogger<EssayMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string AudioKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.EssayAudioBucket, StorageConstants.EssayAudioFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string ImageKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.EssayImageBucket, StorageConstants.EssayImageFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(audioKey, StorageConstants.EssayAudioBucket);
    public async Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(imageKey, StorageConstants.EssayImageBucket);
    public string BuildAudioUrl(string? audioKey) => string.IsNullOrWhiteSpace(audioKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.EssayAudioBucket, audioKey);
    public string BuildImageUrl(string? imageKey) => string.IsNullOrWhiteSpace(imageKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.EssayImageBucket, imageKey);
}
