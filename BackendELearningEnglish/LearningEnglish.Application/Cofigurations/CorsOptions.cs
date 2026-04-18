namespace LearningEnglish.Application.Cofigurations;

public sealed class CorsOptions
{
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}
