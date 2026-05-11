using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class FlashCardMediaService : IFlashCardMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<FlashCardMediaService> _logger;

    public FlashCardMediaService(IMinioFileStorage minioFileStorage, ILogger<FlashCardMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<string?> UploadTempImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var result = await _minioFileStorage.UpLoadFileTempAsync(file, StorageConstants.FlashCardBucket, "temp");
        return result.Success ? result.Data?.TempKey : null;
    }

    public async Task<string?> UploadTempAudioAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var result = await _minioFileStorage.UpLoadFileTempAsync(file, StorageConstants.FlashCardAudioBucket, "temp");
        return result.Success ? result.Data?.TempKey : null;
    }

    public async Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string ImageKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.FlashCardBucket, StorageConstants.FlashCardFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string AudioKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.FlashCardAudioBucket, StorageConstants.FlashCardFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(imageKey, StorageConstants.FlashCardBucket);
    public async Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(audioKey, StorageConstants.FlashCardAudioBucket);
    public string BuildImageUrl(string? imageKey) => string.IsNullOrWhiteSpace(imageKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.FlashCardBucket, imageKey);
    public string BuildAudioUrl(string? audioKey) => string.IsNullOrWhiteSpace(audioKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.FlashCardAudioBucket, audioKey);
}
