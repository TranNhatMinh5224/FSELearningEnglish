import React, { useState, useEffect } from "react";
import "./ProgressBar.css";

export default function ProgressBar({ 
    completed, 
    total, 
    percentage, 
    milestones = [], 
    label = "Tiến độ khóa học", 
    unit = "bài học",
    variant = "default" // "default" or "compact"
}) {
    // Đảm bảo percentage không vượt quá 100%
    const safePercentage = Math.min(Math.max(Number(percentage) || 0, 0), 100);

    // Tính lại percentage từ completed/total nếu percentage không hợp lệ
    const calculatedPercentage = total > 0
        ? Math.min(Math.round((completed / total) * 100), 100)
        : 0;

    // Ưu tiên dùng percentage từ props, nếu không hợp lệ thì tính từ completed/total
    const finalPercentage = percentage > 0 ? safePercentage : calculatedPercentage;

    // State cho hiệu ứng số nhảy
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const startValue = animatedPercentage;
        const endValue = finalPercentage;

        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Easing function (easeOutExpo)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const currentValue = startValue + (endValue - startValue) * easeProgress;
            setAnimatedPercentage(Math.round(currentValue * 10) / 10);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [finalPercentage]);

    // Lấy thông điệp và icon động
    const getMotivationalMessage = (per) => {
        if (per === 0) return { text: "Bắt đầu hành trình chinh phục ngay thôi!", icon: "💪" };
        if (per < 30) return { text: "Khởi đầu rất tốt, duy trì phong độ nhé!", icon: "✨" };
        if (per < 70) return { text: "Bạn đang làm rất tốt, tiếp tục phát huy nào!", icon: "🚀" };
        if (per < 100) return { text: "Sắp về đích rồi, cố gắng thêm chút nữa thôi!", icon: "🔥" };
        return { text: "Tuyệt vời! Bạn đã hoàn thành xuất sắc khóa học này!", icon: "🎉" };
    };

    const isCompact = variant === "compact";
    const motivation = getMotivationalMessage(finalPercentage);

    return (
        <div className={`progress-bar-container ${isCompact ? "is-compact" : ""} ${finalPercentage === 100 ? "is-completed" : ""}`}>
            <div className="progress-header">
                <div className="progress-title-group">
                    <span className="progress-label">{label}</span>
                    <span className="progress-stats-inline">
                         <span className="stats-count">{completed}/{total}</span> {unit}
                    </span>
                </div>
                <div className="progress-percentage-wrapper">
                    <span className="progress-percentage">{animatedPercentage}%</span>
                </div>
            </div>
            
            <div className="progress-track-wrapper">
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${finalPercentage}%` }}
                    >
                        {finalPercentage > 5 && <span className="progress-fill-glow"></span>}
                    </div>
                </div>
                
                {/* Milestone Markers */}
                {!isCompact && milestones && milestones.length > 0 && (
                    <div className="progress-milestones">
                        {milestones.map((m, idx) => (
                            <div 
                                key={idx} 
                                className={`milestone-marker ${finalPercentage >= m.position ? "reached" : ""}`}
                                style={{ left: `${m.position}%` }}
                                title={m.title}
                            />
                        ))}
                    </div>
                )}
            </div>

            {!isCompact && (
                <div className="progress-footer">
                    <p className="motivational-message">
                        <span className="motivation-icon">{motivation.icon}</span>
                        <span className="motivation-text">{motivation.text}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

