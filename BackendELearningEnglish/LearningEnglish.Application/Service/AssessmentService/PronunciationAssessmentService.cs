using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Pagination;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    // CHIẾN LƯỢC TỐI ƯU: Chỉ đánh giá phát âm realtime
    // - KHÔNG lưu PronunciationAssessment entities vào DB
    // - CHỈ lưu PronunciationProgress (aggregated metrics)
    // - Tối thiểu hóa lưu trữ DB để scale tốt hơn
    public class PronunciationAssessmentService : IPronunciationAssessmentService
    {
        private readonly IFlashCardRepository _flashCardRepository;
        private readonly IAzureSpeechService _azureSpeechService;
        private readonly IPronunciationProgressRepository _progressRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<PronunciationAssessmentService> _logger;
        private readonly IFlashCardMediaService _flashCardMediaService;
        private readonly IPronunciationMediaService _pronunciationMediaService;

        public PronunciationAssessmentService(
            IFlashCardRepository flashCardRepository,
            IAzureSpeechService azureSpeechService,
            IPronunciationProgressRepository progressRepository,
            IMapper mapper,
            ILogger<PronunciationAssessmentService> logger,
            IFlashCardMediaService flashCardMediaService,
            IPronunciationMediaService pronunciationMediaService)
        {
            _flashCardRepository = flashCardRepository;
            _azureSpeechService = azureSpeechService;
            _progressRepository = progressRepository;
            _mapper = mapper;
            _logger = logger;
            _flashCardMediaService = flashCardMediaService;
            _pronunciationMediaService = pronunciationMediaService;
        }

        // Create realtime pronunciation assessment - NO persistence, only progress tracking
        public async Task<ServiceResponse<PronunciationAssessmentDto>> CreateAssessmentAsync(
            CreatePronunciationAssessmentDto dto,
            int userId)
        {
            var response = new ServiceResponse<PronunciationAssessmentDto>();

            try
            {
                _logger.LogInformation("Starting pronunciation assessment for user {UserId}, flashCard {FlashCardId}",
                    userId, dto.FlashCardId);

                // 1. Get FlashCard
                var flashCard = await _flashCardRepository.GetByIdAsync(dto.FlashCardId);
                if (flashCard == null)
                {
                    response.Success = false;
                    response.Message = "FlashCard not found";
                    return response;
                }

                var referenceText = flashCard.Word;
                if (string.IsNullOrWhiteSpace(referenceText))
                {
                    response.Success = false;
                    response.Message = "FlashCard does not have a valid word to assess";
                    return response;
                }

                // 2. Generate temp audio URL using PronunciationMediaService
                var tempAudioUrl = _pronunciationMediaService.BuildAudioUrl(dto.AudioTempKey);

                // 3. Call Azure Speech Service - REALTIME assessment
                var azureResult = await _azureSpeechService.AssessPronunciationAsync(
                    tempAudioUrl,
                    referenceText);

                _logger.LogInformation("Azure result: Success={Success}, Score={Score}",
                    azureResult.Success, azureResult.PronunciationScore);

                // 4. Update ONLY PronunciationProgress (aggregated data)
                if (azureResult.Success)
                {
                    try
                    {
                        await _progressRepository.UpsertAsync(
                            userId,
                            dto.FlashCardId,
                            azureResult.AccuracyScore,
                            azureResult.FluencyScore,
                            azureResult.CompletenessScore,
                            azureResult.PronunciationScore,
                            azureResult.ProblemPhonemes,
                            azureResult.StrongPhonemes,
                            DateTime.UtcNow
                        );
                        _logger.LogInformation("Progress updated successfully");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to update progress");
                    }
                }

                // 5. Clean up temp audio - delete using PronunciationMediaService
                try
                {
                    await _pronunciationMediaService.DeleteTempAudioAsync(dto.AudioTempKey);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to delete temp audio: {Error}", ex.Message);
                }

                // 6. Build realtime response (not from DB)
                var resultDto = new PronunciationAssessmentDto
                {
                    UserId = userId,
                    FlashCardId = dto.FlashCardId,
                    ReferenceText = referenceText,
                    AudioUrl = string.Empty,
                    AudioType = dto.AudioType,
                    AudioSize = dto.AudioSize,
                    DurationInSeconds = dto.DurationInSeconds,

                    AccuracyScore = azureResult.AccuracyScore,
                    FluencyScore = azureResult.FluencyScore,
                    CompletenessScore = azureResult.CompletenessScore,
                    PronunciationScore = azureResult.PronunciationScore,

                    RecognizedText = azureResult.RecognizedText,
                    Feedback = azureResult.Success ? GenerateFeedback(azureResult) : azureResult.ErrorMessage,
                    Status = azureResult.Success ? "Completed" : "Failed",

                    Words = azureResult.Words,
                    ProblemPhonemes = azureResult.ProblemPhonemes,
                    StrongPhonemes = azureResult.StrongPhonemes,

                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    FlashCardWord = flashCard.Word
                };

                response.Success = true;
                response.Data = resultDto;
                response.Message = "Pronunciation assessed (realtime - not stored)";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assessment");
                response.Success = false;
                response.Message = $"Error: {ex.Message}";
            }

            return response;
        }

        // Get flashcards with pronunciation progress for a module
        public async Task<ServiceResponse<List<FlashCardWithPronunciationDto>>> GetFlashCardsWithPronunciationProgressAsync(
            int moduleId,
            int userId)
        {
            var response = new ServiceResponse<List<FlashCardWithPronunciationDto>>();

            try
            {
                // Get all flashcards in module
                var flashCards = await _flashCardRepository.GetByModuleIdAsync(moduleId);

                // Get all pronunciation progress for this user in this module
                var progresses = await _progressRepository.GetByModuleIdAsync(userId, moduleId);
                var progressDict = progresses.ToDictionary(p => p.FlashCardId);

                // Map flashcards with progress using AutoMapper
                var result = flashCards.Select(fc =>
                {
                    // Map FlashCard to DTO using AutoMapper
                    var dto = _mapper.Map<FlashCardWithPronunciationDto>(fc);
                    
                    // Add URLs manually (not in mapping)
                    dto.ImageUrl = !string.IsNullOrWhiteSpace(fc.ImageKey)
                        ? _flashCardMediaService.BuildImageUrl(fc.ImageKey)
                        : null;
                    dto.AudioUrl = !string.IsNullOrWhiteSpace(fc.AudioKey)
                        ? _flashCardMediaService.BuildAudioUrl(fc.AudioKey)
                        : null;

                    // Map progress if exists
                    if (progressDict.TryGetValue(fc.FlashCardId, out var progress) && progress != null)
                    {
                        var progressSummary = _mapper.Map<PronunciationProgressSummary>(progress);
                        
                        // Calculate status
                        if (progress.IsMastered)
                        {
                            progressSummary.Status = "Mastered";
                            progressSummary.StatusColor = "green";
                        }
                        else if (progress.TotalAttempts == 0)
                        {
                            progressSummary.Status = "Not Started";
                            progressSummary.StatusColor = "gray";
                        }
                        else
                        {
                            progressSummary.Status = "Practicing";
                            progressSummary.StatusColor = "yellow";
                        }
                        
                        dto.Progress = progressSummary;
                    }

                    return dto;
                }).ToList();

                response.Success = true;
                response.Data = result;
                response.Message = $"Retrieved {result.Count} flashcards with pronunciation progress";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting flashcards with pronunciation progress");
                response.Success = false;
                response.Message = $"Error: {ex.Message}";
            }

            return response;
        }

        // Get pronunciation summary/statistics for a module
        public async Task<ServiceResponse<ModulePronunciationSummaryDto>> GetModulePronunciationSummaryAsync(
            int moduleId,
            int userId)
        {
            var response = new ServiceResponse<ModulePronunciationSummaryDto>();

            try
            {
                // Get all flashcards in module
                var flashCards = await _flashCardRepository.GetByModuleIdAsync(moduleId);
                var totalFlashCards = flashCards.Count;

                if (totalFlashCards == 0)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Module không có flashcard nào";
                    return response;
                }

                // Get all pronunciation progress for this module
                var progresses = await _progressRepository.GetByModuleIdAsync(userId, moduleId);
                var progressDict = progresses.ToDictionary(p => p.FlashCardId);

                // Calculate basic statistics
                var totalPracticed = progresses.Count(p => p.TotalAttempts > 0);
                var masteredCount = progresses.Count(p => p.IsMastered);

                // Score statistics (only for practiced words)
                var practicedProgresses = progresses.Where(p => p.TotalAttempts > 0).ToList();
                var averageScore = practicedProgresses.Any() 
                    ? practicedProgresses.Average(p => p.AvgPronunciationScore) 
                    : 0;
                
                var averageAccuracy = practicedProgresses.Any()
                    ? practicedProgresses.Average(p => p.AvgAccuracyScore)
                    : 0;
                
                var averageFluency = practicedProgresses.Any()
                    ? practicedProgresses.Average(p => p.AvgFluencyScore)
                    : 0;
                
                var averageCompleteness = practicedProgresses.Any()
                    ? practicedProgresses.Average(p => p.AvgCompletenessScore)
                    : 0;

                // Practice info
                var lastPracticeDate = practicedProgresses.Any() 
                    ? practicedProgresses.Max(p => p.LastPracticedAt) 
                    : null;

                // Overall progress
                var overallProgress = totalFlashCards > 0 
                    ? Math.Round((double)totalPracticed / totalFlashCards * 100, 2) 
                    : 0;

                // Determine status, message and grade
                string status;
                string message;
                string grade;

                if (totalPracticed == 0)
                {
                    status = "Not Started";
                    message = $"Bắt đầu luyện phát âm {totalFlashCards} từ vựng!";
                    grade = "N/A";
                }
                else
                {
                    // Calculate grade based on average score
                    if (averageScore >= 95)
                    {
                        grade = "A+";
                        message = $"🌟 Xuất sắc! Điểm TB: {averageScore:F1}. Bạn đã thuộc {masteredCount}/{totalFlashCards} từ.";
                    }
                    else if (averageScore >= 90)
                    {
                        grade = "A";
                        message = $"🎉 Tuyệt vời! Điểm TB: {averageScore:F1}. Đã thuộc {masteredCount}/{totalFlashCards} từ.";
                    }
                    else if (averageScore >= 80)
                    {
                        grade = "B";
                        message = $"👍 Tốt! Điểm TB: {averageScore:F1}. Hãy luyện thêm để đạt điểm A.";
                    }
                    else if (averageScore >= 70)
                    {
                        grade = "C";
                        message = $"📚 Khá. Điểm TB: {averageScore:F1}. Cần cải thiện thêm.";
                    }
                    else if (averageScore >= 60)
                    {
                        grade = "D";
                        message = $"💪 Điểm TB: {averageScore:F1}. Hãy luyện nhiều hơn để cải thiện.";
                    }
                    else
                    {
                        grade = "F";
                        message = $"🔄 Điểm TB: {averageScore:F1}. Cần luyện tập nhiều hơn nữa.";
                    }

                    // Determine status
                    if (masteredCount == totalFlashCards)
                    {
                        status = "Mastered";
                    }
                    else if (overallProgress >= 80)
                    {
                        status = "Completed";
                    }
                    else
                    {
                        status = "In Progress";
                    }
                }

                // Get module name (if needed)
                var module = flashCards.FirstOrDefault()?.Module;
                var moduleName = module?.Name ?? "Module";

                var summary = new ModulePronunciationSummaryDto
                {
                    ModuleId = moduleId,
                    ModuleName = moduleName,
                    TotalFlashCards = totalFlashCards,
                    TotalPracticed = totalPracticed,
                    MasteredCount = masteredCount,
                    OverallProgress = overallProgress,
                    AverageScore = Math.Round(averageScore, 1),
                    AverageAccuracyScore = Math.Round(averageAccuracy, 1),
                    AverageFluencyScore = Math.Round(averageFluency, 1),
                    AverageCompletenessScore = Math.Round(averageCompleteness, 1),
                    LastPracticeDate = lastPracticeDate,
                    Status = status,
                    Message = message,
                    Grade = grade
                };

                response.Success = true;
                response.Data = summary;
                response.Message = "Lấy tổng hợp kết quả thành công";

                _logger.LogInformation("Retrieved module pronunciation summary for module {ModuleId}, user {UserId}",
                    moduleId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting module pronunciation summary");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error: {ex.Message}";
            }

            return response;
        }

        private static string GenerateFeedback(AzureSpeechAssessmentResult result)
        {
            var feedback = new List<string>();

            // Overall assessment
            if (result.PronunciationScore >= 90)
                feedback.Add("🌟 Excellent pronunciation! Keep it up!");
            else if (result.PronunciationScore >= 75)
                feedback.Add("✅ Good job! You're doing well.");
            else if (result.PronunciationScore >= 60)
                feedback.Add("📚 Not bad, but there's room for improvement.");
            else
                feedback.Add("💪 Keep practicing! You'll get better.");

            // Specific feedback
            if (result.AccuracyScore < 70)
                feedback.Add($"⚠️ Focus on accuracy (current: {result.AccuracyScore:F1}%). Practice the correct pronunciation.");

            if (result.FluencyScore < 70)
                feedback.Add($"🗣️ Work on fluency (current: {result.FluencyScore:F1}%). Try speaking more naturally.");

            if (result.CompletenessScore < 90)
                feedback.Add($"📝 Completeness needs work (current: {result.CompletenessScore:F1}%). Make sure to pronounce the full word.");

            // Problem phonemes
            if (result.ProblemPhonemes.Count != 0)
            {
                var phonemeList = string.Join(", ", result.ProblemPhonemes.Take(3));
                feedback.Add($"🎯 Focus on these sounds: {phonemeList}");
            }

            return string.Join(" ", feedback);
        }
    }
}
