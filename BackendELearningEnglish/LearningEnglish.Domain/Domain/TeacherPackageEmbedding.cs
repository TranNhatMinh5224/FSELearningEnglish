using LearningEnglish.Domain.Enums;

namespace LearningEnglish.Domain.Entities
{
    public class TeacherPackageEmbedding
    {
        public int TeacherPackageEmbeddingId { get; set; }
        public int TeacherPackageId { get; set; } // Foreign key to TeacherPackage
        public string PackageName { get; set; } = string.Empty;
        public DateTime? LastUpdatedEmbeddingAt { get; set; } 
        public string EmbeddingModel { get; set; } = string.Empty;
        public int EmbeddingDimension { get; set; }
        public EmbeddingPartType PartType { get; set; } = EmbeddingPartType.FullContent;
        public string ContentHash { get; set; } = string.Empty;
        public string SourceData { get; set; } = string.Empty; 
        public float[] EmbeddingVector { get; set; } = Array.Empty<float>();
        
        // Navigation Properties
        public TeacherPackage? TeacherPackage { get; set; }
    }
}