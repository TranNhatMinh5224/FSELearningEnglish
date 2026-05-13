import React from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaTrash, FaPlus, FaSortAmountDown, FaArrowUp, FaArrowDown, FaGripVertical } from "react-icons/fa";

const OrderingFields = ({ options, handleOptionChange, moveOption, removeOption, addOption }) => {
  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="form-section-header bg-light p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="d-flex align-items-center gap-2">
                <FaSortAmountDown className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">Sắp xếp thứ tự đúng</span>
            </div>
            <Badge bg="primary" className="rounded-pill px-3">
                {options?.length || 0} phần tử
            </Badge>
        </div>
      
        <div className="p-3">
            <div className="options-list">
                {(options || []).map((option, index) => {
                if (!option) return null;
                return (
                    <div key={`order-${index}`} className="option-item mb-2 p-2 border rounded-3 bg-white d-flex align-items-center gap-2 shadow-sm hover-lift border-light">
                        <div className="d-flex flex-column gap-1">
                            <Button 
                                variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                                disabled={index === 0}
                                onClick={() => moveOption(index, 'up')}
                                style={{ fontSize: '8px' }}
                            >
                                <FaArrowUp />
                            </Button>
                            <Button 
                                variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                                disabled={index === (options?.length || 0) - 1}
                                onClick={() => moveOption(index, 'down')}
                                style={{ fontSize: '8px' }}
                            >
                                <FaArrowDown />
                            </Button>
                        </div>
                        
                        <div className="fw-bold text-primary small d-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: '28px', height: '28px' }}>
                            {index + 1}
                        </div>
                        
                        <Form.Control
                            type="text"
                            value={option.text || ""}
                            onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                            placeholder={`Phần tử thứ ${index + 1}...`}
                            className="border-0 shadow-none fw-medium bg-transparent p-0 small"
                            style={{ fontSize: 'var(--font-size-sm)' }}
                        />
                        
                        <Button 
                            variant="link" 
                            className="text-danger p-0 border-0 ms-auto opacity-50 hover-opacity-100" 
                            onClick={() => removeOption(index)}
                        >
                            <FaTrash size={14} />
                        </Button>
                    </div>
                );
                })}
            </div>

            <div className="text-center mt-3">
                <Button 
                    variant="outline-primary"
                    className="rounded-pill px-3 py-1 btn-sm fw-bold hover-lift"
                    onClick={addOption}
                >
                    <FaPlus className="me-1" size={12} /> Thêm phần tử
                </Button>
            </div>
            
            <div className="mt-3 p-2 bg-light rounded-3 xsmall text-muted text-center border-dashed" style={{ fontSize: 'var(--font-size-xs)' }}>
                <FaGripVertical className="me-1 opacity-50" />
                Thứ tự bạn nhập ở đây là <strong>thứ tự đúng</strong>.
            </div>
        </div>
    </div>
  );
};

export default OrderingFields;
