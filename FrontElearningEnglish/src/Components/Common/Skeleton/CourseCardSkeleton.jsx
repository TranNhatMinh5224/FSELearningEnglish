import React from "react";
import Skeleton from "./Skeleton";
import "./Skeleton.css";

const CourseCardSkeleton = () => {
  return (
    <div className="course-card-skeleton" style={{ 
      background: '#fff', 
      borderRadius: '16px', 
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      height: '100%'
    }}>
      <Skeleton width="100%" height="160px" borderRadius="12px" className="mb-3" />
      <Skeleton width="80%" height="20px" className="mb-2" />
      <Skeleton width="40%" height="14px" className="mb-3" />
      <div className="d-flex justify-content-between align-items-center">
        <Skeleton width="60px" height="24px" />
        <Skeleton width="24px" height="24px" borderRadius="50%" />
      </div>
    </div>
  );
};

export default CourseCardSkeleton;
