import React from "react";
import { HiArrowTrendingUp, HiArrowTrendingDown } from "react-icons/hi2";
import "./KPICard.css";

export default function KPICard({ 
  title, 
  value, 
  formatValue, 
  icon: Icon, 
  iconColor, 
  subtitle,
  trend,
  isUp 
}) {
  return (
    <div className="kpi-metric-card">
      <div className="kpi-content-top">
        <p className="text-muted mb-1">{title}</p>
        <div className="d-flex align-items-center gap-3">
          <h3 className="fw-bold mb-0">
            {formatValue ? formatValue(value) : value}
          </h3>
          {trend && (
            <div className={`trend-indicator ${isUp ? 'trend-up' : 'trend-down'}`}>
              {isUp ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
              {trend}
            </div>
          )}
        </div>
      </div>

      <div className="kpi-footer mt-3">
        {subtitle && (
          <small className="text-muted d-flex align-items-center">
            {subtitle}
          </small>
        )}
      </div>

      {/* Floating Decorative Icon */}
      <div className="kpi-icon-wrapper" style={{ color: iconColor }}>
        <Icon size={100} />
      </div>
    </div>
  );
}
