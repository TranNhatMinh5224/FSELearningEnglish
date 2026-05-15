import React from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaTrash, FaPlus, FaLink, FaExchangeAlt } from "react-icons/fa";

const MatchingFields = ({ matchingPairs, handlePairChange, removePair, addPair }) => {
  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="form-section-header bg-light p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="d-flex align-items-center gap-2">
                <FaLink className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">Thiết lập cặp nối (Matching)</span>
            </div>
            <Badge bg="primary" className="rounded-pill px-3">
                {matchingPairs?.length || 0} cặp
            </Badge>
        </div>

        <div className="p-3">
            <div className="matching-pairs-list">
                {(matchingPairs || []).map((pair, index) => (
                    <div key={`pair-${index}`} className="matching-pair-item mb-2 p-3 rounded-3 bg-white border border-light shadow-sm position-relative">
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-3">
                            <Badge bg="dark" className="rounded-pill xsmall" style={{ fontSize: '10px' }}>Cặp #{index + 1}</Badge>
                        </div>
                        
                        <Row className="align-items-center g-2 mt-1">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Control
                                        type="text"
                                        value={pair.leftSide || ""}
                                        onChange={(e) => handlePairChange(index, "leftSide", e.target.value)}
                                        placeholder="Vế trái (Ví dụ: Hello)"
                                        className="border-0 bg-light fw-medium py-1 small"
                                        style={{ fontSize: 'var(--font-size-sm)' }}
                                    />
                                </Form.Group>
                            </Col>
                            
                            <Col md={2} className="text-center">
                                <FaExchangeAlt className="text-primary opacity-50" size={12} />
                            </Col>
                            
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Control
                                        type="text"
                                        value={pair.rightSide || ""}
                                        onChange={(e) => handlePairChange(index, "rightSide", e.target.value)}
                                        placeholder="Vế phải (Đáp án)"
                                        className="border-0 bg-light fw-medium py-1 small"
                                        style={{ fontSize: 'var(--font-size-sm)' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button 
                            variant="link" 
                            className="text-danger p-0 border-0 position-absolute top-0 end-0 mt-1 me-2 opacity-50 hover-opacity-100" 
                            onClick={() => removePair(index)}
                            disabled={matchingPairs.length <= 2}
                        >
                            <FaTrash size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="text-center mt-3">
                <Button 
                    variant="outline-primary"
                    className="rounded-pill px-3 py-1 btn-sm fw-bold hover-lift"
                    onClick={addPair}
                >
                    <FaPlus className="me-1" size={12} /> Thêm cặp mới
                </Button>
            </div>
            
            <div className="mt-3 p-2 bg-light rounded-3 xsmall text-muted text-center border-dashed" style={{ fontSize: 'var(--font-size-xs)' }}>
                Hệ thống sẽ tự động xáo trộn các vế phải. Học sinh cần nối đúng vế trái với vế phải.
            </div>
        </div>
    </div>
  );
};

export default MatchingFields;
