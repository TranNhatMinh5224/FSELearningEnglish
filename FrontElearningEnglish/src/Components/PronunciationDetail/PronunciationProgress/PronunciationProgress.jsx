import React from "react";
import "./PronunciationProgress.css";

export default function PronunciationProgress({ score, showScore, feedback, assessmentResult }) {
    // Overall score normalization
    const scoreNum = typeof score === 'number' ? score : parseFloat(score) || 0;
    const normalizedScore = Math.min(Math.max(scoreNum, 0), 100);
    const circumference = 2 * Math.PI * 40; // radius = 40
    const offset = circumference - (normalizedScore / 100) * circumference;

    const displayScore = showScore;

    // Detailed metrics from Azure
    const metrics = assessmentResult ? [
        { label: "Độ chính xác", value: assessmentResult.AccuracyScore || assessmentResult.accuracyScore, color: "#4ade80" },
        { label: "Độ trôi chảy", value: assessmentResult.FluencyScore || assessmentResult.fluencyScore, color: "#60a5fa" },
        { label: "Độ hoàn thiện", value: assessmentResult.CompletenessScore || assessmentResult.completenessScore, color: "#c084fc" }
    ] : [];

    return (
        <div className="pronunciation-progress-container">
            <div className="progress-main-row">
                <div className="progress-circle-wrapper">
                    <svg className="progress-circle" width="90" height="90">
                        <circle
                            className="progress-circle-bg"
                            cx="45"
                            cy="45"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="6"
                        />
                        {displayScore && (
                            <circle
                                className="progress-circle-fill"
                                cx="45"
                                cy="45"
                                r="40"
                                fill="none"
                                stroke="#41d6e3"
                                strokeWidth="6"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform="rotate(-90 45 45)"
                            />
                        )}
                    </svg>
                    <div className="progress-score">
                        <span className="score-number">
                            {displayScore ? Math.round(normalizedScore) : 0}%
                        </span>
                        <span className="score-label">Trung bình</span>
                    </div>
                </div>

                {assessmentResult && (
                    <div className="detailed-metrics">
                        {metrics.map((m, i) => (
                            <div key={i} className="metric-item">
                                <div className="metric-info">
                                    <span className="metric-label">{m.label}</span>
                                    <span className="metric-value">{Math.round(m.value)}%</span>
                                </div>
                                <div className="metric-bar-bg">
                                    <div 
                                        className="metric-bar-fill" 
                                        style={{ width: `${m.value}%`, backgroundColor: m.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {feedback && (
                <div className="progress-feedback-wrapper">
                    <span className="score-feedback">{feedback}</span>
                </div>
            )}
        </div>
    );
}


