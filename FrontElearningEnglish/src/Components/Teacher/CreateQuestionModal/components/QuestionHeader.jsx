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
                                    {type.DisplayName || type.displayName || type.Name || type.name}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value={String(QUESTION_TYPES.MultipleChoice)}>Trắc nghiệm (1 đáp án)</option>
                                <option value={String(QUESTION_TYPES.MultipleAnswers)}>Trắc nghiệm (Nhiều đáp án)</option>
                                <option value={String(QUESTION_TYPES.TrueFalse)}>Đúng / Sai</option>
                                <option value={String(QUESTION_TYPES.FillBlank)}>Điền từ (Fill in blanks)</option>
                                <option value={String(QUESTION_TYPES.Matching)}>Nối từ (Matching)</option>
                                <option value={String(QUESTION_TYPES.Ordering)}>Sắp xếp (Ordering)</option>
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
                            className="fw-bold bg-light border-0 focus-white text-center"
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
                            placeholder="10"
                        />
                        {qTouched.points && qErrors.points && <Form.Control.Feedback type="invalid">{qErrors.points}</Form.Control.Feedback>}
                    </InputGroup>
                </Form.Group>
            </Col>
        </Row>
      </div>
    </div>
  );
};

export default QuestionHeader;
