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
  setInternalGroupId
}) => {
  const QUIZ_GROUP_BUCKET = "quizgroups";

  return (
    <div className="p-1">
        {/* Existing Group Status */}
        {internalGroupId && (
            <div className="alert alert-success py-3 mb-4 d-flex justify-content-between align-items-center shadow-sm border-0 group-active-banner">
                <div className="d-flex align-items-center">
                    <div className="icon-circle bg-success text-white me-3">
                        <FaLayerGroup />
                    </div>
                    <div>
                        <div className="small text-success-emphasis fw-bold text-uppercase">Đang làm việc với nhóm</div>
                        <strong className="fs-5">{groupInfo?.title || groupInfo?.name || `Group #${internalGroupId}`}</strong>
                    </div>
                </div>
                <Button 
                    variant="link" 
                    className="text-danger text-decoration-none hover-scale"
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
            <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
              <div className="form-section-header bg-light p-3 d-flex align-items-center gap-2 border-bottom">
                <FaFileAlt className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">Thông tin cơ bản Nhóm câu hỏi</span>
              </div>
              <div className="p-4">
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Tiêu đề nhóm <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                    type="text"
                    size="lg"
                    className="border-0 bg-light focus-white"
                    style={{ fontSize: '1.2rem', fontWeight: '500' }}
                    value={gFormData.title || ""}
                    onChange={(e) => setGFormData({ ...gFormData, title: e.target.value })}
                    onBlur={() => handleGBlur("title")}
                    isInvalid={gTouched.title && !!gErrors.title}
                    placeholder="Ví dụ: Reading Passage 1, Listening Part A..."
                    />
                    <Form.Control.Feedback type="invalid">{gErrors.title}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="fw-bold text-muted small text-uppercase mb-0">Nội dung / Ngữ cảnh</Form.Label>
                        <Badge bg="info" className="fw-medium"><FaEdit className="me-1" /> Hỗ trợ Markdown</Badge>
                    </div>
                    <Form.Control
                    as="textarea"
                    rows={10}
                    className="border-0 bg-light focus-white font-monospace"
                    value={gFormData.content || ""}
                    onChange={(e) => setGFormData({ ...gFormData, content: e.target.value })}
                    placeholder="Nhập nội dung văn bản đọc, lời thoại nghe hoặc hướng dẫn chung..."
                    />
                </Form.Group>
              </div>
            </div>

            {/* Media Resources Card */}
            <div className="form-section-card shadow-sm border-0 overflow-hidden">
                <div className="form-section-header bg-light p-3 d-flex align-items-center gap-2 border-bottom">
                    <FaVideo className="text-info fs-5" /> 
                    <span className="fw-bold text-dark">Tài liệu Media đính kèm (Âm thanh, Hình ảnh, Video)</span>
                </div>
                <div className="p-4">
                    <Row className="g-4">
                        <Col md={12}>
                            <div className="media-upload-wrapper p-3 bg-light rounded-4">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaImage className="me-2 text-primary" /> Hình ảnh minh họa
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="image/*"
                                    maxSize={5}
                                    existingUrl={gMedia.image.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('image')}
                                    label="Chọn ảnh nhóm"
                                    hint="Định dạng: JPG, PNG, WEBP (Max 5MB)"
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="media-upload-wrapper p-3 bg-light rounded-4 h-100">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaMusic className="me-2 text-info" /> Âm thanh (Audio)
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="audio/*"
                                    maxSize={50}
                                    existingUrl={gMedia.audio.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('audio')}
                                    label="Chọn Audio"
                                    hint="Định dạng: MP3, WAV (Max 50MB)"
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="media-upload-wrapper p-3 bg-light rounded-4 h-100">
                                <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                                    <FaVideo className="me-2 text-danger" /> Video bài giảng
                                </div>
                                <FileUpload
                                    bucket={QUIZ_GROUP_BUCKET}
                                    accept="video/*"
                                    maxSize={100}
                                    existingUrl={gMedia.video.preview}
                                    onUploadSuccess={handleGMediaChange}
                                    onRemove={() => handleRemoveMedia('video')}
                                    label="Chọn Video"
                                    hint="Định dạng: MP4, WEBM (Max 100MB)"
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
              <div className="form-section-card shadow-lg border-0 overflow-hidden action-card-raised">
                <div className="p-4 text-center">
                    <div className="action-icon-circle bg-primary text-white mx-auto mb-3 shadow">
                        <FaTrophy />
                    </div>
                    <h5 className="fw-bold mb-2">Hành động Nhóm</h5>
                    <p className="text-muted small mb-4 px-3">
                        Tạo nhóm câu hỏi trước để cung cấp ngữ cảnh chung (Bài đọc/Nghe), sau đó bạn có thể thêm các câu hỏi lẻ vào bên trong.
                    </p>

                    <div className="points-setup mb-4 p-3 bg-primary-subtle rounded-4 border border-primary-subtle">
                        <Form.Label className="fw-bold text-primary small text-uppercase mb-2 d-block">Điểm mục tiêu của nhóm</Form.Label>
                        <Form.Control
                            type="number"
                            size="lg"
                            className="text-center border-0 bg-white"
                            style={{ fontSize: '1.2rem', fontWeight: '600' }}
                            value={gFormData.sumScore || ""}
                            onChange={(e) => setGFormData({ ...gFormData, sumScore: e.target.value })}
                            placeholder="0.0"
                        />
                    </div>
                    
                    <div className="d-grid gap-3">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={handleGroupSubmit}
                            disabled={gLoading}
                            className="py-3 fw-bold rounded-pill shadow-primary hover-lift"
                        >
                        {gLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang xử lý...</>
                        ) : (internalGroupId ? "Cập nhật Nhóm" : "Tạo Nhóm Câu Hỏi")}
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            className="rounded-pill border-2 fw-bold" 
                            onClick={handleClose}
                        >
                        Hủy bỏ
                        </Button>
                    </div>
                </div>

                {internalGroupId && (
                    <div className="bg-light p-3 border-top text-start">
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <div className="dot-pulse"></div>
                            <span className="small fw-bold text-primary">Trạng thái: Đang hoạt động</span>
                        </div>
                        <small className="text-muted d-block">
                            Hãy chuyển sang tab <strong>Câu hỏi</strong> để bắt đầu thêm nội dung.
                        </small>
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
