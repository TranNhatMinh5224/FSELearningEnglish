import React from "react";
import { Form, Row, Col, Button, Badge } from "react-bootstrap";
import { FaLayerGroup, FaFileAlt, FaVideo, FaImage, FaMusic, FaTrophy, FaTimes, FaEdit } from "react-icons/fa";
import FileUpload from "../../../Common/FileUpload/FileUpload";

const GroupTab = ({
  gFormData, setGFormData,
  gMedia,
  gLoading,
  gErrors = {},
  gTouched = {},
  handleGBlur,
  handleGMediaChange,
  handleRemoveMedia,
  handleGroupSubmit,
  handleClose,
  groupInfo,
  internalGroupId,
  setInternalGroupId,
  bulkQuestionsProps
}) => {
  const QUIZ_GROUP_BUCKET = "quizgroups";
  const { pendingQuestions, createdQuestions } = bulkQuestionsProps || {};

  return (
    <div className="group-tab-container p-4">
        {/* Existing Group Status - Modernized */}
        {internalGroupId && (
            <div className="active-group-banner d-flex justify-content-between align-items-center p-3 mb-4 rounded-4 bg-white border border-success-subtle shadow-sm">
                <div className="d-flex align-items-center">
                    <div className="icon-circle bg-success bg-opacity-10 text-success me-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '45px', height: '45px' }}>
                        <FaLayerGroup size={20} />
                    </div>
                    <div>
                        <div className="text-uppercase text-success fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>Chế độ chỉnh sửa nhóm</div>
                        <h5 className="mb-0 fw-bold text-dark">{groupInfo?.title || groupInfo?.name || `Group #${internalGroupId}`}</h5>
                    </div>
                </div>
                <Button 
                    variant="link" 
                    className="text-danger text-decoration-none p-0 fw-bold small"
                    onClick={() => setInternalGroupId(null)}
                >
                    <FaTimes className="me-1" /> Thoát nhóm
                </Button>
            </div>
        )}

      <Form>
        <Row className="g-4">
          <Col lg={9}>
            {/* Main Info Card */}
            <div className="form-section-card bg-white shadow-sm border rounded-4 mb-4 overflow-hidden">
              <div className="form-section-header bg-light bg-opacity-50 p-3 d-flex align-items-center gap-2 border-bottom">
                <FaFileAlt className="text-primary" /> 
                <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Thông tin cơ bản</span>
              </div>
              <div className="p-4">
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Tiêu đề nhóm <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        size="lg"
                        className="bg-white border-secondary-subtle focus-white fw-bold"
                        style={{ fontSize: '1.25rem', borderRadius: '12px' }}
                        value={gFormData.title || ""}
                        onChange={(e) => setGFormData({ ...gFormData, title: e.target.value })}
                        onBlur={() => handleGBlur("title")}
                        isInvalid={gTouched.title && !!gErrors.title}
                        placeholder="Ví dụ: Reading Passage 1, Listening Part A..."
                    />
                    <Form.Control.Feedback type="invalid">{gErrors.title}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-0">
                    <div className="mb-2">
                        <Form.Label className="fw-bold text-muted small text-uppercase mb-0">Nội dung văn bản / Ngữ cảnh chung</Form.Label>
                    </div>
                    <Form.Control
                        as="textarea"
                        rows={12}
                        className="bg-white border-secondary-subtle focus-white font-monospace p-3"
                        style={{ lineHeight: '1.6', borderRadius: '12px' }}
                        value={gFormData.content || ""}
                        onChange={(e) => setGFormData({ ...gFormData, content: e.target.value })}
                        placeholder="Nhập nội dung văn bản đọc, lời thoại nghe hoặc hướng dẫn chung cho nhóm câu hỏi..."
                    />
                </Form.Group>
              </div>
            </div>

            {/* Media Resources Card */}
            <div className="form-section-card bg-white shadow-sm border rounded-4 overflow-hidden">
                <div className="form-section-header bg-light bg-opacity-50 p-3 d-flex align-items-center gap-2 border-bottom">
                    <FaVideo className="text-info" /> 
                    <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Tài liệu Media đính kèm</span>
                </div>
                <div className="p-4">
                    <Row className="g-4">
                        <Col md={12}>
                            <div className="media-upload-wrapper p-3 border border-dashed rounded-4">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaImage className="me-2 text-primary" /> Hình ảnh minh họa
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="image/*"
                                    maxSize={10}
                                    existingUrl={gMedia.image.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('image')}
                                    label="Chọn ảnh nhóm"
                                    hint="JPG, PNG, WEBP (Max 10MB)"
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="media-upload-wrapper p-3 border border-dashed rounded-4 h-100">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaMusic className="me-2 text-info" /> Âm thanh (Audio)
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="audio/*"
                                    maxSize={300}
                                    existingUrl={gMedia.audio.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('audio')}
                                    label="Chọn Audio"
                                    hint="MP3, WAV (Max 300MB)"
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="media-upload-wrapper p-3 border border-dashed rounded-4 h-100">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaVideo className="me-2 text-danger" /> Video bài giảng
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="video/*"
                                    maxSize={300}
                                    existingUrl={gMedia.video.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('video')}
                                    label="Chọn Video"
                                    hint="MP4, WEBM (Max 300MB)"
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
          </Col>

          <Col lg={3}>
            {/* Action Card */}
            <div className="sticky-top" style={{ top: '1rem' }}>
              <div className="form-section-card bg-white shadow-lg border rounded-4 overflow-hidden action-card-raised">
                <div className="p-4 text-center">
                    <div className="action-icon-circle bg-primary text-white mx-auto mb-3 shadow" style={{ width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                        <FaTrophy className="mx-auto" size={24} />
                    </div>
                    <h5 className="fw-bold mb-2">Hành động</h5>
                    <p className="text-muted small mb-4">
                        Nhóm câu hỏi cung cấp ngữ cảnh chung (Bài đọc/Nghe).
                    </p>

                    <div className="points-setup mb-4 p-3 bg-light rounded-4 border">
                        <Form.Label className="fw-bold text-muted small text-uppercase mb-2 d-block">Điểm mục tiêu của nhóm</Form.Label>
                        <div className="d-flex align-items-baseline justify-content-center gap-1">
                           <Form.Control
                               type="number"
                               size="lg"
                               className="text-center border-0 bg-transparent p-0 text-danger fw-bold"
                               style={{ fontSize: '2rem', width: '100px' }}
                               value={gFormData.sumScore || ""}
                               onChange={(e) => setGFormData({ ...gFormData, sumScore: e.target.value })}
                               placeholder="0.0"
                           />
                           <span className="fw-bold text-danger fs-5">đ</span>
                        </div>
                    </div>
                    
                    <div className="d-grid gap-3">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={handleGroupSubmit}
                            disabled={gLoading}
                            className="btn-primary-custom py-3 fw-bold rounded-pill shadow-primary hover-lift"
                        >
                        {gLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang xử lý...</>
                        ) : (internalGroupId ? "Cập nhật Nhóm" : "Tạo Nhóm")}
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            className="rounded-pill border-2 fw-bold py-2" 
                            onClick={handleClose}
                        >
                        Hủy bỏ
                        </Button>
                    </div>
                </div>

                {internalGroupId && (
                    <div className="bg-light bg-opacity-50 p-4 border-top text-start">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="status-dot-active"></span>
                            <span className="small fw-bold text-primary text-uppercase" style={{ letterSpacing: '0.5px' }}>Trạng thái hoạt động</span>
                        </div>
                        
                        <div className="session-mini-stats bg-white p-3 rounded-4 border shadow-sm mb-2">
                           <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="small text-muted">Hàng đợi:</span>
                              <span className="fw-bold text-warning small">{pendingQuestions?.length || 0} câu</span>
                           </div>
                           <div className="d-flex justify-content-between align-items-center">
                              <span className="small text-muted">Đã tạo:</span>
                              <span className="fw-bold text-success small">{createdQuestions?.length || 0} câu</span>
                           </div>
                        </div>

                        <p className="text-muted mb-0 mt-3" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            Mọi câu hỏi mới bạn tạo sẽ được tự động đưa vào nhóm này. Chuyển sang tab <strong>Câu hỏi</strong> để bắt đầu.
                        </p>
                    </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default GroupTab;
