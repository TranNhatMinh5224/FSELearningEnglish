using Pgvector;

namespace LearningEnglish.Domain.Entities
{
    public class CourseKnowledge
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        
        public string MarkdownContent { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        
        public Pgvector.Vector Embedding { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 1-1 course 
        public Course Course { get; set; } = null!;
    }
}
