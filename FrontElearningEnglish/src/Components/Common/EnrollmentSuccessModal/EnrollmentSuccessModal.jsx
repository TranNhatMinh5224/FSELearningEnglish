import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaGraduationCap, FaBookReader, FaRocket, FaCheckCircle } from "react-icons/fa";
import "./EnrollmentSuccessModal.css";

/**
 * EnrollmentSuccessModal - Modal chúc mừng khi tham gia khóa học thành công
 * Sử dụng React-Bootstrap Modal để responsive tốt hơn
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {function} onClose - Hàm đóng modal (Để sau)
 * @param {function} onGoToCourse - Hàm chuyển đến trang học (Vào học ngay)
 * @param {object} course - Thông tin khóa học (title, imageUrl)
 */
export default function EnrollmentSuccessModal({ isOpen, onClose, onGoToCourse, course }) {
    if (!isOpen) return null;

    return (
        <Modal 
            show={isOpen} 
            onHide={onClose} 
            centered 
            className="esm-bootstrap-modal"
            dialogClassName="esm-dialog"
            contentClassName="esm-content"
        >
            {/* Confetti decoration */}
            <div className="esm-confetti-container">
                <div className="esm-confetti esm-confetti-1"></div>
                <div className="esm-confetti esm-confetti-2"></div>
                <div className="esm-confetti esm-confetti-3"></div>
                <div className="esm-confetti esm-confetti-4"></div>
                <div className="esm-confetti esm-confetti-5"></div>
                <div className="esm-confetti esm-confetti-6"></div>
                <div className="esm-confetti esm-confetti-7"></div>
                <div className="esm-confetti esm-confetti-8"></div>
            </div>

            {/* Header với icon */}
            <div className="esm-header">
                <div className="esm-icon-container">
                    <div className="esm-icon-ring"></div>
                    <div className="esm-icon-inner d-flex align-items-center justify-content-center">
                        <FaGraduationCap className="esm-icon" />
                    </div>
                    <div className="esm-check-badge d-flex align-items-center justify-content-center">
                        <FaCheckCircle />
                    </div>
                </div>
            </div>

            <Modal.Body className="esm-body text-center px-3 px-sm-4">
                <h2 className="esm-title mb-2">
                    🎉 Chúc mừng bạn!
                </h2>
                <p className="esm-subtitle mb-3 mb-sm-4">
                    Đăng ký khóa học thành công
                </p>
                
                {course?.title && (
                    <div className="esm-course-card d-flex align-items-center justify-content-center gap-2 gap-sm-3 mb-3 mb-sm-4">
                        <FaBookReader className="esm-course-icon flex-shrink-0" />
                        <span className="esm-course-title text-start">{course.title}</span>
                    </div>
                )}

                <p className="esm-description mb-0">
                    Khóa học đã sẵn sàng cho bạn khám phá. 
                    Hãy bắt đầu hành trình học tập ngay bây giờ!
                </p>
            </Modal.Body>

            {/* Footer với buttons - responsive flex */}
            <Modal.Footer className="esm-footer d-flex flex-column-reverse flex-sm-row gap-2 gap-sm-3 px-3 px-sm-4 py-3 py-sm-4">
                <Button 
                    variant="outline-secondary"
                    className="esm-btn esm-btn-secondary flex-grow-1"
                    onClick={onClose}
                >
                    Để sau
                </Button>
                <Button 
                    variant="primary"
                    className="esm-btn esm-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={onGoToCourse}
                >
                    <FaRocket className="esm-btn-icon" />
                    Vào học ngay
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
