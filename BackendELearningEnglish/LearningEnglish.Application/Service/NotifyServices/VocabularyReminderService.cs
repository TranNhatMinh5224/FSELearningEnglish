using LearningEnglish.Application.Interface;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service;

// Service chuyên biệt CHỈ NHẮC HỌC LẠI TỪ VỰNG qua App + Email
// Mục đích duy nhất: Nhắc user ôn tập từ vựng đã học theo lịch trình SRS
public class VocabularyReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VocabularyReminderService> _logger;

    private DateTime? _lastExecutionDate;

    public VocabularyReminderService(
        IServiceProvider serviceProvider,
        ILogger<VocabularyReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 VocabularyReminderService khởi động - CHỈ NHẮC HỌC TỪ VỰNG");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var targetTime = new TimeSpan(12, 0, 0); // 12:00 UTC = 19:00 VN
                
                // Kiểm tra xem đã gửi trong ngày hôm nay (UTC) chưa
                if (now.TimeOfDay >= targetTime && 
                    now.TimeOfDay < targetTime.Add(TimeSpan.FromHours(1)) && // Cửa sổ rộng 1 tiếng
                    (_lastExecutionDate == null || _lastExecutionDate.Value.Date < now.Date))
                {
                    await SendVocabularyReminders();
                    _lastExecutionDate = now;
                    
                    _logger.LogInformation("✅ Đã hoàn thành gửi nhắc nhở cho ngày {Date}. Sẽ kiểm tra lại sau 1 giờ.", now.ToShortDateString());
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
                else
                {
                    // Kiểm tra lại sau 15 phút để đảm bảo không bị trượt window
                    await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
                }
            }
            catch (TaskCanceledException)
            {
                _logger.LogInformation("⏹️ VocabularyReminderService đang shutdown...");
                break;
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("⏹️ VocabularyReminderService đang shutdown...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi trong VocabularyReminderService");
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }

        _logger.LogInformation("✅ VocabularyReminderService đã dừng");
    }

    // GỬỈ NHẮC NHỞ HỌC TỪ VỰNG qua App + Email
    private async Task SendVocabularyReminders()
    {
        _logger.LogInformation("📚 Bắt đầu gửi nhắc nhở học từ vựng...");

        using var scope = _serviceProvider.CreateScope();
        var reviewRepository = scope.ServiceProvider.GetRequiredService<IFlashCardReviewRepository>();
        var notificationService = scope.ServiceProvider.GetRequiredService<SimpleNotificationService>();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        try
        {
            var currentDate = DateTime.UtcNow;
            
            // Lấy students từ repository
            var students = await userRepository.GetUsersByRoleAsync("Student");
            
            int sentAppNotifications = 0;
            int sentEmails = 0;

            foreach (var student in students)
            {
                // Đếm từ vựng cần ôn hôm nay
                var dueCount = await reviewRepository.GetDueCountAsync(student.UserId, currentDate);
                
                if (dueCount > 0)
                {
                    var reminderData = CreateReminderContent(dueCount, student.FullName ?? "bạn");

                    // 1. GỬI THÔNG BÁO TRONG APP
                    await notificationService.CreateNotificationAsync(
                        userId: student.UserId,
                        title: reminderData.AppTitle,
                        message: reminderData.AppContent,
                        type: NotificationType.VocabularyReminder
                    );
                    sentAppNotifications++;

                    // 2. GỬI EMAIL (nếu có email) - DÙNG IEmailService
                    if (!string.IsNullOrEmpty(student.Email))
                    {
                        try
                        {
                            await emailService.SendVocabularyReminderEmailAsync(
                                toEmail: student.Email,
                                studentName: student.FullName ?? "Học viên",
                                dueCount: dueCount
                            );
                            sentEmails++;
                            
                            _logger.LogDebug("📤 Gửi nhắc nhở cho {Email}: {Count} từ vựng", 
                                student.Email, dueCount);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ Lỗi gửi email cho {Email}", student.Email);
                        }
                    }
                }
            }

            _logger.LogInformation("✅ Đã gửi {AppCount} thông báo app và {EmailCount} email nhắc học từ vựng", 
                sentAppNotifications, sentEmails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi khi gửi nhắc nhở học từ vựng");
        }
    }

    #region Private Helper Methods



    private (string AppTitle, string AppContent, string EmailContent) CreateReminderContent(int dueCount, string studentName)
    {
        var appTitle = dueCount switch
        {
            1 => "📚 1 từ vựng cần ôn!",
            <= 5 => $"📚 {dueCount} từ vựng cần ôn!",
            <= 10 => $"📚 {dueCount} từ vựng đang chờ bạn!",
            <= 20 => $"📚 Wow! {dueCount} từ vựng cần ôn tập!",
            _ => $"📚 {dueCount} từ vựng - Thời gian ôn tập đây!"
        };

        var appContent = dueCount switch
        {
            1 => "Bạn có 1 từ vựng cần ôn tập hôm nay. Chỉ mất vài giây thôi! 🚀",
            <= 5 => $"Bạn có {dueCount} từ vựng cần ôn tập hôm nay. Hãy dành 5 phút để ghi nhớ tốt hơn nhé! 🧠✨",
            <= 10 => $"Bạn có {dueCount} từ vựng cần ôn tập hôm nay. Dành 10-15 phút để ôn sẽ giúp bạn nhớ lâu hơn! 📚",
            <= 20 => $"Bạn có {dueCount} từ vựng cần ôn tập hôm nay. Đây là cơ hội tuyệt vời để củng cố kiến thức! 🎯",
            _ => $"Bạn có {dueCount} từ vựng cần ôn tập. Hãy chia nhỏ thành nhiều lần trong ngày để hiệu quả hơn! 💪"
        };

        var emailContent = dueCount switch
        {
            1 => "Bạn có 1 từ vựng cần ôn tập hôm nay. Spaced Repetition giúp bạn nhớ lâu hơn!",
            <= 5 => $"Hôm nay bạn có {dueCount} từ vựng cần ôn tập. Đây là thời điểm tốt nhất để củng cố kiến thức theo khoa học!",
            <= 10 => $"Bạn có {dueCount} từ vựng cần ôn tập. Hệ thống Spaced Repetition đã tính toán thời gian tối ưu cho việc ghi nhớ!",
            _ => $"Hôm nay bạn có {dueCount} từ vựng cần ôn tập. Đừng bỏ lỡ cơ hội này để nâng cao khả năng tiếng Anh!"
        };

        return (appTitle, appContent, emailContent);
    }

    #endregion
}
