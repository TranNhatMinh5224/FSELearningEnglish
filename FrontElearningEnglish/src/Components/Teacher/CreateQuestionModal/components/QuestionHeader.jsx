import React from "react";
import { Row, Col, Form, InputGroup, Badge } from "react-bootstrap";

const QuestionHeader = ({ 
  qFormData, 
  handleQTypeChange, 
  handleQBlur, 
  handlePointsChange,
  qTouched, 
  qErrors, 
  questionToUpdate, 
  QUESTION_TYPES,
  internalGroupId,
  groupInfo
}) => {
  return (
    <Row className="mb-3">
      <Col md={5}>
        <Form.Group>
          <Form.Label>Loại câu hỏi <span className="text-danger">*</span></Form.Label>
          <Form.Select
            value={qFormData.type != null ? String(qFormData.type) : ''}
            onChange={handleQTypeChange}
            onBlur={() => handleQBlur("type")}
            isInvalid={qTouched.type && !!qErrors.type}
            disabled={!!questionToUpdate}
          >
            <option value="">-- Chọn loại câu hỏi muốn tạo --</option>
            <option value={String(QUESTION_TYPES.MultipleChoice)}>Trắc nghiệm (1 đáp án)</option>
            <option value={String(QUESTION_TYPES.MultipleAnswers)}>Trắc nghiệm (Nhiều đáp án)</option>
            <option value={String(QUESTION_TYPES.TrueFalse)}>Đúng / Sai</option>
            <option value={String(QUESTION_TYPES.FillBlank)}>Điền từ (Fill in blanks)</option>
            <option value={String(QUESTION_TYPES.Matching)}>Nối từ (Matching)</option>
            <option value={String(QUESTION_TYPES.Ordering)}>Sắp xếp (Ordering)</option>
          </Form.Select>
          {qTouched.type && qErrors.type && <Form.Control.Feedback type="invalid">{qErrors.type}</Form.Control.Feedback>}
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label>Điểm số <span className="text-danger">*</span></Form.Label>
          <InputGroup hasValidation>
            <Form.Control
              type="text"
              inputMode="decimal"
              isInvalid={qTouched.points && !!qErrors.points}
              value={qFormData.points || ''}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value.replace(/[^\d.]/g, '');
                const parts = numValue.split('.');
                if (parts.length <= 2) {
                  // Direct update since we have qFormData setter-like access via local logic or passed handlers
                  handlePointsChange(numValue);
                }
              }}
              onBlur={() => handleQBlur("points")}
              placeholder="Nhập điểm số"
            />
            {qTouched.points && qErrors.points && <Form.Control.Feedback type="invalid">{qErrors.points}</Form.Control.Feedback>}
            {internalGroupId && groupInfo && <InputGroup.Text className="bg-light text-muted small">/ {groupInfo.sumScore} (Nhóm)</InputGroup.Text>}
          </InputGroup>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default QuestionHeader;
