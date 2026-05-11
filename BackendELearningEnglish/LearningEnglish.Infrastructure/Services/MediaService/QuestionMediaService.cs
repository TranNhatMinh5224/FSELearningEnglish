using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class QuestionMediaService : IQuestionMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<QuestionMediaService> _logger;

    public QuestionMediaService(IMinioFileStorage minioFileStorage, ILogger<QuestionMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string MediaKey, string ContentType)>> CommitMediaAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string MediaKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.QuestionBucket, StorageConstants.QuestionFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteMediaAsync(string mediaKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(mediaKey, StorageConstants.QuestionBucket);
    public string BuildMediaUrl(string? mediaKey) => string.IsNullOrWhiteSpace(mediaKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.QuestionBucket, mediaKey);
}
