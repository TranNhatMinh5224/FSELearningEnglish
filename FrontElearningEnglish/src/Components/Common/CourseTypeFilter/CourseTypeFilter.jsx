import React from "react";
import "./CourseTypeFilter.css";

export default function CourseTypeFilter({ activeType, onTypeChange, className = "" }) {
  const types = [
    { id: "all", label: "All Courses" },
    { id: "system", label: "System Courses" },
    { id: "teacher", label: "Teacher Courses" }
  ];

  return (
    <div className={`course-type-filter-group ${className}`}>
      {types.map((type) => (
        <button
          key={type.id}
          type="button"
          className={`type-filter-btn ${activeType === type.id ? "active" : ""}`}
          onClick={() => onTypeChange(type.id)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
