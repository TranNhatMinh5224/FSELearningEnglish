import React, { useState, useEffect } from "react";
import { Container, Button, Card } from "react-bootstrap";
import { FaPlus, FaShieldAlt, FaSync } from "react-icons/fa";
import PolicyList from "../../../Components/Admin/PolicyManagement/PolicyList";
import PolicyFormModal from "../../../Components/Admin/PolicyManagement/PolicyFormModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import { policyService } from "../../../Services/policyService";
import { toast } from "react-toastify";

export default function PolicyManagement() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");


  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyService.getAllPolicies();
      if (response.data?.success) {
        setPolicies(response.data.data || []);
      } else {
        toast.error("Không thể tải danh sách chính sách.");
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setPolicyToEdit(null);
    setShowFormModal(true);
  };

  const handleEdit = (policy) => {
    setPolicyToEdit(policy);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    fetchPolicies();
  };

  const handleDeleteClick = (policy) => {
    setPolicyToDelete(policy);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      const id = policyToDelete.id || policyToDelete.Id;
      const response = await policyService.deletePolicy(id);
      if (response.data?.success) {
        toast.success("Xóa chính sách thành công!");
        fetchPolicies();
      } else {
        toast.error(response.data?.message || "Không thể xóa chính sách.");
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Lỗi kết nối.");
    } finally {
      setShowDeleteModal(false);
      setPolicyToDelete(null);
    }
  };

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary m-0">
            <FaShieldAlt className="me-2" /> Quản lý Chính sách Wiki
          </h2>
          <p className="text-muted m-0">Quản lý các quy định, chính sách dùng làm tri thức cho AI Chatbot</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleCreate} className="shadow-sm">
            <FaPlus className="me-2" /> Thêm chính sách
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu và kiến thức...</p>
            </div>
          ) : (
            <PolicyList
              policies={policies}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </Card.Body>
      </Card>

      <PolicyFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={handleFormSuccess}
        policyToEdit={policyToEdit}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa chính sách"
        message={`Bạn có chắc chắn muốn xóa chính sách "${policyToDelete?.title || policyToDelete?.Title}"? Điều này sẽ gỡ bỏ tri thức này khỏi Chatbot AI.`}
        confirmText="Xóa hoàn toàn"
        cancelText="Hủy"
        type="delete"
      />
    </Container>
  );
}
