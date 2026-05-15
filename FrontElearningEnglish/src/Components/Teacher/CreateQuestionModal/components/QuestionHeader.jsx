import React from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { FaQuestionCircle, FaStar } from "react-icons/fa";

const QuestionHeader = ({ 
  qFormData, 
  handleQTypeChange, 
  handleQBlur, 
  handlePointsChange,
  qTouched, 
  qErrors, 
  questionToUpdate, 
  QUESTION_TYPES,
  backendQuestionTypes = [],
  internalGroupId,
  groupInfo
}) => {
    const getQuestionTypeName = (type) => {
        const name = type.DisplayName || type.displayName || type.Name || type.name || "";
        
        const nameMap = {
            "MultipleChoice": "Multiple Choice (Trắc nghiệm 1 đáp án)",
            "MultipleAnswers": "Multiple Answers (Trắc nghiệm nhiều đáp án)",
            "TrueFalse": "True / False (Đúng / Sai)",
            "FillBlank": "Fill in Blanks (Điền từ)",
            "Matching": "Matching (Nối từ)",
            "Ordering": "Ordering (Sắp xếp)",
            "ShortAnswer": "Short Answer (Trả lời ngắn)",
            "Essay": "Essay (Tự luận)"
        };

        return nameMap[name] || name;
    };

    return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
      <div className="form-section-header bg-light p-3 d-flex align-items-center gap-2 border-bottom">
        <FaQuestionCircle className="text-primary fs-5" /> 
        <span className="fw-bold text-dark">Cấu hình câu hỏi</span>
      </div>
      <div className="p-4">
        <Row className="g-3">
            <Col md={8}>
                <Form.Group>
                    <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Loại câu hỏi <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        size="lg"
                        className="fw-semibold bg-light border-0 focus-white"
                        value={qFormData.type != null ? String(qFormData.type) : ''}
                        onChange={handleQTypeChange}
                        onBlur={() => handleQBlur("type")}
                        isInvalid={qTouched.type && !!qErrors.type}
                        disabled={!!questionToUpdate}
                    >
                        <option value="">-- Chọn loại câu hỏi --</option>
                        {backendQuestionTypes && backendQuestionTypes.length > 0 ? (
                            backendQuestionTypes.map((type) => (
                                <option key={type.Value || type.value} value={String(type.Value || type.value)}>
                                    {getQuestionTypeName(type)}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value={String(QUESTION_TYPES.MultipleChoice)}>Multiple Choice (Trắc nghiệm 1 đáp án)</option>
                                <option value={String(QUESTION_TYPES.MultipleAnswers)}>Multiple Answers (Trắc nghiệm nhiều đáp án)</option>
                                <option value={String(QUESTION_TYPES.TrueFalse)}>True / False (Đúng / Sai)</option>
                                <option value={String(QUESTION_TYPES.FillBlank)}>Fill in Blanks (Điền từ)</option>
                                <option value={String(QUESTION_TYPES.Matching)}>Matching (Nối từ)</option>
                                <option value={String(QUESTION_TYPES.Ordering)}>Ordering (Sắp xếp)</option>
                                <option value={String(QUESTION_TYPES.Essay)}>Essay (Tự luận)</option>
                            </>
                        )}
                    </Form.Select>
                    {qTouched.type && qErrors.type && <Form.Control.Feedback type="invalid">{qErrors.type}</Form.Control.Feedback>}
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group>
                    <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Điểm số <span className="text-danger">*</span></Form.Label>
                    <InputGroup hasValidation size="lg">
                        <InputGroup.Text className="bg-light border-0 accent-icon-color"><FaStar /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            inputMode="decimal"
                            className="fw-bold bg-light border-0 focus-white text-center points-input-red"
                            isInvalid={qTouched.points && !!qErrors.points}
                            value={qFormData.points || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                const normalizedValue = value.replace(/,/g, '.');
                                const numValue = normalizedValue.replace(/[^\d.]/g, '');
                                const parts = numValue.split('.');
                                if (parts.length <= 2) {
                                    handlePointsChange(numValue);
                                }
                            }}
                            onBlur={() => handleQBlur("points")}
                            placeholder="1"
                        />
                        {qTouched.points && qErrors.points && <Form.Control.Feedback type="invalid">{qErrors.points}</Form.Control.Feedback>}
                    </InputGroup>
                    <div className="point-presets d-flex gap-2 mt-2">
                        {[0.1, 0.2, 0.25, 0.45, 0.5, 1, 2, 5].map(p => (
                            <button 
                                key={p}
                                type="button"
                                className={`point-btn ${Number(qFormData.points) === p ? 'active' : ''}`}
                                onClick={() => handlePointsChange(String(p))}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </Form.Group>
            </Col>
        </Row>
      </div>
    </div>
  );
};

export default QuestionHeader;
