using LearningEnglish.Application.Interface;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service.BackgroundJobs;

// Service tự động gửi nhắc nhở giữ Streak hàng ngày
public class StreakReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<StreakReminderBackgroundService> _logger;
    private DateTime? _lastExecutionDate;

    public StreakReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<StreakReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🔥 StreakReminderBackgroundService khởi động");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var targetTime = new TimeSpan(11, 0, 0); // 11:00 UTC = 18:00 VN (Gửi sớm hơn vocab 1 tiếng)
                
                // Kiểm tra xem đã gửi trong ngày hôm nay (UTC) chưa
                if (now.TimeOfDay >= targetTime && 
                    now.TimeOfDay < targetTime.Add(TimeSpan.FromHours(1)) &&
                    (_lastExecutionDate == null || _lastExecutionDate.Value.Date < now.Date))
                {
                    await SendStreakReminders();
                    _lastExecutionDate = now;
                    
                    _logger.LogInformation("✅ Đã hoàn thành gửi nhắc nhở Streak cho ngày {Date}.", now.ToShortDateString());
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
                else
                {
                    // Kiểm tra lại sau 30 phút
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi trong StreakReminderBackgroundService");
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }

    private async Task SendStreakReminders()
    {
        _logger.LogInformation("🔥 Bắt đầu quét và gửi nhắc nhở Streak...");

        using var scope = _serviceProvider.CreateScope();
        var streakService = scope.ServiceProvider.GetRequiredService<IStreakService>();

        try
        {
            var result = await streakService.SendStreakRemindersAsync();
            if (result.Success)
            {
                _logger.LogInformation("✅ {Message}", result.Message);
            }
            else
            {
                _logger.LogWarning("⚠️ Gửi nhắc nhở Streak không thành công: {Message}", result.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi khi gọi SendStreakRemindersAsync");
        }
    }
}
