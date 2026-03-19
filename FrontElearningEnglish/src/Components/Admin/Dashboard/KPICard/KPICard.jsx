import React from "react";
import "./KPICard.css";

export default function KPICard({ title, value, formatValue, icon: Icon, iconColor, iconBgColor, subtitle }) {
  return (
    <div className="col-md-3 mb-4 mb-md-0">
      <div className="admin-card" style={{ borderLeft: `4px solid ${iconColor || '#6366f1'}` }}>
        <div className="position-relative z-index-1">
          <p className="text-muted mb-1">{title}</p>
          <h3 className="fw-bold mb-0">
            {formatValue ? formatValue(value) : value}
          </h3>
          {subtitle && (
            <small className="mt-3 text-muted">
              {subtitle}
            </small>
          )}
        </div>

        {/* Floating Decorative Icon */}
        <div className="kpi-icon-wrapper">
          <Icon size={64} color={iconColor || '#6366f1'} />
        </div>
      </div>
    </div>
  );
}
