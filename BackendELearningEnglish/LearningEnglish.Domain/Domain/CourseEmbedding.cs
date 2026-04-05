using LearningEnglish.Domain.Enums;

namespace LearningEnglish.Domain.Entities
{
    public class CourseEmbedding
    {
        public int CourseEmbeddingId { get; set; }
        public int CourseId { get; set; } // Foreign key to Course
        public string  Title { get; set; } = string.Empty;
        public DateTime? LastUpdatedEmbeddingAt { get; set; } // Thời điểm cập nhật embedding vector gần nhất

        public string EmbeddingModel { get; set; } = string.Empty;
        public int EmbeddingDimension { get; set; } // e.g., 512, 768, etc.
        public EmbeddingPartType PartType { get; set; } = EmbeddingPartType.FullContent;
        public string ContentHash { get; set; } = string.Empty; // Hash của nội dung để kiểm tra sự thay đổi

        public float[] EmbeddingVector { get; set; } = Array.Empty<float>();
        
        // Navigation Properties
        public Course? Course { get; set; }
    }
}
