import React from "react";
import { PiCalendarBlankDuotone, PiArrowClockwiseBold } from "react-icons/pi";
import "./DashboardHeader.css";

export default function DashboardHeader({ timeRange, onTimeRangeChange, onRefresh }) {
  return (
    <div className="dashboard-header-modern mb-4">
      <div className="header-info">
        <h1 className="page-title-modern mb-1">Dashboard Overview</h1>
        <p className="text-muted mb-0">Real-time system analytics & insights</p>
      </div>

      <div className="header-actions-modern">
        <div className="time-range-pill shadow-sm">
          <PiCalendarBlankDuotone size={20} className="calendar-icon" />
          <select
            className="time-select-custom"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
            <option value={365}>Last 1 Year</option>
          </select>
        </div>
        
        <button className="btn-refresh-premium shadow-sm" onClick={onRefresh}>
          <PiArrowClockwiseBold className="refresh-icon" />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>
  );
}
