import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./ActionButtons.css";

/**
 * ActionButtons - Component dùng chung cho các nút Cập nhật và Xóa
 * 
 * @param {Object} props
 * @param {Function} props.onUpdate - Callback khi nhấn nút Cập nhật
 * @param {Function} props.onDelete - Callback khi nhấn nút Xóa
 * @param {string} props.updateText - Text hiển thị trên nút Cập nhật (default: "Cập nhật")
 * @param {string} props.deleteText - Text hiển thị trên nút Xóa (mặc định không có text, chỉ icon)
 * @param {boolean} props.showUpdateText - Hiển thị text trên nút Cập nhật (default: true)
 * @param {boolean} props.showDeleteText - Hiển thị text trên nút Xóa (default: false)
 * @param {string} props.updateTitle - Tooltip cho nút Cập nhật
 * @param {string} props.deleteTitle - Tooltip cho nút Xóa
 * @param {boolean} props.disabled - Disable cả 2 nút
 * @param {boolean} props.updateDisabled - Chỉ disable nút Cập nhật
 * @param {boolean} props.deleteDisabled - Chỉ disable nút Xóa
 * @param {string} props.size - Kích thước: "small" | "medium" | "large" (default: "medium")
 * @param {string} props.className - Class CSS bổ sung cho container
 */
export default function ActionButtons({
  onUpdate,
  onDelete,
  updateText = "Cập nhật",
  deleteText = "",
  showUpdateText = true,
  showDeleteText = false,
  updateTitle = "Cập nhật",
  deleteTitle = "Xóa",
  disabled = false,
  updateDisabled = false,
  deleteDisabled = false,
  size = "medium",
  className = ""
}) {
  const handleUpdate = (e) => {
    e?.stopPropagation();
    if (onUpdate && !disabled && !updateDisabled) {
      onUpdate(e);
    }
  };

  const handleDelete = (e) => {
    e?.stopPropagation();
    if (onDelete && !disabled && !deleteDisabled) {
      onDelete(e);
    }
  };

  return (
    <div className={`action-buttons-container ${size} ${className}`}>
      {onUpdate && (
        <button
          className="action-btn update-btn"
          onClick={handleUpdate}
          title={updateTitle}
          disabled={disabled || updateDisabled}
        >
          <FaEdit className="action-icon" />
          {showUpdateText && <span className="action-text">{updateText}</span>}
        </button>
      )}
      
      {onDelete && (
        <button
          className="action-btn delete-btn"
          onClick={handleDelete}
          title={deleteTitle}
          disabled={disabled || deleteDisabled}
        >
          <FaTrash className="action-icon" />
          {showDeleteText && <span className="action-text">{deleteText}</span>}
        </button>
      )}
    </div>
  );
}
