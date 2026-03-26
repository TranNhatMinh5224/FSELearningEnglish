import React from "react";
import { FaTrophy, FaTimesCircle, FaCheckCircle } from "react-icons/fa";

export default function QuizAttemptSummary({ 
  fullName, 
  email, 
  percentage, 
  timeSpentSeconds, 
  title, 
  isPassed,
  showStatusIcon = false,
  totalScore,
  totalPossibleScore 
}) {
  const displayTitle = title || fullName;
  const formatScore = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : "0.0";
  };
  
  return (
    <div className="content-intro mb-4 p-4 bg-white rounded-4 shadow-sm border border-light">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          {showStatusIcon && (
            <div className={`status-icon-v3 ${isPassed ? 'text-success' : 'text-danger'}`} style={{ fontSize: '2.5rem' }}>
              {isPassed ? <FaTrophy /> : <FaTimesCircle />}
            </div>
          )}
          <div>
            <h3 className="fw-800 mb-1" style={{ color: 'var(--slate-900)', fontSize: '1.5rem' }}>{displayTitle}</h3>
            {email && <div className="text-muted fw-500">{email}</div>}
            {!email && fullName && <div className="text-muted fw-500">Người làm: {fullName}</div>}
          </div>
        </div>
        
        <div className="stats-box-v3 d-flex gap-4">
          <div className="stat-item-v3 text-center">
            <div className="stat-label-v3 text-muted small fw-bold text-uppercase">Kết quả</div>
            <div className={`stat-value-v3 fw-800 ${isPassed !== false ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.25rem' }}>
              {percentage !== null ? `${percentage}%` : "100%"}
            </div>
          </div>
          <div className="stat-item-v3 text-center border-start ps-4">
            <div className="stat-label-v3 text-muted small fw-bold text-uppercase">Điểm</div>
            <div className="stat-value-v3 fw-800 text-primary" style={{ fontSize: '1.25rem' }}>
              {`${formatScore(totalScore)}/${formatScore(totalPossibleScore)}`}
            </div>
          </div>
          <div className="stat-item-v3 text-center border-start ps-4">
            <div className="stat-label-v3 text-muted small fw-bold text-uppercase">Thời gian</div>
            <div className="stat-value-v3 fw-800 text-primary" style={{ fontSize: '1.25rem' }}>
              {timeSpentSeconds > 0 ? `${Math.floor(timeSpentSeconds / 60)}p ${timeSpentSeconds % 60}s` : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
