import React from "react";
import MultipleChoiceQuestion from "../MultipleChoiceQuestion/MultipleChoiceQuestion";
import MatchingQuestion from "../MatchingQuestion/MatchingQuestion";
import OrderingQuestion from "../OrderingQuestion/OrderingQuestion";
import FillBlankQuestion from "../FillBlankQuestion/FillBlankQuestion";
import TrueFalseQuestion from "../TrueFalseQuestion/TrueFalseQuestion";
import { Card, Row, Col, Badge } from "react-bootstrap";
import "./QuestionCard.css";

export default function QuestionCard({ question, answer, onChange, questionNumber, totalQuestions, allAnswers, attemptId }) {
    // Handle both camelCase and PascalCase for standalone or sub-questions
    const getQuestionType = (q) => q?.type !== undefined ? q.type : (q?.Type !== undefined ? q.Type : 0);

    const renderSingleQuestion = (q, qAns, qChange) => {
        if (!q) return null;
        const qType = getQuestionType(q);

        switch (qType) {
            case 1: // MultipleChoice
                return <MultipleChoiceQuestion question={q} answer={qAns} onChange={qChange} />;
            case 2: // MultipleAnswers
                return <MultipleChoiceQuestion question={q} answer={qAns} onChange={qChange} multiple={true} />;
            case 3: // TrueFalse
                return <TrueFalseQuestion question={q} answer={qAns} onChange={qChange} />;
            case 4: // FillBlank
                return <FillBlankQuestion question={q} answer={qAns} onChange={qChange} />;
            case 5: // Matching
                return <MatchingQuestion question={q} answer={qAns} onChange={qChange} attemptId={attemptId} />;
            case 6: // Ordering
                return <OrderingQuestion question={q} answer={qAns} onChange={qChange} />;
            default:
                return <MultipleChoiceQuestion question={q} answer={qAns} onChange={qChange} />;
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

    const isGroup = question._itemType === "Group";
    const groupInfo = question.groupInfo || question._groupInfo;
    const sectionInfo = question._sectionInfo;
    
    // Determine title range for groups
    let displayQuestionNumber = questionNumber;
    if (isGroup && question.questions && question.questions.length > 1) {
        const start = questionNumber;
        const end = questionNumber + question.questions.length - 1;
        displayQuestionNumber = `${start} - ${end}`;
    }

    // Helper to render media (Image, Video, Audio)
    const renderMedia = (q) => {
        // Handle various URL properties from API
        const mUrl = q.mediaUrl || q.MediaUrl || q.imgUrl || q.ImgUrl || q.videoUrl || q.VideoUrl || q.audioUrl || q.AudioUrl;
        if (!mUrl) return null;

        const mType = (q.mediaType || q.MediaType || "").toLowerCase();
        const isVideo = mType.includes('video') || (q.videoUrl || q.VideoUrl) || mUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i);
        const isAudio = mType.includes('audio') || (q.audioUrl || q.AudioUrl) || mUrl.match(/\.(mp3|wav|ogg)(\?.*)?$/i);

        return (
            <div className="question-media-wrapper mb-4">
                {isVideo ? (
                    <div className="premium-video-container">
                        <video src={mUrl} controls className="premium-video-element" />
                    </div>
                ) : isAudio ? (
                    <div className="premium-audio-container">
                        <audio src={mUrl} controls className="premium-audio-element" />
                    </div>
                ) : (
                    <div className="premium-image-container" onClick={() => window.open(mUrl, '_blank')}>
                        <img src={mUrl} alt="Question media" className="premium-image-element" />
                        <div className="image-overlay-hint">
                            <span>Click để phóng to</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="question-card">
            <Card.Body>
                {/* 1. Part Title */}
                {sectionInfo && (
                    <div className="section-header-v4 mb-3">
                        <h4 className="section-title-v4 text-uppercase fw-800">
                            {sectionInfo.sectionTitle || `Part ${sectionInfo.sectionIndex}`}
                        </h4>
                        {sectionInfo.sectionDescription && (
                            <p className="section-description-v4 text-muted small mb-0">
                                {sectionInfo.sectionDescription}
                            </p>
                        )}
                        <div className="section-divider-v4"></div>
                    </div>
                )}

                {/* 2. Group Header Info */}
                {groupInfo && (groupInfo.groupName || groupInfo.groupTitle || groupInfo.groupDescription || groupInfo.groupImgUrl || groupInfo.groupVideoUrl || groupInfo.groupAudioUrl) && (
                    <div className="question-group-info mb-4 p-4 bg-light rounded border-start border-4 border-primary">
                        {(groupInfo.groupTitle || groupInfo.groupName) && (
                            <div className="group-title mb-2">
                                <h5 className="mb-1 fw-bold text-primary">
                                    {groupInfo.groupTitle || groupInfo.groupName}
                                </h5>
                            </div>
                        )}
                        {groupInfo.groupDescription && (
                            <div className="group-description mb-3">
                                <p className="text-muted mb-0 lh-lg" style={{ whiteSpace: 'pre-wrap' }}>
                                    {groupInfo.groupDescription}
                                </p>
                            </div>
                        )}
                        
                        <div className="group-media-grid d-flex flex-column gap-4 mt-3">
                            {groupInfo.groupImgUrl && (
                                <div className="question-media-wrapper">
                                    <div className="premium-image-container" onClick={() => window.open(groupInfo.groupImgUrl, '_blank')}>
                                        <img src={groupInfo.groupImgUrl} alt="Group context" className="premium-image-element" />
                                        <div className="image-overlay-hint">
                                            <span>Click để phóng to</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {groupInfo.groupVideoUrl && (
                                <div className="question-media-wrapper">
                                    <div className="premium-video-container">
                                        <video src={groupInfo.groupVideoUrl} controls className="premium-video-element" />
                                    </div>
                                </div>
                            )}

                            {groupInfo.groupAudioUrl && (
                                <div className="premium-audio-container shadow-sm">
                                    <audio src={groupInfo.groupAudioUrl} controls className="premium-audio-element" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* 3. Questions Rendering */}
                <div className="questions-container">
                    {isGroup && question.questions ? (
                        question.questions.map((subQ, idx) => {
                            const subQId = subQ.questionId || subQ.QuestionId;
                            const subQText = subQ.questionText || subQ.QuestionText || subQ.stemText || subQ.StemText || "Câu hỏi";
                            const subQNumber = questionNumber + idx;
                            const subQAns = allAnswers ? allAnswers[subQId] : null;

                            return (
                                <div key={subQId || idx} className="sub-question-item mb-5 pb-4 border-bottom last-child-no-border animate-fade-in">
                                    <div className="question-main-header-v4 mb-4">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h5 className="question-headline-v4 mb-0">
                                                <span className="question-number-prefix">Câu {subQNumber}:</span>
                                                <span className="question-text-content ms-2">
                                                    {getQuestionType(subQ) === 4 ? "Điền từ vào chỗ trống:" : subQText}
                                                </span>
                                            </h5>
                                            <div className="points-badge-v4-compact">
                                                <span className="points-value">{(subQ.points || subQ.Points || 0).toFixed(2)}</span>
                                                <span className="points-label">đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="question-content">
                                        {renderMedia(subQ)}
                                        <div className="question-answer-section">
                                            {renderSingleQuestion(subQ, subQAns, (val) => onChange(subQId, val))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Standalone Question
                        <div className="standalone-question">
                            <div className="question-main-header-v4 mb-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <h5 className="question-headline-v4 mb-0">
                                        <span className="question-number-prefix">Câu {questionNumber}:</span>
                                        <span className="question-text-content ms-2">
                                            {getQuestionType(question) === 4 
                                                ? "Điền từ vào chỗ trống:" 
                                                : (question.questionText || question.QuestionText || question.stemText || question.StemText || "Câu hỏi")}
                                        </span>
                                    </h5>
                                    <div className="points-badge-v4-compact">
                                        <span className="points-value">{(question.points || question.Points || 0).toFixed(2)}</span>
                                        <span className="points-label">đ</span>
                                    </div>
                                </div>
                            </div>
                            <div className="question-content">
                                {renderMedia(question)}
                                <div className="question-answer-section">
                                    {renderSingleQuestion(question, answer, (val) => {
                                        const qId = question.questionId || question.QuestionId;
                                        onChange(qId, val);
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

