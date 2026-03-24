import React, { useState } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { FaInfoCircle, FaClock, FaCalendarAlt, FaCog, FaListOl } from "react-icons/fa";
import DateTimePicker from "../DateTimePicker/DateTimePicker";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import FormInput from "../../Common/FormControls/FormInput";
import FormTextArea from "../../Common/FormControls/FormTextArea";
import FormSelect from "../../Common/FormControls/FormSelect";
import { useQuizForm } from "./hooks/useQuizForm";
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
        className="create-quiz-modal modal-modern"
        dialogClassName="create-quiz-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{quizToUpdate ? "Cập nhật Quiz" : "Tạo Quiz mới"}</Modal.Title>
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
                    <FormSelect
                      label="Trạng thái"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={quizStatusOptions}
                      loading={enumsLoading}
                      required
                    />
                  </Col>
                </Row>
              </div>

              {/* SECTION 3: SCORING */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaListOl className="me-2" /> Điểm số & Câu hỏi
                </div>
                <Row className="g-3">
                  <Col md={4}>
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
                  <Col md={4}>
                    <FormInput
                      label="Thang điểm tối đa"
                      name="totalPossibleScore"
                      type="number"
                      value={formData.totalPossibleScore}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.totalPossibleScore}
                      touched={touched.totalPossibleScore}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <FormInput
                      label="Điểm đạt (Passing)"
                      name="passingScore"
                      type="number"
                      value={formData.passingScore}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.passingScore}
                      touched={touched.passingScore}
                      hint="Không bắt buộc"
                    />
                  </Col>
                </Row>
              </div>

              {/* SECTION 4: TIME & SETTINGS */}
              <div className="form-section-card p-3 mb-4">
                <div className="form-section-title mb-3 fw-bold text-primary">
                  <FaClock className="me-2" /> Cài đặt thời gian
                </div>
                <Row className="g-3">
                  <Col md={12}>
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
