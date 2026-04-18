import { Table, Button, Badge } from "react-bootstrap";
import { FaEdit, FaTrash, FaSync } from "react-icons/fa";

export default function PolicyList({ policies, onEdit, onDelete }) {
  if (!policies || policies.length === 0) {
    return <div className="text-center py-5 text-muted">Chưa có chính sách nào.</div>;
  }

  return (
    <Table hover responsive className="mb-0">
      <thead className="bg-light">
        <tr>
          <th className="ps-4">Tiêu đề</th>
          <th>Slug</th>
          <th>Danh mục</th>
          <th>Ngày cập nhật</th>
          <th className="text-end pe-4">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {policies.map((policy) => (
          <tr key={policy.id || policy.Id}>
            <td className="ps-4 fw-medium">{policy.title || policy.Title}</td>
            <td><code>{policy.slug || policy.Slug}</code></td>
            <td>
              <Badge bg="info" className="text-dark bg-opacity-10">
                {policy.category || policy.Category}
              </Badge>
            </td>
            <td>{new Date(policy.updatedAt || policy.UpdatedAt).toLocaleDateString("vi-VN")}</td>
            <td className="text-end pe-4">
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => onEdit(policy)}
                title="Chỉnh sửa"
              >
                <FaEdit />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(policy)}
                title="Xóa"
              >
                <FaTrash />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
