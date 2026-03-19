import React from "react";
import "./RevenueBreakdown.css";
import { FaBookOpen, FaUserTie } from "react-icons/fa";

export default function RevenueBreakdown({ breakdown, totalRevenue, formatCurrency }) {
  return (
    <div className="admin-card h-100">
      <h6 className="fw-bold mb-4">Revenue Sources</h6>

      {/* Course Sales Card */}
      <div className="source-card course">
        <div className="source-icon">
          <FaBookOpen />
        </div>
        <div className="source-info">
          <span className="source-label">Course Sales</span>
          <div className="d-flex justify-content-between align-items-end">
            <span className="source-value">{formatCurrency(breakdown.fromCourses)}</span>
            <small className="fw-bold text-primary">
              {totalRevenue > 0 ? ((breakdown.fromCourses / totalRevenue) * 100).toFixed(1) : 0}%
            </small>
          </div>
          <div className="source-progress">
            <div className="source-progress-bar" style={{ width: `${totalRevenue > 0 ? (breakdown.fromCourses / totalRevenue) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Teacher Package Card */}
      <div className="source-card package">
        <div className="source-icon">
          <FaUserTie />
        </div>
        <div className="source-info">
          <span className="source-label">Teacher Packages</span>
          <div className="d-flex justify-content-between align-items-end">
            <span className="source-value">{formatCurrency(breakdown.fromPackages)}</span>
            <small className="fw-bold text-info">
              {totalRevenue > 0 ? ((breakdown.fromPackages / totalRevenue) * 100).toFixed(1) : 0}%
            </small>
          </div>
          <div className="source-progress">
            <div className="source-progress-bar" style={{ width: `${totalRevenue > 0 ? (breakdown.fromPackages / totalRevenue) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
