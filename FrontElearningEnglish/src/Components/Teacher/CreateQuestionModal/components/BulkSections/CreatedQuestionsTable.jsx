import React from "react";
import { Badge, Button } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

const CreatedQuestionsTable = ({ 
  createdQuestions, 
  editCreatedQuestion, 
  removeFromCreatedList,
  QUESTION_TYPES 
}) => {
  if (createdQuestions.length === 0) return null;

  return (
    <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm" style={{ backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}>
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <h6 className="mb-0 text-success d-flex align-items-center" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
          <Badge bg="success" className="me-2 rounded-pill px-2" style={{ fontSize: '0.75rem' }}>{createdQuestions.length}</Badge>
          Câu hỏi đã tạo thành công
        </h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover bg-white mb-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
              <th style={{ width: '5%', padding: '0.5rem' }}>#</th>
              <th style={{ width: '12%', padding: '0.5rem' }}>Loại</th>
              <th style={{ width: '38%', padding: '0.5rem' }}>Nội dung</th>
              <th style={{ width: '8%', padding: '0.5rem' }}>Điểm</th>
              <th style={{ width: '10%', padding: '0.5rem' }}>Đáp án</th>
              <th style={{ width: '12%', padding: '0.5rem' }}>ID</th>
              <th style={{ width: '15%', padding: '0.5rem' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {createdQuestions.map((q, idx) => (
              <tr key={q.id} style={{ verticalAlign: 'middle' }}>
                <td style={{ padding: '0.4rem 0.5rem' }}><Badge bg="secondary" className="rounded-circle" style={{ width: '18px', height: '18px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{idx + 1}</Badge></td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <small style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {q.preview.type === QUESTION_TYPES.MultipleChoice && "Trắc nghiệm (1)"}
                    {q.preview.type === QUESTION_TYPES.MultipleAnswers && "Trắc nghiệm (N)"}
                    {q.preview.type === QUESTION_TYPES.TrueFalse && "Đúng / Sai"}
                    {q.preview.type === QUESTION_TYPES.FillBlank && "Điền từ"}
                    {q.preview.type === QUESTION_TYPES.Matching && "Nối cặp"}
                    {q.preview.type === QUESTION_TYPES.Ordering && "Sắp xếp"}
                  </small>
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <div className="text-truncate-2" style={{ maxWidth: '280px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {q.preview.stemText}
                  </div>
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <span className="fw-bold text-danger" style={{ fontSize: '0.8rem' }}>{q.preview.points}đ</span>
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {q.preview.optionsCount > 0 ? `${q.preview.optionsCount} đáp án` :
                      q.preview.matchingPairsCount > 0 ? `${q.preview.matchingPairsCount} cặp` :
                        "-"}
                  </small>
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  {q.questionId ? (
                    <Badge bg="primary" style={{ fontSize: '0.7rem', fontWeight: '500', padding: '0.2rem 0.4rem' }}>#{q.questionId}</Badge>
                  ) : (
                    <Badge bg="secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>Chưa có</Badge>
                  )}
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                      onClick={() => editCreatedQuestion(q)}
                      title="Sửa"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                      onClick={() => removeFromCreatedList(q.id)}
                      title="Xóa"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreatedQuestionsTable;
