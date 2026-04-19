import React from "react";
import { Row, Col, InputGroup, Form, Button } from "react-bootstrap";
import { FaQuestionCircle, FaArrowDown, FaTimes, FaPlus } from "react-icons/fa";

const MatchingFields = ({ matchingPairs, handlePairChange, removePair, addPair }) => {
  return (
    <div className="form-section-card">
      <div className="form-section-title">
        <FaQuestionCircle className="me-2" />
        Nối từ (Matching)
      </div>
      <div className="matching-table-container">
        <div className="matching-header-row">
          <div style={{ flex: 1 }}>Vế A (Trái)</div>
          <div style={{ width: '40px' }}></div>
          <div style={{ flex: 1 }}>Vế B (Phải)</div>
          <div style={{ width: '40px' }}></div>
        </div>
        
        {matchingPairs.map((pair, index) => (
          <div key={`pair-${index}`} className="matching-row">
            <div className="matching-col-input">
              <Form.Control 
                type="text" 
                value={pair.key} 
                onChange={(e) => handlePairChange(index, "key", e.target.value)} 
                placeholder="Nhập phần vế trái..." 
                className="shadow-none" 
              />
            </div>
            
            <div className="matching-col-arrow">
              <FaArrowDown style={{ transform: 'rotate(-90deg)' }} />
            </div>
            
            <div className="matching-col-input">
              <Form.Control 
                type="text" 
                value={pair.value} 
                onChange={(e) => handlePairChange(index, "value", e.target.value)} 
                placeholder="Nhập phần vế phải..." 
                className="shadow-none" 
              />
            </div>
            
            <div className="matching-col-action">
              <button 
                type="button"
                className="remove-pair-btn" 
                onClick={() => removePair(index)}
                title="Xóa cặp này"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ))}
        
        <div className="add-pair-footer">
          <Button variant="outline-primary" size="sm" onClick={addPair} className="border-0 fw-bold">
            <FaPlus className="me-2" /> Thêm cặp nối mới
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchingFields;
