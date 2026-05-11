using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class LectureMediaService : ILectureMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<LectureMediaService> _logger;

    public LectureMediaService(
        IMinioFileStorage minioFileStorage,
        ILogger<LectureMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string MediaKey, string ContentType)>> CommitMediaAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string MediaKey, string ContentType)>();

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
                StorageConstants.LectureMediaBucket,
                StorageConstants.LectureMediaFolder);

            if (!result.Success || result.Data == null)
            {
                _logger.LogError(
                    "Failed to commit lecture media. TempKey: {TempKey}, Message: {Message}",
                    tempKey,
                    result.Message);

                response.Success = false;
                response.Message = $"Failed to commit lecture media: {result.Message}";
                response.StatusCode = result.StatusCode;
                return response;
            }

            _logger.LogInformation(
                "Lecture media committed successfully. TempKey: {TempKey}, MediaKey: {MediaKey}",
                tempKey,
                result.Data.RealKey);

            response.Data = (result.Data.RealKey, result.Data.ContentType);
            response.Success = true;
            response.StatusCode = 200;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in CommitMediaAsync for TempKey: {TempKey}", tempKey);
            response.Success = false;
            response.Message = "Đã xảy ra lỗi hệ thống khi lưu trữ media bài giảng.";
            response.StatusCode = 500;
        }

        return response;
    }

    public async Task DeleteMediaAsync(string mediaKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(mediaKey))
        {
            return;
        }

        try
        {
            var result = await _minioFileStorage.DeleteFileAsync(
                mediaKey,
                StorageConstants.LectureMediaBucket);

            if (result.Success)
            {
                _logger.LogInformation("Lecture media deleted successfully. MediaKey: {MediaKey}", mediaKey);
            }
            else
            {
                _logger.LogWarning("Failed to delete lecture media. MediaKey: {MediaKey}, Message: {Message}", 
                    mediaKey, result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting lecture media. MediaKey: {MediaKey}", mediaKey);
        }
    }

    public string BuildMediaUrl(string? mediaKey)
    {
        if (string.IsNullOrWhiteSpace(mediaKey))
        {
            return string.Empty;
        }

        return BuildPublicUrl.BuildURL(StorageConstants.LectureMediaBucket, mediaKey);
    }
}

