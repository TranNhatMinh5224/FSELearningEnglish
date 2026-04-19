using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Common;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.AI;
using LearningEnglish.Domain.Entities;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text;

namespace LearningEnglish.Infrastructure.Services.AI;

public class AiChatService : IAiChatService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IEmbeddingService _embeddingService;
    private readonly ICourseKnowledgeRepository _courseKnowledgeRepository;
    private readonly ITeacherPackageKnowledgeRepository _packageKnowledgeRepository;
    private readonly IPolicyKnowledgeRepository _policyKnowledgeRepository;

    public AiChatService(
        IChatCompletionService chatCompletionService,
        IEmbeddingService embeddingService,
        ICourseKnowledgeRepository courseKnowledgeRepository,
        ITeacherPackageKnowledgeRepository packageKnowledgeRepository,
        IPolicyKnowledgeRepository policyKnowledgeRepository)
    {
        _chatCompletionService = chatCompletionService;
        _embeddingService = embeddingService;
        _courseKnowledgeRepository = courseKnowledgeRepository;
        _packageKnowledgeRepository = packageKnowledgeRepository;
        _policyKnowledgeRepository = policyKnowledgeRepository;
    }

    public async Task<ServiceResponse<ChatResponseDto>> GetChatResponseAsync(int userId, ChatRequestDto request)
    {
        var response = new ServiceResponse<ChatResponseDto>();
        try
        {
            // 1. Tạo embedding cho câu hỏi của người dùng
            var queryVector = await _embeddingService.GenerateEmbeddingAsync(request.Message);

            // 2. Retrieval: Tìm kiếm kiến thức liên quan từ 3 nguồn tri thức
            var courseContexts = await _courseKnowledgeRepository.SearchSimilarAsync(queryVector, 3);
            var packageContexts = await _packageKnowledgeRepository.SearchSimilarAsync(queryVector, 2);
            var policyContexts = await _policyKnowledgeRepository.SearchSimilarAsync(queryVector, 2);

            // 3. Tổng hợp Context
            var contextBuilder = new StringBuilder();
            foreach (var ctx in courseContexts) contextBuilder.AppendLine(ctx.MarkdownContent);
            foreach (var ctx in packageContexts) contextBuilder.AppendLine(ctx.MarkdownContent);
            foreach (var ctx in policyContexts) contextBuilder.AppendLine(ctx.MarkdownContent);

            var context = contextBuilder.ToString();

            // 4. Xây dựng Prompt Chat
            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(@"Bạn là trợ lý ảo thông minh của nền tảng học tiếng Anh FSE (FullStack English).
Nhiệm vụ của bạn là hỗ trợ học sinh và giáo viên giải đáp các thắc mắc về khóa học, chính sách và gói dịch vụ dựa trên thông tin Wiki được cung cấp dưới đây.

HƯỚNG DẪN:
1. Chỉ trả lời dựa trên thông tin trong phần 'DỮ LIỆU TRI THỨC' bên dưới.
2. Nếu không tìm thấy thông tin trong dữ liệu, hãy trả lời lịch sự rằng bạn chưa có thông tin cụ thể về vấn đề này và khuyên người dùng liên hệ CSKH.
3. Câu trả lời cần thân thiện, chuyên nghiệp. 
4. Trả lời bằng ngôn ngữ mà người dùng sử dụng (mặc định là tiếng Việt). Hiểu và xử lý tốt các từ viết tắt, lỗi gõ phím hoặc từ lóng tiếng Việt cơ bản (VD: ""dâu"" hiểu là ""đâu"", ""k"" hiểu là ""không"", ""r"" hiểu là ""rồi"").

DỮ LIỆU TRI THỨC:
" + context);

            chatHistory.AddUserMessage(request.Message);

            // 5. Gọi AI Generation - Handle null result defensive
            var executionSettings = new PromptExecutionSettings
            {
                ExtensionData = new Dictionary<string, object>
                {
                    { "max_tokens", 800 },
                    { "maxOutputTokens", 800 },
                    { "MaxTokens", 800 },
                    { "temperature", 0.7 }
                }
            };

            var result = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, executionSettings);
            
            response.Data = new ChatResponseDto
            {
                Response = result?.Content ?? "Chào bạn, tôi có thể giúp gì cho bạn về khóa học FSE?",
                SentAt = DateTime.UtcNow
            };
            response.Success = true;
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = "Có lỗi xảy ra khi xử lý câu hỏi: " + ex.Message;
        }

        return response;
    }
}
