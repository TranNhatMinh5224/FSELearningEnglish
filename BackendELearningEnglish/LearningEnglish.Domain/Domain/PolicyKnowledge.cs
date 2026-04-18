using Pgvector;

namespace LearningEnglish.Domain.Entities
{
    public class PolicyKnowledge
    {
        public int Id { get; set; }
        public int PolicyId { get; set; }
        
        public string MarkdownContent { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        
        public Pgvector.Vector Embedding { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property (1-1)
        public Policy Policy { get; set; } = null!;
    }
}
