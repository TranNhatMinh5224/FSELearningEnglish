using LearningEnglish.Application.Interface;

namespace LearningEnglish.Infrastructure.Services
{
    public class EmailTemplateService : IEmailTemplateService
    {
        private readonly ITemplatePathResolver _pathResolver;

        public EmailTemplateService(ITemplatePathResolver pathResolver)
        {
            _pathResolver = pathResolver;
        }

        public string GenerateOTPEmailTemplate(string otpCode, string userName)
        {
            var templatePath = _pathResolver.GetTemplatePath("OTPEmail.html");

            if (!_pathResolver.TemplateExists("OTPEmail.html"))
            {
                throw new FileNotFoundException($"Email template not found: {templatePath}");
            }

            var template = File.ReadAllText(templatePath);

            // Replace placeholders
            return template
                .Replace("{{OTPCode}}", otpCode)
                .Replace("{{UserName}}", userName);
        }

        public string GenerateWelcomeEmailTemplate(string userName)
        {
            var templatePath = _pathResolver.GetTemplatePath("WelcomeEmail.html");
            var htmlTemplate = File.ReadAllText(templatePath);

            return htmlTemplate
                .Replace("{{UserName}}", userName)
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }

        public string GeneratePasswordChangedEmailTemplate(string userName)
        {
            var templatePath = _pathResolver.GetTemplatePath("PasswordChangedEmail.html");
            var htmlTemplate = File.ReadAllText(templatePath);

            return htmlTemplate
                .Replace("{{UserName}}", userName)
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }
        public string GenerateNotifyJoinCourseTemplate(string courseName, string userName)
        {
            var templatePath = _pathResolver.GetTemplatePath("CoursePurchaseConfirmation.html");
            var htmlTemplate = File.ReadAllText(templatePath);

            return htmlTemplate
                .Replace("{{USER_NAME}}", userName)
                .Replace("{{COURSE_NAME}}", courseName)
                .Replace("{{PURCHASE_DATE}}", DateTime.UtcNow.ToString("dd/MM/yyyy"))
                .Replace("{{COURSE_URL}}", $"https://learning-eng.hocnghiepvu.com/courses/{courseName.Replace(" ", "-").ToLower()}")
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }

        public string GenerateTeacherPackagePurchaseTemplate(string packageName, string userName, decimal price, DateTime validUntil)
        {
            var templatePath = _pathResolver.GetTemplatePath("TeacherPackagePurchase.html");
            var htmlTemplate = File.ReadAllText(templatePath);

            return htmlTemplate
                .Replace("{{USER_NAME}}", userName)
                .Replace("{{PACKAGE_NAME}}", packageName)
                .Replace("{{PRICE}}", price.ToString("F2"))
                .Replace("{{PURCHASE_DATE}}", DateTime.UtcNow.ToString("dd/MM/yyyy"))
                .Replace("{{VALID_UNTIL}}", validUntil.ToString("dd/MM/yyyy"))
                .Replace("{{TEACHER_DASHBOARD_URL}}", "https://learning-eng.hocnghiepvu.com/teacher/dashboard")
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }

        public string GenerateVocabularyReminderTemplate(string studentName, int dueCount)
        {
            var templatePath = _pathResolver.GetTemplatePath("VocabularyReminder.html");

            if (!_pathResolver.TemplateExists("VocabularyReminder.html"))
            {
                throw new FileNotFoundException($"Email template not found: {templatePath}");
            }

            var htmlTemplate = File.ReadAllText(templatePath);

            // Tạo nội dung động dựa vào số lượng từ vựng
            var content = dueCount switch
            {
                1 => "You have 1 vocabulary word to review today. Spaced Repetition helps you remember longer!",
                <= 5 => $"Today you have {dueCount} vocabulary words to review. This is the best time to consolidate knowledge scientifically!",
                <= 10 => $"You have {dueCount} vocabulary words to review. The Spaced Repetition System has calculated the optimal time for memorization!",
                _ => $"Today you have {dueCount} vocabulary words to review. Don't miss this opportunity to improve your English!"
            };

            return htmlTemplate
                .Replace("{{StudentName}}", studentName)
                .Replace("{{DueCount}}", dueCount.ToString())
                .Replace("{{Content}}", content)
                .Replace("{{ReviewUrl}}", "https://learning-eng.hocnghiepvu.com/flashcards/review")
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }

        public string GenerateStreakReminderTemplate(string userName, int currentStreak, int longestStreak)
        {
            var templatePath = _pathResolver.GetTemplatePath("StreakReminder.html");
            var htmlTemplate = File.ReadAllText(templatePath);

            var isNewRecord = currentStreak >= longestStreak;
            
            var motivationMessage = currentStreak switch
            {
                >= 30 => $"🏆 Bạn đã giữ streak {currentStreak} ngày! Đây là một thành tích tuyệt vời. Đừng để nỗ lực này mất phí!",
                >= 14 => $"🔥 Streak {currentStreak} ngày của bạn đang rất ấn tượng! Chỉ cần vài phút học hôm nay để tiếp tục!",
                >= 7 => $"⭐ {currentStreak} ngày liên tiếp! Bạn đang xây dựng thói quen học tập tuyệt vời. Hãy tiếp tục!",
                _ => $"💪 Streak {currentStreak} ngày của bạn đang trong nguy hiểm! Hãy dành ít phút học hôm nay."
            };

            return htmlTemplate
                .Replace("{{userName}}", userName)
                .Replace("{{currentStreak}}", currentStreak.ToString())
                .Replace("{{longestStreak}}", longestStreak.ToString())
                .Replace("{{motivationMessage}}", motivationMessage)
                .Replace("{{HOME_URL}}", "https://learning-eng.hocnghiepvu.com/home")
                .Replace("{{CURRENT_YEAR}}", DateTime.UtcNow.Year.ToString());
        }
    }
}
