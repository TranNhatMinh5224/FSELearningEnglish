import React from "react";
import { Badge, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const PendingQuestionsList = ({ 
  pendingQuestions, 
  removeFromPendingList, 
  handleBulkCreate, 
  bulkLoading, 
  qLoading, 
  qUploadingMedia,
  QUESTION_TYPES 
}) => {
  if (pendingQuestions.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-light rounded border">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          <Badge bg="warning" className="me-2">{pendingQuestions.length}</Badge>
          Câu hỏi đã thêm (chờ tạo hàng loạt)
        </h6>
        <Button
          variant="primary"
          size="sm"
          onClick={handleBulkCreate}
          disabled={bulkLoading || qLoading || qUploadingMedia}
        >
          {bulkLoading ? "Đang tạo..." : `Tạo câu hỏi hàng loạt (${pendingQuestions.length} câu)`}
        </Button>
      </div>
      <div className="pending-questions-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {pendingQuestions.map((q, idx) => (
          <div key={q.id} className="d-flex justify-content-between align-items-start p-2 mb-2 bg-white rounded border">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <Badge bg="secondary">{idx + 1}</Badge>
                <strong className="small">
                  {q.preview.type === QUESTION_TYPES.MultipleChoice && "Trắc nghiệm (1 đáp án)"}
                  {q.preview.type === QUESTION_TYPES.MultipleAnswers && "Trắc nghiệm (Nhiều đáp án)"}
                  {q.preview.type === QUESTION_TYPES.TrueFalse && "Đúng / Sai"}
                  {q.preview.type === QUESTION_TYPES.FillBlank && "Điền từ"}
                  {q.preview.type === QUESTION_TYPES.Matching && "Nối từ"}
                  {q.preview.type === QUESTION_TYPES.Ordering && "Sắp xếp"}
                </strong>
                <Badge bg="success">{q.preview.points} điểm</Badge>
                {q.preview.hasMedia && <Badge bg="warning">Có media</Badge>}
              </div>
              <div className="text-muted small text-truncate-2">
                {q.preview.stemText}
              </div>
              <div className="text-muted small mt-1">
                {q.preview.optionsCount > 0 ? `${q.preview.optionsCount} đáp án` :
                  q.preview.matchingPairsCount > 0 ? `${q.preview.matchingPairsCount} cặp nối` :
                    "N/A"}
              </div>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2"
              onClick={() => removeFromPendingList(q.id)}
            >
              <FaTrash />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingQuestionsList;
