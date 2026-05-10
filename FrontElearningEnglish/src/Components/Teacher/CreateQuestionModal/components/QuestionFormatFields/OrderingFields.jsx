import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash, FaPlus, FaSortAmountDown, FaArrowUp, FaArrowDown, FaGripVertical } from "react-icons/fa";

const OrderingFields = ({ options, handleOptionChange, moveOption, removeOption, addOption }) => {
  return (
    <div className="form-section-card format-section">
      <div className="form-section-title mb-3">
        <FaSortAmountDown className="icon-accent" /> Sắp xếp thứ tự đúng
      </div>
      
      <div className="options-list">
        {options.map((option, index) => (
          <div key={`order-${index}`} className="option-item mb-2 p-2 border rounded bg-white d-flex align-items-center gap-3">
            <div className="d-flex flex-column gap-1">
              <Button 
                variant="light" size="sm" className="p-0 px-1" 
                disabled={index === 0}
                onClick={() => moveOption(index, index - 1)}
              >
                <FaArrowUp size={12} />
              </Button>
              <Button 
                variant="light" size="sm" className="p-0 px-1" 
                disabled={index === options.length - 1}
                onClick={() => moveOption(index, index + 1)}
              >
                <FaArrowDown size={12} />
              </Button>
            </div>
            
            <div className="fw-bold text-primary" style={{ minWidth: '25px' }}>{index + 1}.</div>
            
            <Form.Control
              type="text"
              value={option.text || ""}
              onChange={(e) => handleOptionChange(index, "text", e.target.value)}
              placeholder={`Phần tử thứ ${index + 1}`}
              className="border-0 shadow-none"
            />
            
            <Button variant="outline-danger" size="sm" className="border-0" onClick={() => removeOption(index)}>
              <FaTrash />
            </Button>
          </div>
        ))}
      </div>

      <Button size="sm" onClick={addOption} className="mt-3 btn-add-item w-100 py-2">
        <FaPlus className="me-2" /> Thêm phần tử mới
      </Button>
      
      <div className="mt-3 small text-muted text-center italic">
        * Các phần tử trên sẽ được xáo trộn khi hiển thị cho học sinh.
      </div>
    </div>
  );
};

export default OrderingFields;
