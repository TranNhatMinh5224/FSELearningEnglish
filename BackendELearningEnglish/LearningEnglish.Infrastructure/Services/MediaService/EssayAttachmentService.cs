using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class EssayAttachmentService : IEssayAttachmentService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<EssayAttachmentService> _logger;

    public EssayAttachmentService(
        IMinioFileStorage minioFileStorage,
        ILogger<EssayAttachmentService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string Key, string ContentType)>> CommitAttachmentAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string Key, string ContentType)>();

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
                StorageConstants.EssayAttachmentBucket,
                StorageConstants.EssayAttachmentFolder);

            if (!result.Success || result.Data == null)
            {
                _logger.LogError("Failed to commit essay attachment. TempKey: {TempKey}, Message: {Message}",
                    tempKey, result.Message);
                response.Success = false;
                response.Message = $"Failed to commit essay attachment: {result.Message}";
                response.StatusCode = result.StatusCode;
                return response;
            }

            _logger.LogInformation("Essay attachment committed successfully. TempKey: {TempKey}, AttachmentKey: {AttachmentKey}",
                tempKey, result.Data.RealKey);

            response.Data = (result.Data.RealKey, result.Data.ContentType);
            response.Success = true;
            response.StatusCode = 200;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in CommitAttachmentAsync for TempKey: {TempKey}", tempKey);
            response.Success = false;
            response.Message = "Đã xảy ra lỗi hệ thống khi lưu trữ file đính kèm bài luận.";
            response.StatusCode = 500;
        }

        return response;
    }

    public async Task DeleteAttachmentAsync(string attachmentKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(attachmentKey))
        {
            return;
        }

        try
        {
            var result = await _minioFileStorage.DeleteFileAsync(
                attachmentKey,
                StorageConstants.EssayAttachmentBucket);

            if (result.Success)
            {
                _logger.LogInformation("Essay attachment deleted successfully. AttachmentKey: {AttachmentKey}", attachmentKey);
            }
            else
            {
                _logger.LogWarning("Failed to delete essay attachment. AttachmentKey: {AttachmentKey}, Message: {Message}", 
                    attachmentKey, result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting essay attachment. AttachmentKey: {AttachmentKey}", attachmentKey);
        }
    }

    public string BuildAttachmentUrl(string? attachmentKey)
    {
        if (string.IsNullOrWhiteSpace(attachmentKey))
        {
            return string.Empty;
        }

        return BuildPublicUrl.BuildURL(StorageConstants.EssayAttachmentBucket, attachmentKey);
    }

    public async Task<ServiceResponse<Stream>> DownloadAttachmentAsync(string attachmentKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(attachmentKey))
        {
            return new ServiceResponse<Stream>
            {
                Success = false,
                StatusCode = 400,
                Message = "Attachment key cannot be empty"
            };
        }

        var result = await _minioFileStorage.DownloadFileAsync(
            attachmentKey,
            StorageConstants.EssayAttachmentBucket);

        return result;
    }
}

