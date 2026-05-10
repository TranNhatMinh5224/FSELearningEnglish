import React from "react";
import { FaEdit, FaInfoCircle, FaLightbulb } from "react-icons/fa";

const FillBlankInfo = () => {
  return (
    <div className="form-section-card format-section">
      <div className="form-section-title mb-3">
        <FaEdit className="icon-accent" /> Hướng dẫn Điền từ vào chỗ trống
      </div>
      
      <div className="alert alert-info border-0 bg-white shadow-sm mb-0 p-3">
        <h6 className="d-flex align-items-center fw-bold text-primary mb-2">
          <FaLightbulb className="me-2" /> Quy tắc đặt từ khóa
        </h6>
        <p className="mb-2">
          Để tạo chỗ trống, hãy bao quanh từ hoặc cụm từ đáp án bằng dấu ngoặc vuông <strong>[ ]</strong> trong nội dung câu hỏi phía trên.
        </p>
        <div className="bg-light p-2 rounded border-start border-4 border-info">
          <code className="text-dark">Ví dụ: Hanoi is the <strong>[capital]</strong> of Vietnam.</code>
        </div>
        <p className="mt-2 mb-0 small text-muted">
          <FaInfoCircle className="me-1" /> Hệ thống sẽ tự động nhận diện phần trong ngoặc là đáp án và hiển thị ô nhập liệu cho học sinh.
        </p>
      </div>
    </div>
  );
};

export default FillBlankInfo;
