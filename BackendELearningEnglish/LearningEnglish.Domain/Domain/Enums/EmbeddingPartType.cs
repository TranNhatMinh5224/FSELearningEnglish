namespace LearningEnglish.Domain.Enums
{
    public enum EmbeddingPartType
    {
        FullContent = 0,    // Toàn bộ nội dung
        Title = 1,          // Chỉ tiêu đề (để search nhanh)
        Description = 2,    // Chỉ phần mô tả
        LessonChunk = 3,    // Từng đoạn nhỏ (cho RAG trong khóa học)
        Other = 99
    }
}
