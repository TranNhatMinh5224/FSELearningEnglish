import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { FaFileAlt, FaVideo, FaInfoCircle } from "react-icons/fa";
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
    <Row>
      <Col md={7}>
        <div className="form-section-card content-section mb-4">
          <div className="form-section-title mb-3">
            <FaFileAlt className="icon-accent" /> Nội dung câu hỏi
          </div>
          <Form.Group className="mb-0">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="mb-0">Câu hỏi <span className="text-danger">*</span></Form.Label>
              <span className={`small ${qFormData.stemText.length > 2000 ? "text-danger fw-bold" : "text-muted"}`}>
                {qFormData.stemText.length}/2000
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              value={qFormData.stemText}
              isInvalid={qTouched.stemText && !!qErrors.stemText}
              onChange={(e) => {
                setQFormData({ ...qFormData, stemText: e.target.value });
              }}
              onBlur={() => handleQBlur("stemText")}
              placeholder={qFormData.type === QUESTION_TYPES.FillBlank ? "Ví dụ: Hanoi is the [capital] of Vietnam." : "Nhập câu hỏi..."}
              maxLength={2000}
            />
            {qTouched.stemText && qErrors.stemText && <Form.Control.Feedback type="invalid">{qErrors.stemText}</Form.Control.Feedback>}
          </Form.Group>
        </div>

        <div className="form-section-card explanation-section">
          <div className="form-section-title mb-3">
            <FaInfoCircle className="icon-accent" /> Giải thích
          </div>
          <Form.Group className="mb-0">
            <Form.Control 
              as="textarea" 
              rows={2} 
              value={qFormData.explanation} 
              onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })} 
              placeholder="Nhập giải thích cho đáp án đúng (không bắt buộc)..."
            />
          </Form.Group>
        </div>
      </Col>
      <Col md={5}>
        <div className="form-section-card media-section h-100">
          <div className="form-section-title mb-3">
            <FaVideo className="icon-accent" /> Media đính kèm
          </div>
          <QuestionMediaSection {...mediaProps} qErrors={qErrors} />
        </div>
      </Col>
    </Row>
  );
};

export default QuestionContent;
