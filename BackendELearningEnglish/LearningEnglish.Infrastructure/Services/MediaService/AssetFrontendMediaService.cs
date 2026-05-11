using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class AssetFrontendMediaService : IAssetFrontendMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<AssetFrontendMediaService> _logger;

    public AssetFrontendMediaService(
        IMinioFileStorage minioFileStorage,
        ILogger<AssetFrontendMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string KeyImage, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string KeyImage, string ContentType)>();

        try
        {
            if (string.IsNullOrWhiteSpace(tempKey))
            {
                response.Success = false;
                response.Message = "Temp key cannot be null or empty";
                response.StatusCode = 400;
                return response;
            }

            var result = await _minioFileStorage.CommitFileAsync(
                tempKey,
                StorageConstants.AssetImageBucket,
                StorageConstants.AssetImageFolder);

            if (!result.Success || result.Data == null)
            {
                _logger.LogError(
                    "Failed to commit asset frontend image. TempKey: {TempKey}, Message: {Message}",
                    tempKey,
                    result.Message);

                response.Success = false;
                response.Message = $"Failed to commit asset frontend image: {result.Message}";
                response.StatusCode = result.StatusCode;
                return response;
            }

            _logger.LogInformation(
                "Asset frontend image committed successfully. TempKey: {TempKey}, ImageKey: {ImageKey}",
                tempKey,
                result.Data.RealKey);

            response.Data = (result.Data.RealKey, result.Data.ContentType);
            response.Success = true;
            response.StatusCode = 200;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in CommitImageAsync for TempKey: {TempKey}", tempKey);
            response.Success = false;
            response.Message = "Đã xảy ra lỗi hệ thống khi lưu trữ ảnh asset frontend.";
            response.StatusCode = 500;
        }

        return response;
    }

    public async Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageKey))
        {
            return;
        }

        try
        {
            var result = await _minioFileStorage.DeleteFileAsync(
                imageKey,
                StorageConstants.AssetImageBucket);

            if (result.Success)
            {
                _logger.LogInformation("Asset frontend image deleted successfully. ImageKey: {ImageKey}", imageKey);
            }
            else
            {
                _logger.LogWarning("Failed to delete asset frontend image. ImageKey: {ImageKey}, Message: {Message}",
                    imageKey, result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting asset frontend image. ImageKey: {ImageKey}", imageKey);
        }
    }

    public string BuildImageUrl(string? imageKey)
    {
        if (string.IsNullOrWhiteSpace(imageKey))
        {
            return string.Empty;
        }

        return BuildPublicUrl.BuildURL(StorageConstants.AssetImageBucket, imageKey);
    }
}
