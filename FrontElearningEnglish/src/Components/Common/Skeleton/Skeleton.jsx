import React from "react";
import "./Skeleton.css";

/**
 * Reusable Skeleton component for loading states
 * @param {string} width - Width of the skeleton
 * @param {string} height - Height of the skeleton
 * @param {string} borderRadius - Border radius
 * @param {string} className - Additional CSS classes
 */
const Skeleton = ({ 
  width, 
  height, 
  borderRadius = "8px", 
  className = "",
  style = {} 
}) => {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export default Skeleton;
