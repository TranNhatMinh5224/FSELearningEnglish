import React from "react";
import "./PageLoader.css";

const PageLoader = () => {
  return (
    <div className="page-loader-container">
      <div className="page-loader-content">
        <div className="page-loader-spinner"></div>
        <p className="page-loader-text">Đang tải nội dung...</p>
      </div>
    </div>
  );
};

export default PageLoader;
