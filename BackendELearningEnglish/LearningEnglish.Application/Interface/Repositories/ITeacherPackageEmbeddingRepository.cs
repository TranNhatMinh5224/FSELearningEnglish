using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Application.DTOs.ChatBotAI;
namespace LearningEnglish.Application.Interface
{
    public interface ITeacherPackageEmbeddingRepository
    {
      
        //Lấy toàn bộ embedding của một teacher package (nhiều part/chunk nếu có).
   
        Task<IReadOnlyList<TeacherPackageEmbedding>> GetByTeacherPackageIdAsync(
            int teacherPackageId,
            CancellationToken cancellationToken = default);

   
        // Lấy embedding theo teacher package và loại nội dung (PartType).
     
        Task<TeacherPackageEmbedding?> GetByTeacherPackageAndPartTypeAsync(
            int teacherPackageId,
            EmbeddingPartType partType,
            CancellationToken cancellationToken = default);

   
        // Kiểm tra đã tồn tại embedding theo content hash chưa.
        //Dùng để skip re-embed khi dữ liệu không đổi.
      
        Task<bool> ExistsByContentHashAsync(
            int teacherPackageId,
            EmbeddingPartType partType,
            string contentHash,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Tạo mới hoặc cập nhật embedding (upsert) cho teacher package.
        /// </summary>
        Task<TeacherPackageEmbedding> UpsertAsync(
            TeacherPackageEmbedding teacherPackageEmbedding,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Xóa toàn bộ embedding của một teacher package.
        /// Trả về số bản ghi đã xóa.
        /// </summary>
        Task<int> DeleteByTeacherPackageIdAsync(int teacherPackageId, CancellationToken cancellationToken = default);

        // Retrieval top-k teacher package theo embedding truy vấn.
        Task<IReadOnlyList<TeacherPackageRecommendationDto>> SearchTopKTeacherPackagesAsync(
            float[] queryEmbedding,
            int topK,
            CancellationToken cancellationToken = default);
    }
}