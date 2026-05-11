using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class CourseImageService : ICourseImageService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<CourseImageService> _logger;

    public CourseImageService(IMinioFileStorage minioFileStorage, ILogger<CourseImageService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string ImageKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.CourseImageBucket, StorageConstants.CourseImageFolder);
        
        if (!result.Success || result.Data == null)
        {
            response.Success = false;
            response.Message = result.Message;
            return response;
        }

        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(imageKey, StorageConstants.CourseImageBucket);
    public string BuildImageUrl(string? imageKey) => string.IsNullOrWhiteSpace(imageKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.CourseImageBucket, imageKey);
}
