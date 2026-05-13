import React from "react";
import { Row, Col, Form, Badge } from "react-bootstrap";
import { FaFileAlt, FaVideo, FaInfoCircle, FaMarkdown } from "react-icons/fa";
import QuestionMediaSection from "./QuestionMediaSection";

const QuestionContent = ({ 
  qFormData, 
  setQFormData, 
  qTouched, 
  qErrors, 
  handleQBlur, 
  QUESTION_TYPES,
  mediaProps 
}) => {
  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="form-section-header bg-light p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="d-flex align-items-center gap-2">
                <FaFileAlt className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">Nội dung & Media</span>
            </div>
            <div className="d-flex gap-2">
                <Badge bg="info" className="fw-medium">Markdown</Badge>
                <Badge bg={qFormData.stemText.length > 1500 ? "danger" : "secondary"} className="fw-medium">
                    {qFormData.stemText.length}/2000
                </Badge>
            </div>
        </div>
        <div className="p-4">
            <Row className="g-4">
                <Col lg={7}>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Nội dung câu hỏi <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={6}
                            className="border-0 bg-light focus-white font-monospace"
                            value={qFormData.stemText}
                            isInvalid={qTouched.stemText && !!qErrors.stemText}
                            onChange={(e) => {
                                setQFormData({ ...qFormData, stemText: e.target.value });
                            }}
                            onBlur={() => handleQBlur("stemText")}
                            placeholder={qFormData.type === QUESTION_TYPES.FillBlank ? "Ví dụ: Hanoi is the [capital] of Vietnam." : "Nhập nội dung câu hỏi..."}
                            maxLength={2000}
                        />
                        {qTouched.stemText && qErrors.stemText && <Form.Control.Feedback type="invalid">{qErrors.stemText}</Form.Control.Feedback>}
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label className="fw-bold text-muted small text-uppercase mb-2">
                            <FaInfoCircle className="me-1 text-info" /> Giải thích đáp án (Tùy chọn)
                        </Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            className="border-0 bg-light focus-white"
                            value={qFormData.explanation} 
                            onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })} 
                            placeholder="Giải thích vì sao đáp án này đúng để hỗ trợ học sinh..."
                        />
                    </Form.Group>
                </Col>
                <Col lg={5}>
                    <div className="media-upload-container h-100 p-3 bg-light rounded-4 border">
                        <div className="fw-bold text-muted small text-uppercase mb-3 d-flex align-items-center">
                            <FaVideo className="me-2 text-danger" /> Media đính kèm
                        </div>
                        <QuestionMediaSection {...mediaProps} qErrors={qErrors} />
                        <div className="mt-3 small text-muted italic text-center">
                            * Hình ảnh, Video hoặc Âm thanh.
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    </div>
  );
};

export default QuestionContent;
