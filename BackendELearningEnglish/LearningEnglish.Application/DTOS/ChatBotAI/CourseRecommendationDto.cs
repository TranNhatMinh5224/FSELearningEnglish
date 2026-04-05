namespace LearningEnglish.Application.DTOs.ChatBotAI;

public class CourseRecommendationDto
{
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public double SimilarityScore { get; set; }
}
