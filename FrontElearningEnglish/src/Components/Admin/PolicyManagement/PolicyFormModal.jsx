import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { policyService } from "../../../Services/policyService";
import { toast } from "react-toastify";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";

export default function PolicyFormModal({ show, onClose, onSuccess, policyToEdit }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "General",
    contentMarkdown: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (policyToEdit) {
      setFormData({
        title: policyToEdit.title || policyToEdit.Title || "",
        slug: policyToEdit.slug || policyToEdit.Slug || "",
        category: policyToEdit.category || policyToEdit.Category || "General",
        contentMarkdown: policyToEdit.contentMarkdown || policyToEdit.ContentMarkdown || "",
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        category: "General",
        contentMarkdown: "",
      });
    }
  }, [policyToEdit, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (policyToEdit) {
        const id = policyToEdit.id || policyToEdit.Id;
        response = await policyService.updatePolicy(id, formData);
      } else {
        response = await policyService.createPolicy(formData);
      }

      if (response.data?.success) {
        toast.success(policyToEdit ? "Cập nhật thành công!" : "Thêm mới thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.data?.message || "Đã xảy ra lỗi.");
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      toast.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="modal-modern">
      <Modal.Header closeButton={false} className="modal-header-cyan">
        <Modal.Title className="fw-bold modal-title-centered text-white">
          {policyToEdit ? "Cập nhật chính sách" : "Thêm chính sách mới"}
        </Modal.Title>
        <PremiumCloseButton onClick={onClose} variant="white" />
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Tiêu đề</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: Chính sách Bảo mật"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Slug (Đường dẫn)</Form.Label>
                <Form.Control
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="VD: privacy-policy"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Danh mục</Form.Label>
            <Form.Select name="category" value={formData.category} onChange={handleChange}>
              <option value="General">Chung</option>
              <option value="Refund">Hoàn tiền</option>
              <option value="Privacy">Bảo mật</option>
              <option value="Terms">Điều khoản</option>
              <option value="Support">Hỗ trợ</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Nội dung (Markdown)</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              name="contentMarkdown"
              value={formData.contentMarkdown}
              onChange={handleChange}
              placeholder="Nhập nội dung chính sách bằng Markdown..."
              required
            />
            <Form.Text className="text-muted">
              Nội dung này sẽ được AI sử dụng để làm tri thức trả lời người dùng.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu chính sách"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
