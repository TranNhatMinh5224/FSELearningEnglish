namespace LearningEnglish.Application.Configurations;

public sealed class CorsOptions
{
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}
