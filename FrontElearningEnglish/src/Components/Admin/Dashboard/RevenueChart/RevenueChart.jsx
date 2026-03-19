import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./RevenueChart.css";

export default function RevenueChart({ data, loading, formatCurrency }) {
  return (
    <div className="col-lg-8">
      <div className="admin-card">
        <h5 className="fw-bold mb-4">Revenue Growth Trend</h5>
        <div style={{ width: '100%', height: 350 }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              Loading chart...
            </div>
          ) : data.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              No revenue data available for this period.
            </div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCourse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPackage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : (val >= 1000 ? `${val / 1000}K` : val)}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light, #e5e7eb)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card, white)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                  formatter={(value, name) => [formatCurrency(value), name === 'courseRev' ? 'Courses' : 'Packages']}
                />
                {/* Area 2: Teacher Packages (Cyan) */}
                <Area
                  type="monotone"
                  dataKey="packageRev"
                  stackId="1"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorPackage)"
                  name="Packages"
                  animationDuration={1500}
                />
                {/* Area 1: Courses (Purple) */}
                <Area
                  type="monotone"
                  dataKey="courseRev"
                  stackId="1"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorCourse)"
                  name="Courses"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
