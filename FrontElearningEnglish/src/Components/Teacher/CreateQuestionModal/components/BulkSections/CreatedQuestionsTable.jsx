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
    <div className="mt-4 p-3 bg-success bg-opacity-10 rounded border border-success">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 text-success">
          <Badge bg="success" className="me-2">{createdQuestions.length}</Badge>
          Câu hỏi đã tạo thành công
        </h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover bg-white">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '10%' }}>Loại</th>
              <th style={{ width: '40%' }}>Nội dung</th>
              <th style={{ width: '8%' }}>Điểm</th>
              <th style={{ width: '10%' }}>Đáp án</th>
              <th style={{ width: '12%' }}>ID</th>
              <th style={{ width: '15%' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {createdQuestions.map((q, idx) => (
              <tr key={q.id}>
                <td><Badge bg="secondary">{idx + 1}</Badge></td>
                <td>
                  <small>
                    {q.preview.type === QUESTION_TYPES.MultipleChoice && "Trắc nghiệm (1)"}
                    {q.preview.type === QUESTION_TYPES.MultipleAnswers && "Trắc nghiệm (N)"}
                    {q.preview.type === QUESTION_TYPES.TrueFalse && "Đúng/Sai"}
                    {q.preview.type === QUESTION_TYPES.FillBlank && "Điền từ"}
                    {q.preview.type === QUESTION_TYPES.Matching && "Nối từ"}
                    {q.preview.type === QUESTION_TYPES.Ordering && "Sắp xếp"}
                  </small>
                </td>
                <td>
                  <div className="text-truncate-2" style={{ maxWidth: '300px' }}>
                    {q.preview.stemText}
                  </div>
                </td>
                <td><Badge bg="info">{q.preview.points}</Badge></td>
                <td>
                  <small className="text-muted">
                    {q.preview.optionsCount > 0 ? `${q.preview.optionsCount} đáp án` :
                      q.preview.matchingPairsCount > 0 ? `${q.preview.matchingPairsCount} cặp` :
                        "-"}
                  </small>
                </td>
                <td>
                  {q.questionId ? (
                    <Badge bg="primary">#{q.questionId}</Badge>
                  ) : (
                    <Badge bg="secondary">Chưa có</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => editCreatedQuestion(q)}
                      title="Sửa"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
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
