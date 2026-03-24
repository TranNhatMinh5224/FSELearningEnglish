import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FaGraduationCap, FaImage, FaBook, FaBold, FaItalic, FaHeading, FaListUl, FaCode } from "react-icons/fa";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import FormInput from "../../Common/FormControls/FormInput";
import FormTextArea from "../../Common/FormControls/FormTextArea";
import { useCourseForm } from "./hooks/useCourseForm";
import "./CreateCourseModal.css";

const COURSE_IMAGE_BUCKET = "courses";

export default function CreateCourseModal({ show, onClose, onSuccess, courseData, isUpdateMode = false }) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    textAreaRef,
    insertMarkdown,
    maxStudent,
    loadingPackage,
    imageUrl,
    setImageUrl,
    setImageTempKey,
    setImageType,
    uploadingImage,
    setUploadingImage,
  } = useCourseForm(show, isUpdateMode, courseData, onSuccess, onClose);

  const hasFormData = () => {
    if (isUpdateMode && courseData) {
      const originalTitle = courseData.title || courseData.Title || "";
      const originalDescription = courseData.description || courseData.Description || "";
      return formData.title !== originalTitle || formData.description !== originalDescription || !!imageUrl;
    }
    return formData.title.trim() !== "" || formData.description.trim() !== "" || !!imageUrl;
  };

  const handleClose = () => {
    if (hasFormData() && !isSubmitting) {
      setShowConfirmClose(true);
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
      <Modal
        show={show}
        onHide={handleClose}
        centered
        className="create-course-modal modal-modern"
        dialogClassName="create-course-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{isUpdateMode ? "Cập nhật lớp học" : "Tạo lớp học mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="create-course-modal-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="form-section-card p-3 mb-4">
              <div className="form-section-title mb-3 fw-bold text-primary">
                <FaGraduationCap className="me-2" /> Thông tin cơ bản
              </div>
              
              <FormInput
                label="Tiêu đề lớp học"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.title}
                touched={touched.title}
                placeholder="Ví dụ: Tiếng Anh giao tiếp cấp tốc..."
                required
                maxLength={200}
              />

              <FormInput
                label="Số học viên tối đa"
                name="maxStudent"
                value={maxStudent}
                readOnly
                disabled
                hint={loadingPackage ? "Đang kiểm tra gói của bạn..." : "Giá trị này được tính tự động từ gói giáo viên của bạn."}
                placeholder="Đang tải..."
              />
            </div>

            <div className="form-section-card p-3 mb-4">
              <div className="form-section-title mb-3 fw-bold text-primary">
                <FaBook className="me-2" /> Mô tả chi tiết
              </div>
              <div className="markdown-toolbar mb-0 border-bottom-0 w-100">
                <button type="button" className="toolbar-btn" onClick={() => insertMarkdown('bold')} title="In đậm"><FaBold /></button>
                <button type="button" className="toolbar-btn" onClick={() => insertMarkdown('italic')} title="In nghiêng"><FaItalic /></button>
                <button type="button" className="toolbar-btn" onClick={() => insertMarkdown('heading')} title="Tiêu đề"><FaHeading /></button>
                <button type="button" className="toolbar-btn" onClick={() => insertMarkdown('list')} title="Danh sách"><FaListUl /></button>
                <button type="button" className="toolbar-btn" onClick={() => insertMarkdown('code')} title="Mã code"><FaCode /></button>
              </div>
              <FormTextArea
                label=""
                name="description"
                ref={textAreaRef}
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.description}
                touched={touched.description}
                placeholder="Sử dụng Markdown để viết mô tả chi tiết và sinh động hơn..."
                required
                maxLength={2000}
                showMarkdownPreview={true}
                rows={12}
              />
            </div>

            <div className="form-section-card p-3">
              <div className="form-section-title mb-3 fw-bold text-primary">
                <FaImage className="me-2" /> Hình ảnh đại diện
              </div>
              <FileUpload
                bucket={COURSE_IMAGE_BUCKET}
                accept="image/*"
                maxSize={5}
                existingUrl={imageUrl}
                onUploadSuccess={handleImageUploadSuccess}
                onRemove={() => setImageUrl(null)}
                onUploadingChange={setUploadingImage}
                label={isUpdateMode ? "Thay đổi ảnh lớp học" : "Chọn ảnh đại diện cho lớp học"}
              />
            </div>

            {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
          </form>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            className="btn-primary-custom px-4"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingImage}
          >
            {isSubmitting ? (isUpdateMode ? "Đang xử lý..." : "Đang tạo...") : (isUpdateMode ? "Lưu thay đổi" : "Tạo lớp học")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={() => { setShowConfirmClose(false); onClose(); }}
        title="Xác nhận thoát"
        message="Dữ liệu bạn vừa nhập chưa được lưu. Bạn có chắc chắn muốn rời đi không?"
        confirmText="Đóng cửa sổ"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}
