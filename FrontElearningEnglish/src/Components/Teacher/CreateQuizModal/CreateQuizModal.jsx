import React, { useState } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { FaInfoCircle, FaClock, FaCalendarAlt, FaCog, FaListOl } from "react-icons/fa";
import { PiLightningDuotone } from "react-icons/pi";
import DateTimePicker from "../DateTimePicker/DateTimePicker";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import FormInput from "../../Common/FormControls/FormInput";
import FormTextArea from "../../Common/FormControls/FormTextArea";
import FormSelect from "../../Common/FormControls/FormSelect";
import { useQuizForm } from "./hooks/useQuizForm";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import "./CreateQuizModal.css";

export default function CreateQuizModal({ show, onClose, onSuccess, assessmentId, assessment, quizToUpdate = null, isAdmin = false }) {
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
    loadingQuiz,
    enumsLoading,
    maxDurationMinutes,
    quizTypeOptions,
    quizStatusOptions,
    computedScore,
  } = useQuizForm(show, assessmentId, assessment, quizToUpdate, isAdmin, onSuccess, onClose);

  const hasFormData = () => {
    return formData.title.trim() !== "" || formData.description.trim() !== "" || formData.totalQuestions !== "";
  };

  const handleClose = () => {
    if (hasFormData() && !isSubmitting) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        centered
        size="lg"
        className={`create-quiz-modal modal-modern ${isAdmin ? "admin-modal" : "teacher-modal"}`}
        dialogClassName="create-quiz-modal-dialog"
      >
        <Modal.Header closeButton={false}>
          <Modal.Title className="fw-bold modal-title-centered">
            <PiLightningDuotone className="me-2" style={{ fontSize: "2.2rem", verticalAlign: "middle" }} />
            {quizToUpdate ? "Cập nhật Bài Quiz" : "Thiết lập Bài Quiz"}
          </Modal.Title>
          <PremiumCloseButton onClick={handleClose} />
        </Modal.Header>
        <Modal.Body className="p-4">
          {loadingQuiz ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* SECTION 1: GENERAL INFO */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaInfoCircle className="me-2" /> Thông tin cơ bản
                </div>
                
                <FormInput
                  label="Tiêu đề Quiz"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.title}
                  touched={touched.title}
                  placeholder="Nhập tiêu đề Quiz..."
                  required
                  maxLength={200}
                />

                <FormTextArea
                  label="Mô tả"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.description}
                  touched={touched.description}
                  placeholder="Mô tả ngắn gọn về bài Quiz (tùy chọn)..."
                  maxLength={1000}
                  rows={2}
                />

                <FormTextArea
                  label="Hướng dẫn làm bài"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.instructions}
                  touched={touched.instructions}
                  placeholder="Hướng dẫn cho học sinh trước khi bắt đầu..."
                  maxLength={2000}
                  rows={2}
                />
              </div>

              {/* SECTION 2: CONFIGURATION */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaCog className="me-2" /> Cấu hình & Trạng thái
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <FormSelect
                      label="Loại Quiz"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={quizTypeOptions}
                      loading={enumsLoading}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <div className="status-toggle-wrapper">
                      <label className="form-label fw-bold mb-2">Trạng thái Quiz</label>
                      <div className={`status-toggle-card ${formData.status === 1 ? 'status-open' : 'status-closed'}`}>
                        <div className="d-flex align-items-center justify-content-between p-2">
                          <div className="status-info d-flex align-items-center">
                            <div className="status-dot"></div>
                            <span className="status-text fw-bold">
                              {formData.status === 1 ? "Đang mở (Open)" : "Đã đóng (Closed)"}
                            </span>
                          </div>
                          <div className="form-check form-switch m-0 p-0">
                            <input
                              className="form-check-input status-switch"
                              type="checkbox"
                              role="switch"
                              id="quizStatusSwitch"
                              checked={formData.status === 1}
                              onChange={(e) => setFieldValue("status", e.target.checked ? 1 : 2)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-text mt-1">
                        {formData.status === 1 
                          ? "Học sinh có thể bắt đầu làm bài Quiz này." 
                          : "Quiz bị khóa, học sinh không thể truy cập."}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* SECTION 3: SCORING */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaListOl className="me-2" /> Điểm số & Câu hỏi
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <FormInput
                      label="Tổng số câu hỏi"
                      name="totalQuestions"
                      type="number"
                      value={formData.totalQuestions}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.totalQuestions}
                      touched={touched.totalQuestions}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <FormInput
                      label="Điểm đạt (Passing)"
                      name="passingScore"
                      type="text"
                      inputMode="decimal"
                      value={formData.passingScore}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                        if (val.split('.').length <= 2) {
                          setFieldValue("passingScore", val);
                        }
                      }}
                      onBlur={handleBlur}
                      error={errors.passingScore}
                      touched={touched.passingScore}
                      hint="Không bắt buộc. Tính theo thang điểm tự tính của Quiz. Ví dụ: 7 = đạt từ 7 điểm trở lên."
                      hintClassName="text-danger fst-italic"
                    />
                  </Col>
                </Row>
                <div className="text-muted small mt-2">
                  Thang điểm (tự tính theo tổng điểm câu hỏi): <strong>{computedScore ?? 0}</strong>
                </div>
              </div>

              {/* SECTION 4: TIME & SETTINGS */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaClock className="me-2" /> Cài đặt thời gian
                </div>
                <Row className="g-3">
                  <Col md={12}>
                    <div className="duration-presets mb-3">
                      <div className="preset-buttons">
                        {[10, 15, 30, 45, 60, 90, 120].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className={`preset-btn ${Number(formData.duration) === preset ? 'active' : ''}`}
                            onClick={() => setFieldValue("duration", preset)}
                          >
                            {preset} phút
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormInput
                      label="Thời gian làm bài riêng phần Quiz (phút)"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.duration}
                      touched={touched.duration}
                      required
                      hint={maxDurationMinutes > 0 ? `Ví dụ: Điền 45 (Lưu ý: Tổng thời gian toàn bài Assessment hiện tại đang là ${maxDurationMinutes} phút)` : "Ví dụ: Điền 45 phút."}
                    />
                  </Col>
                </Row>
              </div>

              {/* SECTION 5: OPTIONS */}
              <div className="form-section-card p-3">
                <div className="form-section-title mb-3 fw-bold text-primary">Khác</div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="showAnswersAfterSubmit"
                        id="showAnswers"
                        checked={formData.showAnswersAfterSubmit}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="showAnswers">Hiện đáp án sau khi nộp</label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="showScoreImmediately"
                        id="showScore"
                        checked={formData.showScoreImmediately}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="showScore">Hiện điểm ngay lập tức</label>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="shuffleQuestions"
                        id="shuffleQ"
                        checked={formData.shuffleQuestions}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="shuffleQ">Xáo trộn câu hỏi</label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="shuffleAnswers"
                        id="shuffleA"
                        checked={formData.shuffleAnswers}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="shuffleA">Xáo trộn đáp án</label>
                    </div>
                  </Col>
                  <Col md={12}>
                    <FormInput
                      label="Số lần làm tối đa"
                      name="maxAttempts"
                      type="number"
                      value={formData.maxAttempts}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.maxAttempts}
                      touched={touched.maxAttempts}
                      hint="Để trống = Không giới hạn"
                    />
                  </Col>
                </Row>
              </div>

              {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
            </form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            className="btn-primary-custom px-4"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingQuiz}
          >
            {isSubmitting ? "Đang xử lý..." : (quizToUpdate ? "Lưu thay đổi" : "Tạo Quiz")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={() => { setShowConfirmClose(false); onClose(); }}
        title="Xác nhận thoát"
        message="Dữ liệu Quiz chưa được lưu. Bạn có chắc chắn muốn rời đi không?"
        confirmText="Đóng cửa sổ"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}
