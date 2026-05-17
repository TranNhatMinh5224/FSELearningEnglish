import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./CelebrationModal.css";
import { FaFire, FaTrophy, FaStar } from "react-icons/fa";

const CelebrationModal = ({ isOpen, onClose, milestone }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            
            // Trigger true fireworks effect
            const fireFireworks = () => {
                if (window.confetti) {
                    const duration = 5 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 45, spread: 360, ticks: 80, zIndex: 100000, colors: ['#ff0000', '#ffd700', '#00ff00', '#ffffff', '#ff00ff', '#00ffff'] };

                    const randomInRange = (min, max) => Math.random() * (max - min) + min;

                    const interval = setInterval(function() {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 80 * (timeLeft / duration);
                        
                        // Fire from multiple origins to create a full firework show
                        window.confetti({ 
                            ...defaults, 
                            particleCount, 
                            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                            gravity: 1.2,
                            scalar: 1.2,
                            drift: randomInRange(-0.5, 0.5)
                        });
                        window.confetti({ 
                            ...defaults, 
                            particleCount, 
                            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                            gravity: 1.2,
                            scalar: 1.2,
                            drift: randomInRange(-0.5, 0.5)
                        });
                        window.confetti({ 
                            ...defaults, 
                            particleCount: particleCount * 1.5, 
                            origin: { x: 0.5, y: 0.8 },
                            startVelocity: 60,
                            gravity: 0.8,
                            scalar: 1.5
                        });
                    }, 300);
                    return true;
                }
                return false;
            };

            // Try immediately
            if (!fireFireworks()) {
                let attempts = 0;
                const retryInterval = setInterval(() => {
                    attempts++;
                    if (fireFireworks() || attempts > 10) {
                        clearInterval(retryInterval);
                    }
                }, 500);
            }
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getMilestoneText = () => {
        if (milestone.isNew) return "Chào mừng thành viên mới!";
        if (milestone.days >= 365) return `Đẳng cấp ${Math.floor(milestone.days / 365)} năm kiên trì!`;
        if (milestone.days >= 30) return `Hành trình ${Math.floor(milestone.days / 30)} tháng rực rỡ!`;
        return `${milestone.days} ngày học tập miệt mài!`;
    };

    const getEncouragement = () => {
        if (milestone.isNew) return "Hãy bắt đầu hành trình chinh phục tiếng Anh ngay hôm nay cùng Catalunya English nhé!";
        if (milestone.days >= 365) return "Bạn là một tấm gương sáng về sự bền bỉ. Thành công chắc chắn sẽ mỉm cười với bạn!";
        if (milestone.days >= 30) return "Thói quen tuyệt vời này đang giúp bạn tiến bộ mỗi ngày. Đừng dừng lại nhé!";
        return "Mỗi ngày một chút, bạn đang dần chạm tay tới giấc mơ của mình. Tiếp tục phát huy nhé!";
    };

    const modalContent = (
        <div className={`celebration-overlay ${isVisible ? 'active' : ''}`} onClick={onClose}>
            <div className="celebration-content" onClick={(e) => e.stopPropagation()}>
                <div className="celebration-header">
                    <div className="trophy-wrapper">
                        <FaTrophy className="trophy-icon" />
                        <div className="stars-decoration">
                            <FaStar className="star-mini s1" />
                            <FaStar className="star-mini s2" />
                            <FaStar className="star-mini s3" />
                        </div>
                    </div>
                </div>
                
                <div className="celebration-body">
                    <h2 className="celebration-title">CHÚC MỪNG BẠN!</h2>
                    <div className="streak-display">
                        <div className="streak-fire-wrapper">
                            <FaFire className="streak-fire-icon" />
                        </div>
                        <span className={`streak-number ${milestone.isNew ? 'welcome-text' : ''}`}>
                            {milestone.isNew ? "WELCOME" : milestone.days}
                        </span>
                        {!milestone.isNew && <span className="streak-label">NGÀY</span>}
                    </div>
                    <h3 className="milestone-text">{getMilestoneText()}</h3>
                    <p className="encouragement-text">{getEncouragement()}</p>
                </div>

                <div className="celebration-footer">
                    <button className="celebration-close-btn" onClick={onClose}>
                        TUYỆT VỜI!
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default CelebrationModal;
