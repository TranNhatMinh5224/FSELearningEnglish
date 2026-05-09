import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./RevenueChart.css";

export default function RevenueChart({ data, loading, formatCurrency }) {
  // Custom Tooltip for Fintech vibe
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{label}</p>
          <div className="tooltip-divider"></div>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="dot" style={{ backgroundColor: entry.color }}></span>
              <span className="label">{entry.name}:</span>
              <span className="value">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="tooltip-total">
            <span>Total:</span>
            <span>{formatCurrency(payload.reduce((acc, curr) => acc + curr.value, 0))}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-chart-card">
      <div className="chart-header">
        <h5 className="fw-bold mb-0">Revenue Growth Trend</h5>
        <div className="chart-legend">
          <div className="legend-item"><span className="dot courses"></span> Courses</div>
          <div className="legend-item"><span className="dot packages"></span> Packages</div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        {loading ? (
          <div className="chart-loading">Loading chart data...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">No revenue data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCourse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--fintech-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--fintech-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPackage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--fintech-secondary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--fintech-secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : (val >= 1000 ? `${val / 1000}K` : val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="packageRev"
                stackId="1"
                stroke="var(--fintech-secondary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPackage)"
                name="Packages"
                animationDuration={2000}
              />
              <Area
                type="monotone"
                dataKey="courseRev"
                stackId="1"
                stroke="var(--fintech-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCourse)"
                name="Courses"
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
