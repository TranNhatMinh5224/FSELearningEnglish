using System.ComponentModel.DataAnnotations;

namespace LearningEnglish.Application.DTOs
{
    public class QuizGroupDto
    {
        public int QuizGroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int QuizSectionId { get; set; }
        public string Title { get; set; } = string.Empty;
        
        // Multi-media URLs for Response
        public string? ImgUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? AudioUrl { get; set; }

        public string? ImgType { get; set; }
        public string? VideoType { get; set; }
        public string? AudioType { get; set; }
        public int? VideoDuration { get; set; }

        public decimal SumScore { get; set; }
        public int DisplayOrder { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation Properties
        [System.Text.Json.Serialization.JsonIgnore]
        public QuizSectionDto? QuizSection { get; set; }
        public List<QuestionReadDto> Questions { get; set; } = new();
    }

    public class CreateQuizGroupDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required]
        public int QuizSectionId { get; set; }
        public string Title { get; set; } = string.Empty;

        public decimal SumScore { get; set; }
        public int DisplayOrder { get; set; } = 0;

        // Multi-media TempKeys for Request
        public string? ImgTempKey { get; set; }
        public string? ImgType { get; set; }

        public string? VideoTempKey { get; set; }
        public string? VideoType { get; set; }

        public string? AudioTempKey { get; set; }
        public string? AudioType { get; set; }
        public int? VideoDuration { get; set; }
    }

    public class UpdateQuizGroupDto : CreateQuizGroupDto
    {
        // Inherits everything from CreateQuizGroupDto
    }

    public class ListQuizGroupDto
    {
        public int QuizGroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Title { get; set; } = string.Empty;
        
        public string? ImgUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? AudioUrl { get; set; }

        public string? ImgType { get; set; }
        public string? VideoType { get; set; }
        public string? AudioType { get; set; }
        
        public int DisplayOrder { get; set; }
        public int? VideoDuration { get; set; }

        public decimal SumScore { get; set; }
        public int QuestionCount { get; set; }
    }
}
