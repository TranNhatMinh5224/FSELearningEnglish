import React, { useState } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import { FaBook, FaMarkdown, FaBold, FaItalic, FaHeading, FaListUl, FaCode, FaVideo, FaFileAlt, FaSitemap, FaArrowRight } from "react-icons/fa";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import FormInput from "../../Common/FormControls/FormInput";
import FormTextArea from "../../Common/FormControls/FormTextArea";
import FormSelect from "../../Common/FormControls/FormSelect";
import { useLectureForm } from "./hooks/useLectureForm";
import "./CreateLectureModal.css";

const LECTURE_MEDIA_BUCKET = "lectures";

export default function CreateLectureModal({ show, onClose, onSuccess, moduleId, moduleName, lectureToUpdate, isAdmin = false }) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isEditMode,
    textAreaRef,
    insertMarkdown,
    parentLectures,
    loadingDetail,
    setImageTempKey, // This was named mediaTempKey in hook, let's keep consistency or map it
    setMediaTempKey,
    setMediaType,
    setMediaSize,
    duration, setDuration,
    existingMediaUrl,
    setExistingMediaUrl,
    uploadingMedia, setUploadingMedia,
  } = useLectureForm(show, moduleId, lectureToUpdate, isAdmin, onSuccess, onClose);

  const handleClose = () => {
    onClose();
  };

  const getLectureTypeInfo = (type) => {
    switch (parseInt(type)) {
      case 1: return { icon: <FaBook />, label: "Văn bản", color: "#3b82f6" };
      case 2: return { icon: <FaFileAlt />, label: "Tài liệu", color: "#8b5cf6" };
      case 3: return { icon: <FaVideo />, label: "Video", color: "#ef4444" };
      default: return { icon: <FaBook />, label: "Khác", color: "#3b82f6" };
    }
  };

  const handleMediaUploadSuccess = (tempKey, fileType, previewUrl, fileSize, extractedDuration) => {
    setMediaTempKey(tempKey);
    setMediaType(fileType);
    setMediaSize(fileSize);
    if (extractedDuration) setDuration(extractedDuration);
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" className="clm-modal modal-modern" dialogClassName="clm-modal-dialog">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {isEditMode ? "Chỉnh sửa bài giảng" : "Tạo bài giảng mới"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {loadingDetail ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaBook className="me-2" /> Thông tin cơ bản
                </div>
                
                <FormInput
                  label="Tiêu đề bài giảng"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.title}
                  touched={touched.title}
                  placeholder="Nhập tiêu đề bài giảng..."
                  required
                  maxLength={255}
                />

                <div className="mb-4">
                  <label className="form-label-custom">Loại bài giảng</label>
                  <div className="d-flex gap-3 flex-wrap">
                    {[1, 2, 3].map((type) => {
                      const info = getLectureTypeInfo(type);
                      const isSelected = parseInt(formData.lectureType) === type;
                      return (
                        <div
                          key={type}
                          className={`clm-type-card ${isSelected ? 'selected active-type' : ''}`}
                          onClick={() => setFieldValue("lectureType", type)}
                          style={{ borderColor: isSelected ? info.color : undefined }}
                        >
                          <div className="clm-type-icon" style={{ color: info.color }}>{info.icon}</div>
                          <div className="clm-type-label fw-bold">{info.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {parseInt(formData.lectureType) === 1 && (
                <div className="form-section-card p-3 mb-4">
                  <div className="form-section-title mb-3 fw-bold text-primary">
                    <FaMarkdown className="me-2" /> Nội dung văn bản (Markdown)
                  </div>
                  <div className="clm-markdown-toolbar mb-2">
                    <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('bold')} title="In đậm"><FaBold /></button>
                    <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('italic')} title="In nghiêng"><FaItalic /></button>
                    <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('heading')} title="Tiêu đề"><FaHeading /></button>
                    <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('list')} title="Danh sách"><FaListUl /></button>
                    <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('code')} title="Mã code"><FaCode /></button>
                  </div>
                  <FormTextArea
                    name="markdownContent"
                    value={formData.markdownContent}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.markdownContent}
                    touched={touched.markdownContent}
                    placeholder="Viết nội dung bài giảng tại đây..."
                    showMarkdownPreview={true}
                    rows={12}
                  />
                </div>
              )}

              {(parseInt(formData.lectureType) === 2 || parseInt(formData.lectureType) === 3) && (
                <div className="form-section-card p-3 mb-4">
                  <div className="form-section-title mb-3 fw-bold text-primary">
                    {parseInt(formData.lectureType) === 2 ? <FaFileAlt className="me-2" /> : <FaVideo className="me-2" />} 
                    Tệp đính kèm
                  </div>
                  <FileUpload
                    bucket={LECTURE_MEDIA_BUCKET}
                    accept={parseInt(formData.lectureType) === 3 ? "video/*" : ".pdf,.doc,.docx,.txt"}
                    maxSize={parseInt(formData.lectureType) === 3 ? 100 : 10}
                    existingUrl={existingMediaUrl}
                    onUploadSuccess={handleMediaUploadSuccess}
                    onRemove={() => setExistingMediaUrl(null)}
                    onUploadingChange={setUploadingMedia}
                    label="Tải tệp tin lên"
                  />
                  {duration && parseInt(formData.lectureType) === 3 && (
                    <div className="mt-2 text-muted small">Thời lượng: {Math.floor(duration/60)}:{(duration%60).toString().padStart(2,'0')}</div>
                  )}
                </div>
              )}

              <div className="form-section-card p-3">
                <div className="form-section-title mb-3 fw-bold text-primary">Cài đặt nâng cao</div>
                <FormSelect
                  label="Bài giảng cha (Cấp bậc)"
                  name="parentLectureId"
                  value={formData.parentLectureId || ""}
                  onChange={handleChange}
                  options={parentLectures.map(l => ({ value: l.lectureId || l.LectureId, label: l.title || l.Title }))}
                  placeholder="-- Là bài giảng gốc --"
                />
              </div>

              {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
            </form>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button className="btn-primary-custom px-4" onClick={handleSubmit} disabled={isSubmitting || uploadingMedia}>
            {isSubmitting ? "Đang xử lý..." : (isEditMode ? "Lưu thay đổi" : "Tạo bài giảng")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
