namespace LearningEnglish.Application.DTOs.Admin;

public class AdminPolicyResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AdminCreatePolicyRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
}

public class AdminUpdatePolicyRequestDto
{
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? ContentMarkdown { get; set; }
    public string? Category { get; set; }
}
