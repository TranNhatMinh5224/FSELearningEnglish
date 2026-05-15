using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Interface.Services;
using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Service;

/// <summary>
/// Implementation của IQuizAttemptMapper
/// Tuân thủ Clean Architecture + SOLID:
/// - Dependency Inversion: Inject IQuestionMediaService, IQuizGroupMediaService
/// - Single Responsibility: Chỉ map Quiz entities sang DTOs
/// - KHÔNG có bucket names, BuildPublicUrl - delegate cho MediaServices
/// </summary>
public class QuizAttemptMapperService : IQuizAttemptMapper
{
    private readonly IQuestionMediaService _questionMediaService;
    private readonly IQuizGroupMediaService _quizGroupMediaService;

    public QuizAttemptMapperService(
        IQuestionMediaService questionMediaService,
        IQuizGroupMediaService quizGroupMediaService)
    {
        _questionMediaService = questionMediaService;
        _quizGroupMediaService = quizGroupMediaService;
    }

  
    public List<AttemptQuizSectionDto> ShuffleQuizForAttempt(Quiz quiz, int attemptId)
    {
        var sections = new List<AttemptQuizSectionDto>();

        foreach (var section in quiz.QuizSections)
        {
            var sectionDto = new AttemptQuizSectionDto
            {
                SectionId = section.QuizSectionId,
                QuizId = section.QuizId,  // ID quiz
                Title = section.Title,
                Description = section.Description,  // Mô tả section
                DisplayOrder = 0, 
                Items = new List<QuizItemDto>()
            };

            // 1. Map groups sang QuizItemDto
            var groupItems = section.QuizGroups.Select(g => 
            {
                var dto = new QuizItemDto
                {
                    ItemType = "Group",
                    ItemIndex = g.DisplayOrder,
                    
                    // Group properties
                    GroupId = g.QuizGroupId,
                    Name = g.Name,
                    Title = g.Title,
                    Description = g.Description,
                    
                    ImgUrl = _quizGroupMediaService.BuildImageUrl(g.ImgKey),
                    VideoUrl = _quizGroupMediaService.BuildVideoUrl(g.VideoKey),
                    AudioUrl = _quizGroupMediaService.BuildAudioUrl(g.AudioKey),
                    
                    // Fallback types if keys exist but types are missing
                    ImgType = !string.IsNullOrWhiteSpace(g.ImgKey) ? (g.ImgType ?? "image/jpeg") : null,
                    VideoType = !string.IsNullOrWhiteSpace(g.VideoKey) ? (g.VideoType ?? "video/mp4") : null,
                    AudioType = !string.IsNullOrWhiteSpace(g.AudioKey) ? (g.AudioType ?? "audio/mpeg") : null,
                    
                    VideoDuration = g.VideoDuration,
                    SumScore = g.SumScore,
                    Questions = g.Questions
                        .DistinctBy(q => q.QuestionId)
                        .Select(q => MapToQuestionDto(q, attemptId, quiz.ShuffleAnswers.GetValueOrDefault(false)))
                        .ToList()
                };
                return dto;
            }).ToList();

            // 2. Map standalone questions sang QuizItemDto
            var standaloneQuestionItems = section.Questions
                .Where(q => q.QuizGroupId == null)
                .DistinctBy(q => q.QuestionId)
                .Select(q => MapToStandaloneQuestionItemDto(q, attemptId, quiz.ShuffleAnswers.GetValueOrDefault(false)))
                .ToList();

            // 3. Merge groups + questions vào cùng list
            var allItems = new List<QuizItemDto>();
            allItems.AddRange(groupItems);
            allItems.AddRange(standaloneQuestionItems);

            // 4. Shuffle hoặc Sort theo ItemIndex
            if (quiz.ShuffleQuestions == true)
            {
                // Sử dụng seed kết hợp attemptId và sectionId để đảm bảo mỗi lần làm bài có thứ tự khác nhau nhưng nhất quán trong phiên đó
                var seed = attemptId * 1000 + section.QuizSectionId;
                var random = new Random(seed);
                QuizShuffleHelper.FisherYatesShuffle(allItems, random);
                sectionDto.Items = allItems;
            }
            else
            {
                // Sort theo ItemIndex để xen kẽ Groups và Questions theo mặc định
                sectionDto.Items = allItems.OrderBy(i => i.ItemIndex).ToList();
            }

            sections.Add(sectionDto);
        }

        return sections;
    }

   
    public QuestionDto MapToQuestionDto(Question q, int attemptId, bool shuffleAnswers)
    {
        var dto = new QuestionDto
        {
            QuestionId = q.QuestionId,
            QuestionText = q.StemText,
            Type = q.Type,
            Points = q.Points,
            DisplayOrder = q.DisplayOrder,
            IsAnswered = false,
            CurrentScore = null,
            MetadataJson = q.MetadataJson,
            CorrectAnswersJson = q.CorrectAnswersJson,
            Options = MapToOptionDtos(q, attemptId, shuffleAnswers)
        };

        FillMediaProperties(q, dto);
        return dto;
    }

    public QuizItemDto MapToStandaloneQuestionItemDto(Question q, int attemptId, bool shuffleAnswers)
    {
        var dto = new QuizItemDto
        {
            ItemType = "Question",
            ItemIndex = q.DisplayOrder,
            QuestionId = q.QuestionId,
            QuestionText = q.StemText,
            Type = q.Type,
            Points = q.Points,
            IsAnswered = false,
            MetadataJson = q.MetadataJson,
            CorrectAnswersJson = q.CorrectAnswersJson,
            Options = MapToOptionDtos(q, attemptId, shuffleAnswers)
        };

        FillMediaProperties(q, dto);
        return dto;
    }

    /// <summary>
    /// Helper method to fill media properties for question DTOs.
    /// Handles fallback for missing MediaType when MediaKey is present.
    /// </summary>
    private void FillMediaProperties(Question q, dynamic dto)
    {
        string? mKey = !string.IsNullOrWhiteSpace(q.MediaKey) ? q.MediaKey : null;
        string? mediaUrl = _questionMediaService.BuildMediaUrl(mKey);

        dto.MediaUrl = mediaUrl;
        dto.MediaType = q.MediaType;

        bool isImage = (q.MediaType != null && q.MediaType.StartsWith("image")) || (q.MediaType == null && mKey != null);
        bool isVideo = q.MediaType != null && q.MediaType.StartsWith("video");
        bool isAudio = q.MediaType != null && q.MediaType.StartsWith("audio");

        dto.ImgUrl = isImage ? mediaUrl : null;
        dto.VideoUrl = isVideo ? mediaUrl : null;
        dto.AudioUrl = isAudio ? mediaUrl : null;

        dto.ImgType = isImage ? (q.MediaType ?? "image/jpeg") : null;
        dto.VideoType = isVideo ? q.MediaType : null;
        dto.AudioType = isAudio ? q.MediaType : null;
    }

  
    public List<AnswerOptionDto> MapToOptionDtos(Question question, int attemptId, bool shuffleAnswers)
    {
        var options = question.Options.Select(o => new AnswerOptionDto
        {
            OptionId = o.AnswerOptionId,
            OptionText = o.Text ?? string.Empty,
            // Sử dụng MediaService
            MediaUrl = _questionMediaService.BuildMediaUrl(o.MediaKey),
            MediaType = o.MediaType  // Loại media (image/png, audio/mpeg)
        }).ToList();

        // Shuffle options nếu bật và question type phù hợp
        if (shuffleAnswers && QuizShuffleHelper.ShouldShuffleAnswers(question.Type))
        {
            QuizShuffleHelper.ShuffleAnswers(options, attemptId, question.QuestionId);
        }

        return options;
    }
}
