
import React from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { Card, Button, Row, Col } from "react-bootstrap";
import "./QuizCard.css";

export default function QuizCard({ assessment, onClick, hasInProgress }) {
    const formatTimeLimit = (timeLimit) => {
        if (!timeLimit) return "Không giới hạn";
        const parts = timeLimit.split(":");
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            if (hours > 0) {
                return `${hours} giờ ${minutes} phút`;
            }
            return `${minutes} phút`;
        }
        return timeLimit;
    };

    return (
        <Card className={`quiz-card ${hasInProgress ? 'in-progress' : ''}`} onClick={onClick} style={{ cursor: "pointer" }}>
            <Card.Body>
                <Row className="align-items-center">
                    <Col xs="auto">
                        <div className="quiz-icon-wrapper">
                            <div className="quiz-icon">
                                <FaQuestionCircle size={32} />
                            </div>
                        </div>
                    </Col>
                    <Col>
                        <div className="d-flex align-items-center gap-2">
                            <Card.Title className="quiz-title mb-0">{assessment.title}</Card.Title>
                            {hasInProgress && (
                                <span className="badge rounded-pill bg-warning text-dark px-3 py-2" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                                    ĐANG LÀM
                                </span>
                            )}
                        </div>
                        {assessment.description && (
                            <Card.Text className="quiz-description mt-2">{assessment.description}</Card.Text>
                        )}
                        <div className="quiz-meta">
                            {assessment.timeLimit && (
                                <span className="quiz-meta-item">
                                    Thời gian: {formatTimeLimit(assessment.timeLimit)}
                                </span>
                            )}
                            {assessment.totalPoints && (
                                <span className="quiz-meta-item">
                                    Điểm: {assessment.totalPoints}
                                </span>
                            )}
                        </div>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant={hasInProgress ? "outline-warning" : "success"}
                            className="quiz-start-btn"
                            onClick={e => {
                                e.stopPropagation();
                                onClick();
                            }}
                        >
                            {hasInProgress ? "Tiếp tục" : "Làm Quiz"}
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

