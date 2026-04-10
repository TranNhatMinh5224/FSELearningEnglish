using System.Text;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.DTOs.ChatBotAI;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service;

public class ChatBotAIService : IChatBotAIService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly ICourseEmbeddingRepository _courseEmbeddingRepository;
    private readonly ITeacherPackageEmbeddingRepository _teacherPackageEmbeddingRepository;
    private readonly ISemanticChatService _semanticChatService;
    private readonly ILogger<ChatBotAIService> _logger;
    private readonly ICacheService _cache;

    private static readonly TimeSpan ConsultCacheTtl = TimeSpan.FromMinutes(10);
    private const int MaxPromptLength = 1000;

    private const string SystemPrompt = """
        Bạn là trợ lý tư vấn học tiếng Anh của nền tảng Catalunya English (AI Catalunya English).
        Nhiệm vụ của bạn: tư vấn khóa học hệ thống và gói nâng cấp tài khoản Teacher phù hợp với nhu cầu của người học.
        
        Quy tắc bắt buộc:
        - Chỉ được sử dụng thông tin trong phần [CONTEXT] để trả lời. Không được bịa đặt hoặc thêm thông tin bên ngoài.
        - Nếu không tìm thấy thông tin phù hợp trong [CONTEXT], hãy nói thật rằng chưa có khóa học phù hợp.
        - Trả lời bằng tiếng Việt, thân thiện, ngắn gọn và rõ ràng.
        - KHÔNG đề cập đến điểm similarity score hoặc ID kỹ thuật một cách khô khan.
        - LUÔN LUÔN đính kèm link chi tiết cho mỗi sản phẩm bạn gợi ý bằng định dạng Markdown:
            + Đối với Khóa học: [Tên khóa học](/course/{CourseId})
            + Đối với Gói Teacher: [Tên gói](/payment?packageId={TeacherPackageId})
        - Kết thúc bằng một câu hỏi ngắn để hỏi thêm nhu cầu hoặc ngân sách của người dùng nếu cần.
        """;

    public ChatBotAIService(
        IEmbeddingService embeddingService,
        ICourseEmbeddingRepository courseEmbeddingRepository,
        ITeacherPackageEmbeddingRepository teacherPackageEmbeddingRepository,
        ISemanticChatService semanticChatService,
        ILogger<ChatBotAIService> logger,
        ICacheService cache)
    {
        _embeddingService = embeddingService;
        _courseEmbeddingRepository = courseEmbeddingRepository;
        _teacherPackageEmbeddingRepository = teacherPackageEmbeddingRepository;
        _semanticChatService = semanticChatService;
        _logger = logger;
        _cache = cache;
    }

    public async Task<ServiceResponse<ChatBotConsultResponseDto>> GetChatBotResponseAsync(ChatBotConsultRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var prompt = request?.Prompt;
            if (string.IsNullOrWhiteSpace(prompt))
            {
                return new ServiceResponse<ChatBotConsultResponseDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Prompt is required.",
                    Data = null
                };
            }

            // Defense-in-depth (validator already enforces this in most cases)
            if (prompt.Length > MaxPromptLength)
            {
                return new ServiceResponse<ChatBotConsultResponseDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"Prompt must not exceed {MaxPromptLength} characters.",
                    Data = null
                };
            }

            var promptHash = ComputePromptHash(prompt);
            var cacheKey = CacheKeys.ChatBotConsult(promptHash);

            async Task<string> GenerateAnswerAsync()
            {
                // Step 1: Vectorize the user query
                var queryEmbedding = await _embeddingService.CreateEmbeddingAsync(prompt);

                // Step 2: ANN search — only System + Published courses and all teacher packages
                var topCourses = await _courseEmbeddingRepository.SearchTopKSystemCoursesAsync(queryEmbedding, topK: 5);
                var topTeacherPackages = await _teacherPackageEmbeddingRepository.SearchTopKTeacherPackagesAsync(queryEmbedding, topK: 3);

                // Step 3: Build RAG context
                var context = BuildRagContext(topCourses, topTeacherPackages);

                // Step 4: Compose user prompt with context
                var userPromptWithContext = $"""
                    {context}
                    
                    Câu hỏi của học viên: {prompt}
                    """;

                // Step 5: Call LLM via Semantic Kernel
                // If AI provider is temporarily unavailable, return a deterministic consult answer
                // based on retrieved courses/packages so the UI doesn't show a connection error.
                try
                {
                    var aiAnswer = await _semanticChatService.GetChatCompletionAsync(
                        SystemPrompt,
                        userPromptWithContext,
                        cancellationToken);

                    if (!string.IsNullOrWhiteSpace(aiAnswer))
                        return aiAnswer;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Semantic chat service failed; falling back to deterministic answer");
                }

                return BuildDeterministicAnswer(topCourses, topTeacherPackages);
            }

            // Avoid caching prompts that look like they may contain personal identifiers.
            var answer = ShouldCachePrompt(prompt)
                ? await _cache.GetOrSetAsync(cacheKey, GenerateAnswerAsync, ConsultCacheTtl)
                : await GenerateAnswerAsync();

            answer ??= string.Empty;

            return new ServiceResponse<ChatBotConsultResponseDto>
            {
                Success = true,
                StatusCode = 200,
                Message = "Chatbot consulted successfully.",
                Data = new ChatBotConsultResponseDto
                {
                    Answer = answer
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chatbot consult failed");
            // Keep endpoint stable (HTTP 200) to avoid frontend showing a generic "cannot connect" error.
            // Return a friendly response that still guides the user.
            return new ServiceResponse<ChatBotConsultResponseDto>
            {
                Success = true,
                StatusCode = 200,
                Message = "Chatbot responded with fallback.",
                Data = new ChatBotConsultResponseDto
                {
                    Answer = "Mình chưa xử lý được câu hỏi vừa rồi. Bạn có thể mô tả rõ mục tiêu (giao tiếp/IELTS/TOEIC), trình độ hiện tại và ngân sách dự kiến để mình gợi ý phù hợp hơn nhé."
                }
            };
        }
    }

    private static string BuildDeterministicAnswer(
        IReadOnlyList<CourseRecommendationDto> courses,
        IReadOnlyList<TeacherPackageRecommendationDto> packages)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Mình gợi ý nhanh một vài lựa chọn phù hợp dựa trên dữ liệu hiện có:");

        if (courses.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("**📚 Khóa học hệ thống**");
            foreach (var c in courses.Take(3))
            {
                sb.AppendLine($"- [{c.Title}](/course/{c.CourseId}) — Giá: {(c.Price ?? 0):N0} VNĐ");
            }
        }
        else
        {
            sb.AppendLine();
            sb.AppendLine("Hiện mình chưa tìm thấy khóa học hệ thống phù hợp trong dữ liệu.");
        }

        if (packages.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("**👨‍🏫 Gói nâng cấp Teacher**");
            foreach (var p in packages.Take(2))
            {
                sb.AppendLine($"- [{p.PackageName}](/payment?packageId={p.TeacherPackageId}) — {p.DurationMonths} tháng — {p.Price:N0} VNĐ");
            }
        }

        sb.AppendLine();
        sb.Append("Bạn đang muốn học theo mục tiêu nào (giao tiếp/IELTS/TOEIC), và trình độ hiện tại ra sao?");
        return sb.ToString();
    }

    private static string ComputePromptHash(string prompt)
    {
        var normalized = Regex.Replace(prompt.Trim(), "\\s+", " ");
        var bytes = Encoding.UTF8.GetBytes(normalized);
        return Convert.ToHexString(SHA256.HashData(bytes));
    }

    private static bool ShouldCachePrompt(string prompt)
    {
        // Very lightweight heuristic to reduce the risk of caching prompts containing personal identifiers.
        // Chatbot is meant for public course/package consults, so skipping cache for these cases is acceptable.
        if (prompt.Contains('@')) return false; // likely email
        if (Regex.IsMatch(prompt, "\\b\\d{9,}\\b")) return false; // likely phone / id / long numbers
        return true;
    }

    private static string BuildRagContext(
        IReadOnlyList<CourseRecommendationDto> courses,
        IReadOnlyList<TeacherPackageRecommendationDto> packages)
    {
        var sb = new StringBuilder();
        sb.AppendLine("[CONTEXT]");

        if (courses.Count > 0)
        {
            sb.AppendLine("📚 Khóa học hệ thống phù hợp:");
            foreach (var c in courses)
            {
                sb.AppendLine($"- ID: {c.CourseId} | Tên: \"{c.Title}\" | Giá: {(c.Price ?? 0):N0} VNĐ | Mô tả: {TruncateDescription(c.Description, 120)}");
            }
        }
        else
        {
            sb.AppendLine("📚 Không tìm thấy khóa học hệ thống phù hợp.");
        }

        sb.AppendLine();

        if (packages.Count > 0)
        {
            sb.AppendLine("👨‍🏫 Gói nâng cấp tài khoản Teacher phù hợp:");
            foreach (var p in packages)
            {
                sb.AppendLine($"- ID: {p.TeacherPackageId} | Tên: \"{p.PackageName}\" | Cấp độ: {p.Level} | Giá: {p.Price:N0} VNĐ | Thời hạn: {p.DurationMonths} tháng | Tối đa {p.MaxCourses} khóa / {p.MaxStudents} học viên");
            }
        }
        else
        {
            sb.AppendLine("👨‍🏫 Không tìm thấy gói Teacher phù hợp.");
        }

        sb.AppendLine("[END CONTEXT]");
        return sb.ToString();
    }

    private static string TruncateDescription(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text)) return "(chưa có mô tả)";
        return text.Length <= maxLength ? text : text[..maxLength] + "...";
    }
}
