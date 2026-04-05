using System.Text.Json.Serialization;

namespace LearningEnglish.Infrastructure.Services.ExternalProviders.Facebook.Models;

internal sealed class FacebookTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

internal sealed class FacebookTokenVerification
{
    [JsonPropertyName("data")]
    public TokenData? Data { get; set; }
}

internal sealed class TokenData
{
    [JsonPropertyName("is_valid")]
    public bool IsValid { get; set; }

    [JsonPropertyName("user_id")]
    public string? UserId { get; set; }
}

internal sealed class FacebookGraphUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("picture")]
    public PictureData? Picture { get; set; }
}

internal sealed class PictureData
{
    [JsonPropertyName("data")]
    public ImageData? Data { get; set; }
}

internal sealed class ImageData
{
    [JsonPropertyName("url")]
    public string? Url { get; set; }
}
