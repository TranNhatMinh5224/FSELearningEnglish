namespace LearningEnglish.Application.Cofigurations;

public sealed class CacheOptions
{
    /// <summary>
    /// Global switch to enable/disable application-level cache.
    /// When disabled, GetOrSetAsync will always execute the factory and won't store results.
    /// </summary>
    public bool Enabled { get; set; } = true;
}
