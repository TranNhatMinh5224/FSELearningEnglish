namespace LearningEnglish.Application.Configurations
{
    // Configuration options for Spaced Repetition Algorithm
    // Giá trị mặc định CỰC THẤP để dễ test - sau khi test OK hãy tăng lên trong code này
    public class SpacedRepetitionOptions
    {
        // Khoảng cách ngày tối thiểu để coi như đã thuộc từ
        public int MasteryIntervalDays { get; set; } = 7;

        // Số lần ôn tối thiểu để coi như đã thuộc
        public int MasteryMinimumRepetitions { get; set; } = 3;

        // Khoảng cách ngày để coi như gần thuộc (dùng cho thống kê)
     
        public int NearMasteryIntervalDays { get; set; } = 3;

        // Quality tối thiểu để tính là ôn tập thành công
      
        public int MinimumPassQuality { get; set; } = 3;
    }
}
