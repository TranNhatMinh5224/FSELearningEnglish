import React from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FaLayerGroup, FaPlus, FaTimes, FaSave, FaFileAlt, FaVideo, FaTrophy } from "react-icons/fa";

const GroupTab = ({
  gFormData, setGFormData,
  gMedia, setGMedia,
  gLoading,
  gErrors,
  gTouched,
  gFileInputRef,
  handleGBlur,
  handleGMediaChange,
  handleGroupSubmit,
  handleClose
}) => {
  return (
    <div className="p-4 border-top bg-light/30">
      <div className="alert alert-info border shadow-sm mb-4 info-section" style={{ borderLeftWidth: '4px' }}>
        <h6 className="alert-heading fw-bold d-flex align-items-center">
          <FaLayerGroup className="me-2" />
          Tạo Group mới
        </h6>
        <p className="mb-0 small">
          Tạo một nhóm câu hỏi (ví dụ: Bài đọc hiểu, Bài nghe) sau đó bạn có thể thêm nhiều câu hỏi con vào nhóm này.
        </p>
      </div>

      {gErrors.submit && <div className="alert alert-danger">{gErrors.submit}</div>}

      <Form>
        <Row>
          <Col md={8}>
            <div className="form-section-card content-section mb-4">
              <div className="form-section-title mb-3">
                <FaFileAlt className="icon-accent" /> Thông tin nhóm
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="required">Tên nhóm (Mã định danh)</Form.Label>
                <Form.Control
                  type="text"
                  value={gFormData.name}
                  isInvalid={gTouched.name && !!gErrors.name}
                  onChange={e => {
                    setGFormData({ ...gFormData, name: e.target.value });
                  }}
                  onBlur={() => handleGBlur("name")}
                  placeholder="VD: Reading Passage 1"
                />
                {gTouched.name && gErrors.name && <Form.Control.Feedback type="invalid">{gErrors.name}</Form.Control.Feedback>}
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label className="required">Tiêu đề hiển thị</Form.Label>
                <Form.Control
                  type="text"
                  value={gFormData.title}
                  isInvalid={gTouched.title && !!gErrors.title}
                  onChange={e => {
                    setGFormData({ ...gFormData, title: e.target.value });
                  }}
                  onBlur={() => handleGBlur("title")}
                  placeholder="VD: Đọc đoạn văn sau và trả lời câu hỏi..."
                />
                {gTouched.title && gErrors.title && <Form.Control.Feedback type="invalid">{gErrors.title}</Form.Control.Feedback>}
              </Form.Group>
            </div>

            <div className="form-section-card explanation-section">
              <div className="form-section-title mb-3">
                <FaFileAlt className="icon-accent" /> Nội dung / Đoạn văn / Mô tả
              </div>
              <Form.Group className="mb-0">
                <Form.Control 
                  as="textarea" 
                  rows={6} 
                  value={gFormData.description} 
                  onChange={e => setGFormData({ ...gFormData, description: e.target.value })} 
                  placeholder="Nhập nội dung đoạn văn hoặc mô tả cho nhóm câu hỏi này..."
                />
              </Form.Group>
            </div>
          </Col>

          <Col md={4}>
            <div className="form-section-card info-section mb-4">
              <div className="form-section-title mb-3">
                <FaTrophy className="icon-accent" /> Điểm số
              </div>
              <Form.Group className="mb-0">
                <Form.Label>Tổng điểm nhóm</Form.Label>
                <Form.Control 
                  type="text" 
                  inputMode="decimal"
                  value={gFormData.sumScore} 
                  onChange={e => {
                    const val = e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                    if (val.split('.').length <= 2) {
                      setGFormData({ ...gFormData, sumScore: val });
                    }
                  }} 
                  placeholder="0"
                />
              </Form.Group>
            </div>

            <div className="form-section-card media-section">
              <div className="form-section-title mb-3">
                <FaVideo className="icon-accent" /> Media nhóm
              </div>
              <div 
                className={`border p-2 rounded bg-light text-center ${gErrors.media ? 'border-danger' : ''}`} 
                style={{ minHeight: '200px' }}
              >
                {!gMedia.preview ? (
                  <div className="py-5 cursor-pointer media-upload-trigger" onClick={() => gFileInputRef.current?.click()}>
                    <FaPlus size={24} className="mb-2 d-block mx-auto upload-icon" />
                    <span className="small label-text">{gLoading ? "Đang tải..." : "Upload Media"}</span>
                  </div>
                ) : (
                  <div className="position-relative">
                    {gMedia.type === 'image' && <img src={gMedia.preview} alt="Preview" className="img-fluid rounded" />}
                    {gMedia.type === 'video' && <video src={gMedia.preview} controls style={{ width: '100%' }} />}
                    <Button 
                      variant="danger" size="sm" 
                      className="position-absolute top-0 end-0 m-1" 
                      onClick={() => setGMedia({ preview: null, tempKey: null, type: null, duration: null })}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                )}
                <input type="file" ref={gFileInputRef} onChange={handleGMediaChange} style={{ display: 'none' }} accept="image/*,video/*" />
              </div>
              {gErrors.media && <div className="text-danger small mt-1">{gErrors.media}</div>}
            </div>
          </Col>
        </Row>
      </Form>

      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose}>Hủy bỏ</Button>
        <Button className="btn-primary-custom" onClick={handleGroupSubmit} disabled={gLoading}>
          {gLoading ? "Đang tạo..." : "Tạo Group và Thêm câu hỏi"}
        </Button>
      </div>
    </div>
  );
};

export default GroupTab;
