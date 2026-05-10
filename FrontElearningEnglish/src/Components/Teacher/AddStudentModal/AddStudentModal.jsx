import React, { useState } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import "./AddStudentModal.css";
import { teacherService } from "../../../Services/teacherService";
import { adminService } from "../../../Services/adminService";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import { PiUserPlusDuotone, PiEnvelopeSimpleDuotone, PiSpinnerBold } from "react-icons/pi";

export default function AddStudentModal({ show, onClose, onSuccess, courseId, isAdmin = false }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    validateEmail();
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Vui lòng nhập email học viên");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không hợp lệ");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) {
      setTouched(true);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = isAdmin 
        ? await adminService.addStudentToCourse(courseId, email.trim())
        : await teacherService.addStudentToCourse(courseId, email.trim());

      if (response.data?.success || response.data?.Success) {
        setEmail("");
        onSuccess();
      } else {
        setError(response.data?.message || response.data?.Message || "Không thể thêm học viên");
      }
    } catch (err) {
      console.error("Error adding student:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.Message || 
                          "Đã xảy ra lỗi khi thêm học viên. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="modal-modern add-student-modal">
      <Modal.Header closeButton={false} className="px-4 py-3 border-0">
        <Modal.Title className="fw-bold modal-title-centered text-white d-flex align-items-center gap-3">
          <PiUserPlusDuotone size={32} />
          <span>Thêm học sinh vào lớp</span>
        </Modal.Title>
        <PremiumCloseButton onClick={handleClose} />
      </Modal.Header>
      
      <Modal.Body className="p-4">
        <Form onSubmit={handleSubmit} className="add-student-form">
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-muted small text-uppercase mb-2">
              Email học viên
            </Form.Label>
            <InputGroup className={`shadow-sm rounded-3 overflow-hidden ${touched && error ? "border border-danger" : ""}`}>
              <InputGroup.Text className="bg-white border-end-0 text-primary">
                <PiEnvelopeSimpleDuotone size={22} />
              </InputGroup.Text>
              <Form.Control
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched) validateEmail();
                }}
                onBlur={handleBlur}
                placeholder="Nhập email học viên..."
                className="border-start-0 py-2 fs-6"
                disabled={loading}
                autoFocus
              />
            </InputGroup>
            {touched && error && <div className="asm-error-msg mt-2 text-danger small fw-bold">{error}</div>}
            <div className="form-hint mt-2 text-muted small">
              Hệ thống sẽ kiểm tra email và thêm người dùng vào khóa học này.
            </div>
          </Form.Group>

          <div className="form-actions d-flex justify-content-end gap-3 pt-2">
            <Button
              variant="secondary"
              className="rounded-pill px-4 fw-bold shadow-sm"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="rounded-pill px-5 fw-bold btn-primary-custom"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <PiSpinnerBold className="spinner me-2" />
                  Đang thêm...
                </>
              ) : (
                "Thêm học viên"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
