using Pgvector;

namespace LearningEnglish.Domain.Entities
{
    public class TeacherPackageKnowledge
    {
        public int Id { get; set; }
        public int TeacherPackageId { get; set; }
        
        public string MarkdownContent { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        
        public Pgvector.Vector Embedding { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 1-1 vs TeacherPackage
        public TeacherPackage TeacherPackage { get; set; } = null!;
    }
}
