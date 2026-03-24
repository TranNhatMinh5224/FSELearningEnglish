import React from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FaLayerGroup, FaPlus, FaTimes } from "react-icons/fa";

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
    <div className="p-4 border-top">
      <div className="alert alert-light border shadow-sm mb-4">
        <h6 className="alert-heading fw-bold">
          <FaLayerGroup className="me-2" />
          Tạo Group mới
        </h6>
        <p className="mb-0 small text-muted">
          Tạo một nhóm câu hỏi (ví dụ: Bài đọc hiểu, Bài nghe) sau đó bạn có thể thêm nhiều câu hỏi con vào nhóm này.
        </p>
      </div>

      {gErrors.submit && <div className="alert alert-danger">{gErrors.submit}</div>}

      <Form>
        <Row>
          <Col md={8}>
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

            <Form.Group className="mb-3">
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

            <Form.Group className="mb-3">
              <Form.Label>Nội dung / Đoạn văn / Mô tả</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                value={gFormData.description} 
                onChange={e => setGFormData({ ...gFormData, description: e.target.value })} 
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Tổng điểm nhóm</Form.Label>
              <Form.Control 
                type="number" 
                value={gFormData.sumScore} 
                onChange={e => setGFormData({ ...gFormData, sumScore: e.target.value })} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Media nhóm (Ảnh/Video)</Form.Label>
              <div 
                className={`border p-2 rounded bg-light text-center ${gErrors.media ? 'border-danger' : ''}`} 
                style={{ minHeight: '200px' }}
              >
                {!gMedia.preview ? (
                  <div className="py-5 cursor-pointer" onClick={() => gFileInputRef.current?.click()}>
                    <FaPlus size={24} className="text-muted mb-2 d-block mx-auto" />
                    <span className="text-muted">{gLoading ? "Đang tải..." : "Upload Media"}</span>
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
            </Form.Group>
          </Col>
        </Row>
      </Form>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
        <Button variant="success" onClick={handleGroupSubmit} disabled={gLoading}>
          {gLoading ? "Đang tạo..." : "Tạo Group và Thêm câu hỏi"}
        </Button>
      </div>
    </div>
  );
};

export default GroupTab;
