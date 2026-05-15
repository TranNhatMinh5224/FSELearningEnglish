import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import "./UserDistributionChart.css";

export default function UserDistributionChart({ userStats }) {
  const userPieData = [
    { name: 'Students', value: userStats.studentCount, color: '#6D28D9' },
    { name: 'Teachers', value: userStats.teacherCount, color: '#0CA6E9' },
  ];

  const total = userStats.studentCount + userStats.teacherCount;

  return (
    <div className="dashboard-chart-card">
      <h6 className="fw-bold mb-4">User Distribution</h6>
      <div className="pie-chart-wrapper" style={{ height: '220px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={userPieData}
              innerRadius={65}
              outerRadius={85}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
            >
              {userPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Label */}
        <div className="pie-center-label">
          <span className="total-value">{total}</span>
          <span className="total-label">Total</span>
        </div>
      </div>

      <div className="pie-legend mt-4">
        {userPieData.map((item, i) => (
          <div key={i} className="pie-legend-item">
            <span className="dot" style={{ backgroundColor: item.color }}></span>
            <span className="name">{item.name}</span>
            <span className="value">{((item.value / (total || 1)) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
