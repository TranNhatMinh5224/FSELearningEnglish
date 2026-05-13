import React from "react";
import { Badge, Button } from "react-bootstrap";
import { FaTrash, FaPlusCircle, FaCheckCircle, FaClock, FaListOl, FaStar, FaEdit } from "react-icons/fa";

const PendingQuestionsList = ({
  pendingQuestions,
  removeFromPendingList,
  onEdit,
  handleBulkCreate,
  bulkLoading,
  qLoading,
  qUploadingMedia,
  QUESTION_TYPES
}) => {
  if (pendingQuestions.length === 0) return null;

  return (
    <div className="pending-list-section mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold" style={{ width: '36px', height: '36px', fontSize: '16px', boxShadow: '0 4px 10px rgba(119, 101, 245, 0.3)' }}>
            {pendingQuestions.length}
          </div>
          <div>
            <h5 className="mb-0 fw-bold text-dark">Hàng đợi tạo câu hỏi</h5>
            <small className="text-muted">Các câu hỏi dưới đây sẽ được tạo hàng loạt vào hệ thống</small>
          </div>
        </div>
        <Button
          variant="primary"
          className="btn-primary-custom fw-bold rounded-pill px-4 py-2 shadow-sm hover-lift"
          onClick={handleBulkCreate}
          disabled={bulkLoading || qLoading || qUploadingMedia}
        >
          {bulkLoading ? (
            <><span className="spinner-border spinner-border-sm me-2"></span> Đang tạo...</>
          ) : (
            <><FaPlusCircle className="me-2" /> Xác nhận tạo tất cả ({pendingQuestions.length} câu)</>
          )}
        </Button>
      </div>
      
      <div className="row g-4">
        {pendingQuestions.map((q, idx) => (
          <div key={q.id} className="col-md-6 col-xl-4">
            <div className="card h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all overflow-hidden bg-white">
              <div className="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-primary small">#{idx + 1}</span>
                  <span className="text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px', fontSize: '10px' }}>
                    {q.preview.type === QUESTION_TYPES.MultipleChoice && "Trắc nghiệm (1 đáp án)"}
                    {q.preview.type === QUESTION_TYPES.MultipleAnswers && "Trắc nghiệm (Nhiều đáp án)"}
                    {q.preview.type === QUESTION_TYPES.TrueFalse && "Đúng / Sai"}
                    {q.preview.type === QUESTION_TYPES.FillBlank && "Điền từ (Fill in blanks)"}
                    {q.preview.type === QUESTION_TYPES.Matching && "Nối từ (Matching)"}
                    {q.preview.type === QUESTION_TYPES.Ordering && "Sắp xếp (Ordering)"}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="link"
                    className="text-primary p-0 opacity-50 hover-opacity-100"
                    onClick={() => onEdit && onEdit(q.id)}
                    title="Sửa câu hỏi"
                  >
                    <FaEdit size={12} />
                  </Button>
                  <Button
                    variant="link"
                    className="text-danger p-0 opacity-50 hover-opacity-100"
                    onClick={() => removeFromPendingList(q.id)}
                    title="Xóa câu hỏi"
                  >
                    <FaTrash size={12} />
                  </Button>
                </div>
              </div>

              <div className="card-body py-3">
                <p className="card-text text-dark fw-medium mb-3 small" style={{ minHeight: '40px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {q.preview.stemText || "(Chưa có nội dung câu hỏi)"}
                </p>
                
                <div className="d-flex flex-wrap gap-2">
                  <div className="d-flex align-items-center">
                    <FaStar className="text-danger me-1" size={10} />
                    <span className="fw-bold text-danger xsmall">{q.preview.points}đ</span>
                  </div>
                  <div className="d-flex align-items-center px-2 py-1 rounded bg-light border border-light-subtle">
                    <FaListOl className="text-info me-1" size={10} />
                    <span className="fw-bold text-dark xsmall">
                        {q.preview.optionsCount > 0 ? `${q.preview.optionsCount} đáp án` :
                          q.preview.matchingPairsCount > 0 ? `${q.preview.matchingPairsCount} cặp` :
                            "N/A"}
                    </span>
                  </div>
                  {q.preview.hasMedia && (
                    <div className="d-flex align-items-center px-2 py-1 rounded bg-info-subtle border border-info-subtle">
                        <span className="text-info fw-bold xsmall">Có Media</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer bg-light border-0 py-2 d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-1 text-warning fw-bold" style={{ fontSize: '10px' }}>
                  <FaClock size={10} /> ĐANG CHỜ
                </span>
                <FaCheckCircle className="text-success opacity-50" size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingQuestionsList;
