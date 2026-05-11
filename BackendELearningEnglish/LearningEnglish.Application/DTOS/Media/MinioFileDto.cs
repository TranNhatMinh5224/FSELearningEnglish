namespace LearningEnglish.Application.DTOs
{
    public class ResultUploadDto
    {
        public string TempKey { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string ImageType { get; set; } = string.Empty;
    }

    /// <summary>
    /// Kết quả trả về khi commit file từ temp → real folder trong MinIO.
    /// ContentType được đọc trực tiếp từ MinIO object metadata — không phụ thuộc vào giá trị frontend gửi lên.
    /// </summary>
    public class CommitFileResultDto
    {
        public string RealKey { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
    }
}
