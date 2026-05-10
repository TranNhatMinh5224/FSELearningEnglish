import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash, FaPlus, FaLink, FaArrowRight } from "react-icons/fa";

const MatchingFields = ({ matchingPairs, handlePairChange, removePair, addPair }) => {
  return (
    <div className="form-section-card format-section">
      <div className="form-section-title mb-3">
        <FaLink className="icon-accent" /> Thiết lập cặp nối
      </div>
      
      <div className="matching-table-container">
        <div className="matching-header-row">
          <div className="matching-col-input">Vế trái (Câu hỏi)</div>
          <div className="matching-col-arrow"></div>
          <div className="matching-col-input">Vế phải (Đáp án)</div>
          <div className="matching-col-action"></div>
        </div>
        
        {matchingPairs.map((pair, index) => (
          <div key={`pair-${index}`} className="matching-row">
            <div className="matching-col-input">
              <Form.Control
                type="text"
                value={pair.leftSide || ""}
                onChange={(e) => handlePairChange(index, "leftSide", e.target.value)}
                placeholder="Ví dụ: Hello"
              />
            </div>
            <div className="matching-col-arrow">
              <FaArrowRight className="matching-arrow" />
            </div>
            <div className="matching-col-input">
              <Form.Control
                type="text"
                value={pair.rightSide || ""}
                onChange={(e) => handlePairChange(index, "rightSide", e.target.value)}
                placeholder="Ví dụ: Xin chào"
              />
            </div>
            <div className="matching-col-action">
              <button type="button" className="remove-pair-btn" onClick={() => removePair(index)}>
                <FaTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-pair-footer d-flex justify-content-center">
        <Button size="sm" onClick={addPair} className="mt-3 btn-add-item px-4">
          <FaPlus className="me-2" /> Thêm cặp nối mới
        </Button>
      </div>
    </div>
  );
};

export default MatchingFields;
