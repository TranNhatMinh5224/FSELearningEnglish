using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Application.DTOs.ChatBotAI;

namespace LearningEnglish.Application.Interface;

public interface ICourseEmbeddingRepository
{
   
    // Lấy toàn bộ embedding của một course (có thể gồm nhiều part/chunk).
   
    Task<IReadOnlyList<CourseEmbedding>> GetByCourseIdAsync(int courseId, CancellationToken cancellationToken = default);


    // Lấy embedding theo course và loại nội dung (PartType).
    // Dùng khi chỉ cần một embedding đại diện cho một phần cụ thể.

    Task<CourseEmbedding?> GetByCourseAndPartTypeAsync(
        int courseId,
        EmbeddingPartType partType,
        CancellationToken cancellationToken = default);

 
    // Kiểm tra embedding đã tồn tại theo content hash chưa.
    // Dùng để tránh re-embed khi nội dung không thay đổi.

    Task<bool> ExistsByContentHashAsync(
        int courseId,
        EmbeddingPartType partType,
        string contentHash,
        CancellationToken cancellationToken = default);

  
    //Tạo mới hoặc cập nhật embedding (upsert).
    // Đây là operation chính khi admin thêm/sửa course.
    
    Task<CourseEmbedding> UpsertAsync(CourseEmbedding courseEmbedding, CancellationToken cancellationToken = default);


    // Xóa toàn bộ embedding thuộc một course.
    // Trả về số bản ghi đã xóa.
       Task<int> DeleteByCourseIdAsync(int courseId, CancellationToken cancellationToken = default);

    // Retrieval top-k khóa học hệ thống theo embedding truy vấn.
    Task<IReadOnlyList<CourseRecommendationDto>> SearchTopKSystemCoursesAsync(
        float[] queryEmbedding,
        int topK,
        CancellationToken cancellationToken = default);
}
