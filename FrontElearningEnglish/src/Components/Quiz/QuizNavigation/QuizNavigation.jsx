import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Card, Row, Col } from "react-bootstrap";
import "./QuizNavigation.css";

export default function QuizNavigation({ questions, currentIndex, answers, onGoToQuestion }) {
    const getQuestionStatus = (question, index) => {
        const questionId = question.questionId || question.QuestionId;
        const hasAnswer = answers[questionId] !== undefined && answers[questionId] !== null;
        const isCurrent = index === currentIndex;
        
        if (isCurrent) return "current";
        if (hasAnswer) return "answered";
        return "unanswered";
    };

    const countAnswered = (answersObj) => {
        if (!answersObj) return 0;
        try {
            return Object.values(answersObj).filter(v => {
                if (v === null || v === undefined) return false;
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === 'object') return Object.keys(v).length > 0;
                if (typeof v === 'string') return v.trim() !== "";
                return true; // number/boolean treated as answered
            }).length;
        } catch (e) {
            return 0;
        }
    };

    const answeredCount = countAnswered(answers);

    // Group questions by section
    const groupedQuestions = [];
    questions.forEach((q, index) => {
        const sectionInfo = q._sectionInfo;
        const sectionTitle = sectionInfo?.sectionTitle || "Chung";
        const sectionId = sectionInfo?.sectionId || "general";
        
        let targetSection = groupedQuestions.find(s => s.sectionId === sectionId);
        if (!targetSection) {
            targetSection = {
                sectionId,
                title: sectionTitle,
                description: sectionInfo?.sectionDescription,
                index: sectionInfo?.sectionIndex || 0,
                questions: []
            };
            groupedQuestions.push(targetSection);
        }
        targetSection.questions.push({ ...q, realIndex: index });
    });

    // Sort sections by index
    groupedQuestions.sort((a, b) => a.index - b.index);

    return (
        <Card className="quiz-navigation">
            <Card.Body>
                <div className="navigation-header d-flex justify-content-between align-items-center mb-3">
                    <h4 className="navigation-title mb-0">Danh sách câu hỏi</h4>
                    <div className="navigation-stats d-flex align-items-center">
                        <div className="stat-panel d-flex align-items-center justify-content-center">
                                <div className="stat-content d-flex align-items-center">
                                    <FaCheckCircle className="stat-icon" />
                                    <span className="stat-text">{answeredCount}/{questions ? questions.length : 0}</span>
                                </div>
                        </div>
                    </div>
                </div>

                <div className="navigation-sections-container custom-scrollbar">
                    {groupedQuestions.map((section) => (
                        <div key={section.sectionId} className="navigation-section mb-4">
                            <div className="section-nav-header mb-3 py-1 border-bottom">
                                <h6 className="section-nav-title text-uppercase fw-bold text-primary mb-0">
                                    {section.title}
                                </h6>
                            </div>
                            <Row className="navigation-grid g-2">
                                {section.questions.map((question) => {
                                    const status = getQuestionStatus(question, question.realIndex);
                                    const questionId = question.questionId || question.QuestionId;
                                    return (
                                        <Col key={questionId || question.realIndex} xs={2} sm={2} md={2} lg={2} xl={2}>
                                            <button
                                                type="button"
                                                className={`navigation-item ${status} w-100 d-flex align-items-center justify-content-center`}
                                                onClick={() => onGoToQuestion(question.realIndex)}
                                                title={`Câu ${question.realIndex + 1}`}
                                            >
                                                {question.realIndex + 1}
                                            </button>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    ))}
                </div>

                <div className="navigation-legend d-flex flex-column pt-3 border-top">
                    <div className="legend-item d-flex align-items-center mb-1">
                        <div className="legend-color current"></div>
                        <span>Đang làm</span>
                    </div>
                    <div className="legend-item d-flex align-items-center mb-1">
                        <div className="legend-color answered"></div>
                        <span>Đã trả lời</span>
                    </div>
                    <div className="legend-item d-flex align-items-center">
                        <div className="legend-color unanswered"></div>
                        <span>Chưa trả lời</span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

