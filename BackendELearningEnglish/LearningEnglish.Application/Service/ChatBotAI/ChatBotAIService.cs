using System.Text;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.ChatBotAI;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;

namespace LearningEnglish.Application.Service;

public class ChatBotAIService : IChatBotAIService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly ICourseEmbeddingRepository _courseEmbeddingRepository;
    private readonly ITeacherPackageEmbeddingRepository _teacherPackageEmbeddingRepository;
    private readonly ISemanticChatService _semanticChatService;

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
        ISemanticChatService semanticChatService)
    {
        _embeddingService = embeddingService;
        _courseEmbeddingRepository = courseEmbeddingRepository;
        _teacherPackageEmbeddingRepository = teacherPackageEmbeddingRepository;
        _semanticChatService = semanticChatService;
    }

    public async Task<ServiceResponse<ChatBotConsultResponseDto>> GetChatBotResponseAsync(ChatBotConsultRequestDto request)
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
            var answer = await _semanticChatService.GetChatCompletionAsync(SystemPrompt, userPromptWithContext);

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
            return new ServiceResponse<ChatBotConsultResponseDto>
            {
                Success = false,
                StatusCode = 500,
                Message = $"Failed to consult chatbot: {ex.Message}",
                Data = null
            };
        }
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
