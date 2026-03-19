import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { FaInfoCircle, FaClock, FaCalendarAlt, FaToggleOn } from "react-icons/fa";
import { assessmentService } from "../../../Services/assessmentService";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import SmartDateInput from "../../Common/SmartDateInput/SmartDateInput";
import "./CreateAssessmentModal.css";

export default function CreateAssessmentModal({
  show,
  onClose,
  onSuccess,
  moduleId,
  assessmentData = null,
  isUpdateMode = false,
  isAdmin = false,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openAt, setOpenAt] = useState(null);
  const [dueAt, setDueAt] = useState(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const timeLimit = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  useEffect(() => {
    if (show && isUpdateMode && assessmentData) {
      setTitle(assessmentData.title || assessmentData.Title || "");
      setDescription(assessmentData.description || assessmentData.Description || "");
      setIsPublished(
        assessmentData.isPublished !== undefined
          ? assessmentData.isPublished
          : assessmentData.IsPublished !== undefined
            ? assessmentData.IsPublished
            : false
      );

      const assessmentTimeLimit = assessmentData.timeLimit || assessmentData.TimeLimit || "00:00:00";
      const parts = assessmentTimeLimit.split(":");
      if (parts.length === 3) {
        setHours(parseInt(parts[0], 10) || 0);
        setMinutes(parseInt(parts[1], 10) || 0);
        setSeconds(parseInt(parts[2], 10) || 0);
      }

      const o = assessmentData.openAt || assessmentData.OpenAt;
      const d = assessmentData.dueAt || assessmentData.DueAt;
      setOpenAt(o ? new Date(o) : null);
      setDueAt(d ? new Date(d) : null);
    }
    if (!show) {
      setTitle("");
      setDescription("");
      setOpenAt(null);
      setDueAt(null);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setIsPublished(true);
      setErrors({});
      setSubmitting(false);
      setLoading(false);
      setShowConfirmClose(false);
    }
  }, [show, isUpdateMode, assessmentData]);

  useEffect(() => {
    // keep selects as source of truth for time limit
  }, [hours, minutes, seconds]);

  const hasFormData = () => {
    if (isUpdateMode && assessmentData) {
      const originalTitle = assessmentData.title || assessmentData.Title || "";
      const originalDescription = assessmentData.description || assessmentData.Description || "";
      const originalTimeLimit = assessmentData.timeLimit || assessmentData.TimeLimit || "00:00:00";

      const originalOpenAt = assessmentData.openAt || assessmentData.OpenAt ? new Date(assessmentData.openAt || assessmentData.OpenAt) : null;
      const originalDueAt = assessmentData.dueAt || assessmentData.DueAt ? new Date(assessmentData.dueAt || assessmentData.DueAt) : null;

      const datesChanged =
        (openAt && originalOpenAt && openAt.toDateString() !== originalOpenAt.toDateString()) ||
        (!openAt && originalOpenAt) ||
        (openAt && !originalOpenAt) ||
        (dueAt && originalDueAt && dueAt.toDateString() !== originalDueAt.toDateString()) ||
        (!dueAt && originalDueAt) ||
        (dueAt && !originalDueAt);

      return (
        title.trim() !== originalTitle ||
        (description.trim() || "") !== (originalDescription || "") ||
        hours !== (originalTimeLimit.split(":").length === 3 ? parseInt(originalTimeLimit.split(":")[0], 10) || 0 : 0) ||
        minutes !== (originalTimeLimit.split(":").length === 3 ? parseInt(originalTimeLimit.split(":")[1], 10) || 0 : 0) ||
        seconds !== (originalTimeLimit.split(":").length === 3 ? parseInt(originalTimeLimit.split(":")[2], 10) || 0 : 0) ||
        datesChanged
      );
    }

    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      hours !== 0 ||
      minutes !== 0 ||
      seconds !== 0 ||
      openAt !== null ||
      dueAt !== null
    );
  };

  const handleClose = () => {
    if (submitting) setSubmitting(false);
    if (hasFormData() && !submitting) setShowConfirmClose(true);
    else onClose();
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Tiêu đề là bắt buộc";
    else if (title.trim().length > 255) newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    if (description && description.length > 2000) newErrors.description = "Mô tả không được vượt quá 2000 ký tự";
    if (!openAt) newErrors.openAt = "Thời gian mở là bắt buộc";
    if (!dueAt) newErrors.dueAt = "Thời gian đóng là bắt buộc";
    if (openAt && dueAt && openAt >= dueAt) newErrors.dueAt = "Thời gian đóng phải sau thời gian mở";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // manual time text input removed; use dropdown selects only

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const openAtDate = openAt ? openAt.toISOString() : null;
      const dueAtDate = dueAt ? dueAt.toISOString() : null;
      const submitData = {
        moduleId: parseInt(moduleId, 10),
        title: title.trim(),
        description: description.trim() || null,
        openAt: openAtDate,
        dueAt: dueAtDate,
        timeLimit: timeLimit,
        isPublished,
      };

      let response;
      if (isUpdateMode && assessmentData) {
        const assessmentId = assessmentData.assessmentId || assessmentData.AssessmentId;
        if (!assessmentId) throw new Error("Không tìm thấy ID của Assessment");
        response = isAdmin
          ? await assessmentService.updateAdminAssessment(assessmentId, submitData)
          : await assessmentService.updateAssessment(assessmentId, submitData);
      } else {
        response = isAdmin
          ? await assessmentService.createAdminAssessment(submitData)
          : await assessmentService.createAssessment(submitData);
      }

      if (response.data?.success) {
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || (isUpdateMode ? "Cập nhật Assessment thất bại" : "Tạo Assessment thất bại"));
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra";
      setErrors({ ...errors, submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = title.trim() !== "" && openAt && dueAt;

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        backdrop={submitting ? "static" : true}
        keyboard={!submitting}
        centered
        className="create-assessment-modal modal-modern"
        dialogClassName="create-assessment-modal-dialog"
      >
        <Modal.Header>
          <Modal.Title>{isUpdateMode ? "Cập nhật Assessment" : "Thêm Assessment"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            {/* SECTION 1: GENERAL INFO */}
            <div className="form-section">
              <div className="section-title"><FaInfoCircle /> Thông tin chung</div>

              <div className="form-group">
                <label className="form-label required">Tiêu đề</label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors({ ...errors, title: null });
                  }}
                  placeholder="Nhập tiêu đề Assessment..."
                  maxLength={255}
                  autoFocus
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Mô tả</label>
                <textarea
                  className={`form-control ${errors.description ? "is-invalid" : ""}`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors({ ...errors, description: null });
                  }}
                  placeholder="Nhập mô tả chi tiết về bài kiểm tra này..."
                  rows={3}
                  maxLength={2000}
                />
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </div>
            </div>

            {/* SECTION 2: TIME SETTINGS */}
            <div className="form-section">
              <div className="section-title"><FaClock /> Cài đặt thời gian</div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <SmartDateInput
                    label="Thời gian mở"
                    required
                    value={openAt}
                    onChange={(d) => {
                      setOpenAt(d);
                      setErrors({ ...errors, openAt: null, dueAt: null });
                    }}
                    minDate={new Date()}
                  />
                  {errors.openAt && <div className="text-danger small mt-1">{errors.openAt}</div>}
                </div>
                <div className="col-md-6">
                  <SmartDateInput
                    label="Thời gian đóng"
                    required
                    value={dueAt}
                    onChange={(d) => {
                      setDueAt(d);
                      setErrors({ ...errors, dueAt: null });
                    }}
                    compareAfter={openAt}
                  />
                  {errors.dueAt && <div className="text-danger small mt-1">{errors.dueAt}</div>}
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label required">Thời gian làm bài</label>
                <div className="time-limit-container">
                  <div className="time-input-group">
                    <select
                      className={`form-control time-select ${errors.timeLimit ? "is-invalid" : ""}`}
                      value={hours}
                      onChange={(e) => {
                        setHours(parseInt(e.target.value, 10));
                        setErrors({ ...errors, timeLimit: null });
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="time-label">giờ</span>
                  </div>
                  <div className="time-input-group">
                    <select
                      className={`form-control time-select ${errors.timeLimit ? "is-invalid" : ""}`}
                      value={minutes}
                      onChange={(e) => {
                        setMinutes(parseInt(e.target.value, 10));
                        setErrors({ ...errors, timeLimit: null });
                      }}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="time-label">phút</span>
                  </div>
                  <div className="time-input-group">
                    <select
                      className={`form-control time-select ${errors.timeLimit ? "is-invalid" : ""}`}
                      value={seconds}
                      onChange={(e) => {
                        setSeconds(parseInt(e.target.value, 10));
                        setErrors({ ...errors, timeLimit: null });
                      }}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="time-label">giây</span>
                  </div>
                </div>
                {errors.timeLimit && <div className="text-danger small mt-1">{errors.timeLimit}</div>}
              </div>
            </div>

            {/* SECTION 3: PUBLISH SETTINGS */}
            <div className="form-section">
              <div className="section-title"><FaToggleOn /> Trạng thái</div>

              <div className="form-group mb-0">
                <div className={`publish-status-container ${isPublished ? "published" : ""}`} onClick={() => setIsPublished(!isPublished)}>
                  <div className={`publish-status-toggle ${isPublished ? "published" : ""}`}>
                    <div className="publish-status-toggle-slider"></div>
                  </div>
                  <div className="publish-status-content">
                    <div className="publish-status-label">{isPublished ? "Đã xuất bản (Công khai)" : "Bản nháp (Riêng tư)"}</div>
                    <div className="publish-status-description">
                      {isPublished
                        ? "Học sinh CÓ THỂ nhìn thấy và làm bài kiểm tra này trong thời gian quy định."
                        : "Học sinh KHÔNG THỂ nhìn thấy bài kiểm tra này."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            className="btn-primary-custom"
            onClick={handleSubmit}
            disabled={submitting || loading}
          >
            {submitting ? (isUpdateMode ? "Đang cập nhật..." : "Đang tạo...") : (isUpdateMode ? "Cập nhật Assessment" : "Tạo Assessment")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showConfirmClose}
        onHide={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message="Bạn có dữ liệu chưa lưu. Bạn có chắc chắn muốn đóng không?"
        confirmText="Đóng"
        cancelText="Tiếp tục chỉnh sửa"
        variant="warning"
      />
    </>
  );
}

