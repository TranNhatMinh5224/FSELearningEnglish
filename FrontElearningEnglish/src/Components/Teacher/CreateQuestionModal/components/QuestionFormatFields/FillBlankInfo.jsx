import React from "react";
import { Alert, Badge } from "react-bootstrap";
import { FaInfoCircle, FaKeyboard, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const FillBlankInfo = () => {
  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="form-section-header bg-light p-3 d-flex align-items-center gap-2 border-bottom">
            <FaKeyboard className="text-primary fs-5" /> 
            <span className="fw-bold text-dark">Hướng dẫn soạn thảo Fill-in-the-Blanks</span>
        </div>
        
        <div className="p-4">
            <div className="alert alert-info border-0 rounded-4 p-4 shadow-sm mb-4">
                <div className="d-flex align-items-start gap-3">
                    <div className="icon-circle bg-info text-white flex-shrink-0">
                        <FaInfoCircle size={24} />
                    </div>
                    <div>
                        <h6 className="fw-bold mb-2">Cách tạo ô trống trong câu hỏi:</h6>
                        <p className="mb-3">
                            Để tạo một ô trống, bạn chỉ cần đặt đáp án đúng vào trong cặp ngoặc vuông <code>[...]</code>, ngoặc nhọn <code>{`{...}`}</code> hoặc ngoặc đơn <code>(...)</code>.
                        </p>
                        
                        <div className="bg-white p-3 rounded-3 border border-info border-opacity-25 font-monospace small mb-3 text-break">
                            Ví dụ: Hà Nội là [thủ đô] của Việt Nam.
                        </div>

                        <div className="d-flex align-items-center gap-2 text-info-emphasis small fw-bold">
                            <FaCheckCircle className="text-success" /> Hệ thống sẽ tự động trích xuất các từ trong ngoặc làm đáp án.
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-light p-4 rounded-4 border">
                <h6 className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                    <FaExclamationTriangle className="me-2 text-warning" /> Lưu ý quan trọng
                </h6>
                <ul className="mb-0 small text-muted lh-lg">
                    <li>Bạn có thể tạo <strong>nhiều ô trống</strong> trong cùng một câu hỏi.</li>
                    <li>Mỗi ô trống tương ứng với một đáp án mà học sinh cần nhập chính xác.</li>
                    <li>Phần mềm không phân biệt chữ hoa, chữ thường khi chấm điểm (tùy thuộc vào cấu hình hệ thống).</li>
                </ul>
            </div>
        </div>
    </div>
  );
};

export default FillBlankInfo;
