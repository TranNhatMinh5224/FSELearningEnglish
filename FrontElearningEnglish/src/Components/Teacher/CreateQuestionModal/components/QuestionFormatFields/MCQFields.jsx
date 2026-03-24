import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash, FaPlus, FaQuestionCircle } from "react-icons/fa";
import { QUESTION_TYPES } from "../../hooks/useQuestionForm";

const MCQFields = ({ qFormData, handleOptionChange, removeOption, addOption }) => {
  const isMultipleAnswers = qFormData.type === QUESTION_TYPES.MultipleAnswers;
  const isTrueFalse = qFormData.type === QUESTION_TYPES.TrueFalse;

  return (
    <div className="form-section-card">
      <div className="form-section-title">
        <FaQuestionCircle className="me-2" />
        {isTrueFalse ? "Đúng / Sai" : isMultipleAnswers ? "Trắc nghiệm (Nhiều đáp án đúng)" : "Trắc nghiệm (1 đáp án đúng)"}
      </div>
      <div className="mt-3">
        <div className="options-grid">
          <Row>
            {qFormData.options.map((option, index) => (
              <Col md={6} key={`option-${index}`} className="mb-3">
                <div className="option-item d-flex align-items-center gap-2">
                  <Form.Check
                    type={isMultipleAnswers ? "checkbox" : "radio"}
                    name="correctAnswer"
                    checked={option.isCorrect}
                    onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)}
                    className="scale-125"
                  />
                  <Form.Control
                    type="text"
                    value={option.text || ""}
                    onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                    placeholder={`Đáp án ${index + 1}`}
                    className="border-0 shadow-none fw-medium"
                    disabled={isTrueFalse}
                  />
                  {!isTrueFalse && (
                    <Button variant="outline-danger" size="sm" className="border-0" onClick={() => removeOption(index)}>
                      <FaTrash />
                    </Button>
                  )}
                </div>
              </Col>
            ))}
          </Row>
          {!isTrueFalse && (
            <Button variant="outline-primary" size="sm" onClick={addOption} className="mt-2">
              <FaPlus className="me-1" /> Thêm đáp án
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQFields;
