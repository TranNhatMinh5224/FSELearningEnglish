import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

const FillBlankInfo = () => {
  return (
    <div className="form-section-card">
      <div className="form-section-title">
        <FaQuestionCircle className="me-2" />
        Điền từ (Fill in blanks)
      </div>
      <div className="mt-3">
        <div className="alert alert-info">
          <strong>Hướng dẫn:</strong> Dùng <code className="bg-light px-2 py-1 rounded">[từ đúng]</code> trong nội dung câu hỏi để tạo chỗ trống.
          <br />
          <small className="text-muted">Ví dụ: Hanoi is the [capital] of Vietnam.</small>
        </div>
      </div>
    </div>
  );
};

export default FillBlankInfo;
