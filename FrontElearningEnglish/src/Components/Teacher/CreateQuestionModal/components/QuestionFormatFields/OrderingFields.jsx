import React from "react";
import { Form, Button } from "react-bootstrap";
import { FaQuestionCircle, FaArrowUp, FaArrowDown, FaTrash, FaPlus } from "react-icons/fa";

const OrderingFields = ({ options, handleOptionChange, moveOption, removeOption, addOption }) => {
  return (
    <div className="form-section-card">
      <div className="form-section-title">
        <FaQuestionCircle className="me-2" />
        Sắp xếp (Ordering)
      </div>
      <div className="mt-3">
        <div className="alert alert-info py-2 small mb-3">
          <FaQuestionCircle className="me-2" />Sắp xếp theo đúng thứ tự logic.
        </div>
        {options.map((option, index) => (
          <div key={`ordering-${index}`} className="option-item mb-2 d-flex align-items-center gap-3">
            <span className="badge bg-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
              {index + 1}
            </span>
            <Form.Control
              type="text"
              value={option.text || ""}
              onChange={(e) => handleOptionChange(index, "text", e.target.value)}
              placeholder={`Bước ${index + 1}`}
              className="border-0 shadow-none fw-medium flex-grow-1"
            />
            <div className="d-flex gap-1 order-controls bg-white border rounded p-1 shadow-sm">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={index === 0}
                onClick={() => moveOption(index, 'up')}
              >
                <FaArrowUp />
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={index === options.length - 1}
                onClick={() => moveOption(index, 'down')}
              >
                <FaArrowDown />
              </Button>
            </div>
            <Button variant="outline-danger" size="sm" className="border-0 ms-2" onClick={() => removeOption(index)}>
              <FaTrash />
            </Button>
          </div>
        ))}
        <Button variant="outline-primary" size="sm" onClick={addOption} className="mt-2">
          <FaPlus className="me-1" /> Thêm bước
        </Button>
      </div>
    </div>
  );
};

export default OrderingFields;
