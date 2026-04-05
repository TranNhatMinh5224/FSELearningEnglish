namespace LearningEnglish.Application.DTOs.ChatBotAI;

public class TeacherPackageRecommendationDto
{
    public int TeacherPackageId { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMonths { get; set; }
    public int MaxCourses { get; set; }
    public int MaxLessons { get; set; }
    public int MaxStudents { get; set; }
    public double SimilarityScore { get; set; }
}
