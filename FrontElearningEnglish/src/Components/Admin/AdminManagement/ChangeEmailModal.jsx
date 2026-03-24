import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { superAdminService } from "../../../Services/superAdminService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailModal({ show, onClose, admin, onSuccess }) {
  const [newEmail, setNewEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (val) => {
    if (!val.trim()) return "Email là bắt buộc";
    if (!EMAIL_REGEX.test(val.trim())) return "Email không hợp lệ (ví dụ: admin@example.com)";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail(newEmail);
    if (emailErr) {
      setTouched(true);
      setFieldError(emailErr);
      return;
    }

    try {
      setLoading(true);
      const userId = admin.userId || admin.UserId;
      const response = await superAdminService.changeAdminEmail(userId, {
        newEmail: newEmail,
      });

      if (response.data?.success) {
        onSuccess(response.data?.message || "Đổi email thành công!");
        setNewEmail("");
        setTouched(false);
        setFieldError("");
      } else {
        setError(response.data?.message || "Không thể đổi email");
      }
    } catch (err) {
      console.error("Error changing email:", err);
      setError(err.response?.data?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered className="modal-modern">
      <Modal.Header closeButton>
        <Modal.Title>Đổi Email Admin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3 p-3 bg-light rounded">
          <div className="mb-2">
            <small className="text-muted d-block">Admin</small>
            <strong>{admin?.fullName || admin?.FullName}</strong>
          </div>
          <div>
            <small className="text-muted d-block">Email hiện tại</small>
            <strong>{admin?.email || admin?.Email}</strong>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email mới <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (touched) setFieldError(validateEmail(e.target.value));
              }}
              onBlur={(e) => {
                setTouched(true);
                setFieldError(validateEmail(e.target.value));
              }}
              placeholder="newemail@example.com"
              isInvalid={touched && !!fieldError}
              maxLength={100}
            />
            {touched && fieldError && (
              <Form.Control.Feedback type="invalid">{fieldError}</Form.Control.Feedback>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang xử lý..." : "Đổi Email"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
