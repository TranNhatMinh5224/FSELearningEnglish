import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { superAdminService } from "../../../Services/superAdminService";

export default function ResetPasswordModal({ show, onClose, admin, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
  const [fieldErrors, setFieldErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateNewPassword = (val) => {
    if (!val) return "Mật khẩu là bắt buộc";
    if (val.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return "";
  };

  const validateConfirm = (val, pwd) => {
    if (!val) return "Vui lòng xác nhận mật khẩu";
    if (val !== pwd) return "Mật khẩu xác nhận không khớp";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const pwdErr = validateNewPassword(newPassword);
    const cfmErr = validateConfirm(confirmPassword, newPassword);
    if (pwdErr || cfmErr) {
      setTouched({ newPassword: true, confirmPassword: true });
      setFieldErrors({ newPassword: pwdErr, confirmPassword: cfmErr });
      return;
    }

    try {
      setLoading(true);
      const userId = admin.userId || admin.UserId;
      const response = await superAdminService.resetAdminPassword(userId, {
        newPassword: newPassword,
      });

      if (response.data?.success) {
        onSuccess(response.data?.message || "Reset password thành công!");
        setNewPassword("");
        setConfirmPassword("");
        setTouched({ newPassword: false, confirmPassword: false });
        setFieldErrors({ newPassword: "", confirmPassword: "" });
      } else {
        setError(response.data?.message || "Không thể reset password");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(err.response?.data?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered className="modal-modern">
      <Modal.Header closeButton>
        <Modal.Title>Reset Password Admin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3 p-3 bg-light rounded">
          <small className="text-muted d-block">Admin</small>
          <strong>{admin?.fullName || admin?.FullName}</strong>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu mới <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (touched.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: validateNewPassword(e.target.value) }));
                if (touched.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirm(confirmPassword, e.target.value) }));
              }}
              onBlur={(e) => {
                setTouched(prev => ({ ...prev, newPassword: true }));
                setFieldErrors(prev => ({ ...prev, newPassword: validateNewPassword(e.target.value) }));
              }}
              placeholder="Tối thiểu 6 ký tự"
              isInvalid={touched.newPassword && !!fieldErrors.newPassword}
            />
            {touched.newPassword && fieldErrors.newPassword && (
              <Form.Control.Feedback type="invalid">{fieldErrors.newPassword}</Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirm(e.target.value, newPassword) }));
              }}
              onBlur={(e) => {
                setTouched(prev => ({ ...prev, confirmPassword: true }));
                setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirm(e.target.value, newPassword) }));
              }}
              placeholder="Nhập lại mật khẩu mới"
              isInvalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
            />
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <Form.Control.Feedback type="invalid">{fieldErrors.confirmPassword}</Form.Control.Feedback>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang xử lý..." : "Reset Password"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
