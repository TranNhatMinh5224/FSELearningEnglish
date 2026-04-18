namespace LearningEnglish.Domain.Entities
{
    public class Policy
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        
        // Nội dung chi tiết của chính sách
        public string ContentMarkdown { get; set; } = string.Empty;
        
        public string Category { get; set; } = "General"; // Refund, Privacy, Support, v.v.
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property (1-1)
        public PolicyKnowledge? PolicyKnowledge { get; set; }
    }
}
