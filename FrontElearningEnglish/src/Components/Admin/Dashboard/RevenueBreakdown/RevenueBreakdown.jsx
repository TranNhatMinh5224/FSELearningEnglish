import React from "react";
import "./RevenueBreakdown.css";
import { FaBookOpen, FaUserTie } from "react-icons/fa";

export default function RevenueBreakdown({ breakdown, totalRevenue, formatCurrency }) {
  const sources = [
    { 
      id: 'courses', 
      label: 'Course Sales', 
      value: breakdown.fromCourses, 
      color: 'var(--fintech-primary)', 
      icon: <FaBookOpen />,
      percentage: totalRevenue > 0 ? (breakdown.fromCourses / totalRevenue) * 100 : 0
    },
    { 
      id: 'packages', 
      label: 'Teacher Packages', 
      value: breakdown.fromPackages, 
      color: 'var(--fintech-secondary)', 
      icon: <FaUserTie />,
      percentage: totalRevenue > 0 ? (breakdown.fromPackages / totalRevenue) * 100 : 0
    }
  ];

  return (
    <div className="revenue-sources-card">
      <h6 className="fw-bold mb-4">Revenue Sources</h6>
      <div className="sources-list">
        {sources.map((source) => (
          <div key={source.id} className="source-item mb-4">
            <div className="source-info d-flex align-items-center mb-2">
              <div className="source-icon-box" style={{ backgroundColor: `${source.color}15`, color: source.color }}>
                {source.icon}
              </div>
              <div className="ms-3 flex-grow-1">
                <div className="source-label">{source.label}</div>
                <div className="source-value">{formatCurrency(source.value)}</div>
              </div>
              <div className="source-percent">{source.percentage.toFixed(1)}%</div>
            </div>
            <div className="source-progress-bg">
              <div 
                className="source-progress-fill" 
                style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
