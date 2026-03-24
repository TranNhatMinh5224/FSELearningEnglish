import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import QuestionMediaSection from "./QuestionMediaSection";

const QuestionContent = ({ 
  qFormData, 
  setQFormData, 
  qTouched, 
  qErrors, 
  handleQBlur, 
  QUESTION_TYPES,
  mediaProps // Contains preview, type, handlers for media
}) => {
  return (
    <Row>
      <Col md={7}>
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="mb-0">Nội dung câu hỏi <span className="text-danger">*</span></Form.Label>
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
              // We should probably clear error here too if we want better UX
            }}
            onBlur={() => handleQBlur("stemText")}
            placeholder={qFormData.type === QUESTION_TYPES.FillBlank ? "Ví dụ: Hanoi is the [capital] of Vietnam." : "Nhập câu hỏi..."}
            maxLength={2000}
          />
          {qTouched.stemText && qErrors.stemText && <Form.Control.Feedback type="invalid">{qErrors.stemText}</Form.Control.Feedback>}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Giải thích (Optional)</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={2} 
            value={qFormData.explanation} 
            onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })} 
          />
        </Form.Group>
      </Col>
      <Col md={5}>
        <QuestionMediaSection {...mediaProps} qErrors={qErrors} />
      </Col>
    </Row>
  );
};

export default QuestionContent;
