import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FaLayerGroup, FaImage } from "react-icons/fa";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import FormInput from "../../Common/FormControls/FormInput";
import FormTextArea from "../../Common/FormControls/FormTextArea";
import FormSelect from "../../Common/FormControls/FormSelect";
import { useModuleForm } from "./hooks/useModuleForm";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import "./CreateModuleModal.css";

const MODULE_IMAGE_BUCKET = "modules";
const MODULE_TYPES = [
  { value: 1, label: "Lecture (Bài giảng)" },
  { value: 2, label: "FlashCard (Thẻ ghi nhớ)" },
  { value: 3, label: "Assessment (Bài kiểm tra)" },
];

export default function CreateModuleModal({ show, onClose, onSuccess, lessonId, moduleData, isUpdateMode = false, isAdmin = false }) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    imageUrl,
    setImageUrl,
    setImageTempKey,
    setImageType,
    uploadingImage,
    setUploadingImage,
  } = useModuleForm(show, lessonId, moduleData, isUpdateMode, isAdmin, onSuccess, onClose);

  const hasFormContent = () => {
    return !!(formData.name.trim() || formData.description.trim() || formData.contentType || imageUrl);
  };

  const handleCancel = () => {
    if (hasFormContent() && !isSubmitting) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  };

  const handleImageUploadSuccess = (tempKey, fileType, previewUrl) => {
    setImageTempKey(tempKey);
    setImageType(fileType);
    setImageUrl(previewUrl);
  };

  return (
    <>
      <Modal show={show} onHide={handleCancel} centered className="create-module-modal modal-modern" dialogClassName="create-module-modal-dialog">
        <Modal.Header closeButton={false}>
          <div className="modal-title-custom">
             <FaLayerGroup className="header-icon me-2" />
             {isUpdateMode ? "Cập nhật Bài học" : "Thiết lập Bài học"}
          </div>
          <PremiumCloseButton onClick={handleCancel} />
        </Modal.Header>

        <Modal.Body className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="form-section-card p-3 mb-4">
              <FormInput
                label="Tên bài học"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                placeholder="Ví dụ: Lesson 1 - Daily Routines..."
                required
                maxLength={200}
              />

              <FormTextArea
                label="Mô tả ngắn"
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.description}
                touched={touched.description}
                placeholder="Mô tả nội dung chính của bài học này..."
                maxLength={200}
                rows={3}
              />

              <FormSelect
                label="Loại nội dung"
                name="contentType"
                value={formData.contentType}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.contentType}
                touched={touched.contentType}
                options={MODULE_TYPES}
                required={!isUpdateMode}
                disabled={isUpdateMode}
                placeholder="Chọn loại hình học tập (Video, Bài đọc, FlashCard...)"
              />
            </div>

            <div className="form-section-card p-3">
              <div className="form-section-title mb-3 fw-bold text-primary">
                <FaImage className="me-2" /> Hình ảnh đại diện
              </div>
              <FileUpload
                bucket={MODULE_IMAGE_BUCKET}
                accept="image/*"
                maxSize={5}
                existingUrl={imageUrl}
                onUploadSuccess={handleImageUploadSuccess}
                onRemove={() => setImageUrl(null)}
                onUploadingChange={setUploadingImage}
                label={isUpdateMode ? "Thay đổi ảnh bài học" : "Chọn ảnh đại diện cho bài học"}
                hint="Khuyến nghị tỉ lệ 16:9 để hiển thị đẹp nhất."
                previewClassName="course-image-preview"
              />
            </div>

            {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
          </form>
        </Modal.Body>

        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleCancel} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button className="btn-primary-custom px-4" onClick={handleSubmit} disabled={isSubmitting || uploadingImage}>
            {isSubmitting ? "Đang xử lý..." : (isUpdateMode ? "Cập nhật ngay" : "Khởi tạo ngay")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={() => { setShowConfirmCancel(false); onClose(); }}
        title="Xác nhận hủy"
        message="Dữ liệu bài học chưa được lưu. Bạn có chắc chắn muốn thoát không?"
        confirmText="Đóng cửa sổ"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}
