import React from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaTrash, FaPlus, FaCheckSquare } from "react-icons/fa";

const MCQFields = ({ qFormData, handleOptionChange, removeOption, addOption, QUESTION_TYPES }) => {
  const isMultipleAnswers = qFormData.type === QUESTION_TYPES?.MultipleAnswers;
  const isTrueFalse = qFormData.type === QUESTION_TYPES?.TrueFalse;

  const options = qFormData.options || [];

  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden" style={{ maxWidth: '100%' }}>
        <div className="form-section-header bg-light p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="d-flex align-items-center gap-2">
                <FaCheckSquare className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">
                    {isTrueFalse ? "Thiết lập Đúng / Sai" : isMultipleAnswers ? "Danh sách đáp án (Nhiều)" : "Danh sách đáp án (Duy nhất)"}
                </span>
            </div>
            <Badge bg="primary" className="rounded-pill px-3">
                {options.length} đáp án
            </Badge>
        </div>
        <div className="p-3">
            {options.length === 0 ? (
                <div className="text-center py-4 text-muted small border border-dashed rounded-3 bg-light bg-opacity-50">
                    Chưa có đáp án nào. Vui lòng bấm nút "Thêm lựa chọn" bên dưới.
                </div>
            ) : (
                <div className="options-grid">
                    <Row className="g-2">
                        {options.map((option, index) => (
                            <Col md={6} key={`option-${index}`}>
                                <div className={`option-item d-flex align-items-center gap-2 p-2 rounded-3 border ${option.isCorrect ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-light border-light'}`}>
                                    <Form.Check
                                        type={isMultipleAnswers ? "checkbox" : "radio"}
                                        name="correctAnswer"
                                        checked={option.isCorrect}
                                        onChange={(e) => handleOptionChange(index, "isCorrect", e.target.checked)}
                                        className="ms-1"
                                        id={`check-${index}`}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={option.text || ""}
                                        onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                                        placeholder={isTrueFalse ? (index === 0 ? "True" : "False") : `Nhập đáp án ${index + 1}...`}
                                        className="border-0 shadow-none fw-medium bg-transparent p-1 small"
                                        style={{ fontSize: 'var(--font-size-sm)' }}
                                    />
                                    {!isTrueFalse && (
                                        <Button
                                            variant="link"
                                            className="text-danger p-0 border-0 ms-auto opacity-50 hover-opacity-100"
                                            onClick={() => removeOption(index)}
                                            disabled={options.length <= 2}
                                        >
                                            <FaTrash size={14} />
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <div className="text-center mt-3">
                {!isTrueFalse && (
                    <Button
                        variant="outline-primary"
                        className="rounded-pill px-3 py-1 btn-sm fw-bold hover-lift"
                        onClick={addOption}
                        disabled={options.length >= 8}
                    >
                        <FaPlus className="me-1" size={12} /> Thêm lựa chọn
                    </Button>
                )}
            </div>
        </div>
    </div>
  );
};

export default MCQFields;
