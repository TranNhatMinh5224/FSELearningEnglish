import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash, FaPlus, FaCheckSquare } from "react-icons/fa";
import { QUESTION_TYPES } from "../../hooks/useQuestionForm";

const MCQFields = ({ qFormData, handleOptionChange, removeOption, addOption }) => {
  const isMultipleAnswers = qFormData.type === QUESTION_TYPES.MultipleAnswers;
  const isTrueFalse = qFormData.type === QUESTION_TYPES.TrueFalse;

  return (
    <div className="form-section-card format-section">
      <div className="form-section-title mb-3">
        <FaCheckSquare className="icon-accent" />
        {isTrueFalse ? "Đúng / Sai" : isMultipleAnswers ? "Lựa chọn đáp án (Nhiều)" : "Lựa chọn đáp án (Duy nhất)"}
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
            <Button size="sm" onClick={addOption} className="mt-2 btn-add-item">
              <FaPlus className="me-1" /> Thêm đáp án
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQFields;
