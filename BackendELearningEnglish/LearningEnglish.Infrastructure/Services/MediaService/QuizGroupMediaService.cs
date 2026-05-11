using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Infrastructure.Common.Constants;
using LearningEnglish.Infrastructure.Common.Helpers;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.MediaService;

public class QuizGroupMediaService : IQuizGroupMediaService
{
    private readonly IMinioFileStorage _minioFileStorage;
    private readonly ILogger<QuizGroupMediaService> _logger;

    public QuizGroupMediaService(IMinioFileStorage minioFileStorage, ILogger<QuizGroupMediaService> logger)
    {
        _minioFileStorage = minioFileStorage;
        _logger = logger;
    }

    public async Task<ServiceResponse<(string ImageKey, string ContentType)>> CommitImageAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string ImageKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.QuizGroupBucket, StorageConstants.QuizGroupFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task<ServiceResponse<(string VideoKey, string ContentType)>> CommitVideoAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string VideoKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.QuizGroupBucket, StorageConstants.QuizGroupFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task<ServiceResponse<(string AudioKey, string ContentType)>> CommitAudioAsync(string tempKey, CancellationToken cancellationToken = default)
    {
        var response = new ServiceResponse<(string AudioKey, string ContentType)>();
        var result = await _minioFileStorage.CommitFileAsync(tempKey, StorageConstants.QuizGroupBucket, StorageConstants.QuizGroupFolder);
        if (!result.Success || result.Data == null) { response.Success = false; response.Message = result.Message; return response; }
        response.Data = (result.Data.RealKey, result.Data.ContentType);
        return response;
    }

    public async Task DeleteImageAsync(string imageKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(imageKey, StorageConstants.QuizGroupBucket);
    public async Task DeleteVideoAsync(string videoKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(videoKey, StorageConstants.QuizGroupBucket);
    public async Task DeleteAudioAsync(string audioKey, CancellationToken cancellationToken = default) => await _minioFileStorage.DeleteFileAsync(audioKey, StorageConstants.QuizGroupBucket);
    public string BuildImageUrl(string? imageKey) => string.IsNullOrWhiteSpace(imageKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.QuizGroupBucket, imageKey);
    public string BuildVideoUrl(string? videoKey) => string.IsNullOrWhiteSpace(videoKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.QuizGroupBucket, videoKey);
    public string BuildAudioUrl(string? audioKey) => string.IsNullOrWhiteSpace(audioKey) ? string.Empty : BuildPublicUrl.BuildURL(StorageConstants.QuizGroupBucket, audioKey);
}
