using LearningEnglish.Domain.Enums;

namespace LearningEnglish.Domain.Entities;

// Bài nộp của học sinh cho Essay
public class EssaySubmission
{
    public int SubmissionId { get; set; }
    public int EssayId { get; set; }
    public int UserId { get; set; }

    // Nội dung bài làm
    public string? TextContent { get; set; }

    // File đính kèm (PDF, DOCX, etc.)
    public string? AttachmentKey { get; set; }
    public string? AttachmentType { get; set; }

    public DateTime? StartedAt { get; set; }          // Thời điểm bắt đầu (khi bấm Start)
    public DateTime? EndTime { get; set; }            // Thời điểm phải nộp (Deadline cá nhân)
    public DateTime? SubmittedAt { get; set; }        // Thời điểm nộp thực tế

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    // Teacher Grading
    public decimal? TeacherScore { get; set; }       // Điểm từ Teacher
    public string? TeacherFeedback { get; set; }     // Nhận xét từ Teacher
    public int? GradedByTeacherId { get; set; }      // Teacher ID
    public DateTime? TeacherGradedAt { get; set; }   // Thời gian teacher chấm

    // Navigation properties
    public User User { get; set; } = null!;
    public Essay Essay { get; set; } = null!;
    public User? GradedByTeacher { get; set; }       // Teacher đã chấm
}
