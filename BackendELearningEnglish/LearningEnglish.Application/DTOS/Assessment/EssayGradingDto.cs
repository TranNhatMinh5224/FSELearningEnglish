namespace LearningEnglish.Application.DTOs;
public class EssayGradingResultDto
{
    public int SubmissionId { get; set; }
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime GradedAt { get; set; }
    public bool GradedByTeacher { get; set; }
}

public class TeacherGradingDto
{
    public decimal Score { get; set; }
    public string? Feedback { get; set; }
}

// DTO for batch grading result (Teacher batch grade all submissions)
public class BatchGradingResultDto
{
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int FailCount { get; set; }
    public List<GradingResult> Results { get; set; } = new();
}

public class GradingResult
{
    public int SubmissionId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal? Score { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
}

// DTO for essay statistics (Teacher view)
public class EssayStatisticsDto
{
    public int EssayId { get; set; }
    public int TotalSubmissions { get; set; }
    public int Pending { get; set; }
    public int GradedByTeacher { get; set; }
    public int NoTextContent { get; set; }
}
