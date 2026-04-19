import React from "react";
import MultipleChoiceQuestion from "../MultipleChoiceQuestion/MultipleChoiceQuestion";
import MatchingQuestion from "../MatchingQuestion/MatchingQuestion";
import OrderingQuestion from "../OrderingQuestion/OrderingQuestion";
import FillBlankQuestion from "../FillBlankQuestion/FillBlankQuestion";
import TrueFalseQuestion from "../TrueFalseQuestion/TrueFalseQuestion";
import { Card, Row, Col, Badge } from "react-bootstrap";
import "./QuestionCard.css";

export default function QuestionCard({ question, answer, onChange, questionNumber, totalQuestions }) {
    // Handle both camelCase and PascalCase
    const questionType = question?.type !== undefined ? question.type : (question?.Type !== undefined ? question.Type : 0);

    const renderQuestion = () => {
        if (!question) return null;

        switch (questionType) {
            case 1: // MultipleChoice
                return (
                    <MultipleChoiceQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
            case 2: // MultipleAnswers
                return (
                    <MultipleChoiceQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                        multiple={true}
                    />
                );
            case 3: // TrueFalse
                return (
                    <TrueFalseQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
            case 4: // FillBlank
                return (
                    <FillBlankQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
            case 5: // Matching
                return (
                    <MatchingQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
            case 6: // Ordering
                return (
                    <OrderingQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
            default:
                return (
                    <MultipleChoiceQuestion
                        question={question}
                        answer={answer}
                        onChange={onChange}
                    />
                );
        }
    };

    if (!question) {
        return (
            <Card className="question-card">
                <Card.Body>
                    <div className="no-question-message">Không có câu hỏi</div>
                </Card.Body>
            </Card>
        );
    }

    // Extract group info if available
    const groupInfo = question._groupInfo;
    const questionText = question.questionText || question.QuestionText || question.stemText || question.StemText || "Câu hỏi";

    return (
        <Card className="question-card">
            <Card.Body>
                {/* 1. Part Title - Prominent & Large */}
                {question._sectionInfo && (
                    <div className="section-header-v4 mb-3">
                        <h4 className="section-title-v4 text-uppercase fw-800">
                            {question._sectionInfo.sectionTitle || `Part ${question._sectionInfo.sectionIndex}`}
                        </h4>
                        {question._sectionInfo.sectionDescription && (
                            <p className="section-description-v4 text-muted small mb-0">
                                {question._sectionInfo.sectionDescription}
                            </p>
                        )}
                        <div className="section-divider-v4"></div>
                    </div>
                )}

                {/* 2. Navigation & Points Bar */}
                <div className="question-navigation-bar-v4 mb-4">
                    <div className="nav-sequence-v4">
                        {(() => {
                            const items = [];
                            const total = totalQuestions;
                            const current = questionNumber;
                            const range = 2; 
                            
                            for (let i = 1; i <= total; i++) {
                                if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
                                    items.push(
                                        <div 
                                            key={i} 
                                            className={`nav-item-v4 ${i === current ? 'active' : ''}`}
                                        >
                                            {i}
                                        </div>
                                    );
                                } else if (i === current - range - 1 || i === current + range + 1) {
                                    items.push(<div key={`dot-${i}`} className="nav-dot-v4">...</div>);
                                }
                            }
                            return items;
                        })()}
                        <span className="nav-total-v4">của {totalQuestions} câu</span>
                    </div>
                    <div className="points-badge-v4">
                        <span className="points-value">{(question.points || question.Points || 0).toFixed(2)}</span>
                        <span className="points-label">điểm</span>
                    </div>
                </div>

                {/* 3. Question Title: Câu X: [Content] */}
                <div className="question-main-header-v4 mb-4">
                    <h5 className="question-headline-v4">
                        <span className="question-number-prefix">Câu {questionNumber}:</span>
                        <span className="question-text-content ms-2">{questionText}</span>
                    </h5>
                </div>
                
                {/* Display Group Information if available */}
                {groupInfo && (groupInfo.groupName || groupInfo.groupTitle || groupInfo.groupDescription || groupInfo.groupImgUrl || groupInfo.groupVideoUrl) && (
                    <div className="question-group-info mb-4 p-3 bg-light rounded border">
                        {(groupInfo.groupTitle || groupInfo.groupName) && (
                            <div className="group-title mb-2">
                                <h5 className="mb-1 fw-bold text-primary">
                                    {groupInfo.groupTitle || groupInfo.groupName}
                                </h5>
                                {groupInfo.groupName && groupInfo.groupTitle && groupInfo.groupName !== groupInfo.groupTitle && (
                                    <small className="text-muted">{groupInfo.groupName}</small>
                                )}
                            </div>
                        )}
                        {groupInfo.groupDescription && (
                            <div className="group-description mb-2">
                                <p className="text-muted mb-0">{groupInfo.groupDescription}</p>
                            </div>
                        )}
                        {groupInfo.groupSumScore && (
                            <div className="group-score mb-2">
                                <Badge bg="info">Tổng điểm nhóm: {groupInfo.groupSumScore} điểm</Badge>
                            </div>
                        )}
                        {groupInfo.groupImgUrl && (
                            <div className="group-media mb-2">
                                <img 
                                    src={groupInfo.groupImgUrl} 
                                    alt={groupInfo.groupTitle || groupInfo.groupName || "Group context"} 
                                    className="img-fluid rounded shadow-sm" 
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            </div>
                        )}
                        {groupInfo.groupVideoUrl && (
                            <div className="group-media mb-2">
                                <video 
                                    src={groupInfo.groupVideoUrl} 
                                    controls 
                                    className="w-100 rounded shadow-sm"
                                    style={{ maxHeight: '400px' }}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                <div className="question-content">
                    {(question.mediaUrl || question.MediaUrl) && (
                        <div className="question-media">
                            {(() => {
                                const mediaUrl = question.mediaUrl || question.MediaUrl;
                                if (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm')) {
                                    return <video src={mediaUrl} controls className="media-element" />;
                                } else if (mediaUrl.includes('.mp3') || mediaUrl.includes('.wav')) {
                                    return <audio src={mediaUrl} controls className="media-element" />;
                                } else {
                                    return <img src={mediaUrl} alt="Question media" className="media-element" />;
                                }
                            })()}
                        </div>
                    )}
                    <div className="question-answer-section">
                        {renderQuestion()}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

