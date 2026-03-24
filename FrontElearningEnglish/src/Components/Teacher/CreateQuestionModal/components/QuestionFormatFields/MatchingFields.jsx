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
      <div className="mt-3">
        <div className="alert alert-info py-2 small mb-3">
          <FaQuestionCircle className="me-2" />Nhập các cặp tương ứng. Backend sẽ dùng Text để đối chiếu ID.
        </div>
        {matchingPairs.map((pair, index) => (
          <div key={`pair-${index}`} className="option-item mb-2">
            <Row className="align-items-center g-2">
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text className="bg-light text-muted small fw-bold" style={{ width: '40px' }}>
                    {index + 1}A
                  </InputGroup.Text>
                  <Form.Control 
                    type="text" 
                    value={pair.key} 
                    onChange={(e) => handlePairChange(index, "key", e.target.value)} 
                    placeholder="Vế trái" 
                    className="border-0 shadow-none" 
                  />
                </InputGroup>
              </Col>
              <Col md={1} className="text-center text-primary matching-arrow">
                <FaArrowDown style={{ transform: 'rotate(-90deg)' }} />
              </Col>
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text className="bg-light text-muted small fw-bold" style={{ width: '40px' }}>
                    {index + 1}B
                  </InputGroup.Text>
                  <Form.Control 
                    type="text" 
                    value={pair.value} 
                    onChange={(e) => handlePairChange(index, "value", e.target.value)} 
                    placeholder="Vế phải" 
                    className="border-0 shadow-none" 
                  />
                </InputGroup>
              </Col>
              <Col md={1} className="text-end">
                <Button variant="outline-danger" size="sm" className="border-0" onClick={() => removePair(index)}>
                  <FaTimes />
                </Button>
              </Col>
            </Row>
          </div>
        ))}
        <Button variant="outline-primary" size="sm" onClick={addPair} className="mt-2">
          <FaPlus className="me-1" /> Thêm cặp nối
        </Button>
      </div>
    </div>
  );
};

export default MatchingFields;
