import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import { quizAttemptService } from "../../Services/quizAttemptService";
import { quizService } from "../../Services/quizService";
import { courseService } from "../../Services/courseService";
import { lessonService } from "../../Services/lessonService";
import { moduleService } from "../../Services/moduleService";
import { useQuestionTypes } from "../../hooks/useQuestionTypes";
import { FaCheckCircle, FaTimesCircle, FaClock, FaTrophy } from "react-icons/fa";
import { Badge, Card } from "react-bootstrap";
import QuizAttemptSidebar from "../../Components/Teacher/SubmissionManagement/QuizAttemptDetailModal/QuizAttemptSidebar";
import QuizAttemptQuestion from "../../Components/Teacher/SubmissionManagement/QuizAttemptDetailModal/QuizAttemptQuestion";
import "../../Components/Teacher/SubmissionManagement/QuizAttemptDetailModal/QuizAttemptDetailModal.css";
import "./QuizResults.css";

export default function QuizResults() {
    const { courseId, lessonId, moduleId, attemptId } = useParams();
    const navigate = useNavigate();
    const { getQuestionTypeLabel } = useQuestionTypes();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [module, setModule] = useState(null);
    const [error, setError] = useState("");
    const [assessmentId, setAssessmentId] = useState(null);

    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await quizAttemptService.result(attemptId);
                if (response.data?.success && response.data?.data) {
                    setResult(response.data.data);
                    const qId = response.data.data.quizId || response.data.data.QuizId;
                    if (qId) {
                        const quizRes = await quizService.getById(qId);
                        if (quizRes.data?.success && quizRes.data?.data) {
                            const quizData = Array.isArray(quizRes.data.data) ? quizRes.data.data[0] : quizRes.data.data;
                            setAssessmentId(quizData.assessmentId || quizData.AssessmentId);
                        }
                    }
                } else {
                    setError("Không tìm thấy kết quả bài thi này.");
                }

                const [courseRes, lessonRes, moduleRes] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessonById(lessonId),
                    moduleService.getModuleById(moduleId)
                ]);
                if (courseRes.data?.success) setCourse(courseRes.data.data);
                if (lessonRes.data?.success) setLesson(lessonRes.data.data);
                if (moduleRes.data?.success) setModule(moduleRes.data.data);

            } catch (err) {
                console.error("Error fetching results:", err);
                setError("Không thể tải kết quả quiz.");
            } finally {
                setLoading(false);
            }
        };

        if (attemptId) fetchResults();
    }, [attemptId, courseId, lessonId, moduleId]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const scrollToQuestion = (index) => {
        const element = document.getElementById(`q-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const effectiveSections = useMemo(() => {
        if (!result) return [];
        const sections = result.sections || result.Sections || [];
        const questions = result.questions || result.Questions || [];
        
        if (sections.length > 0) return sections;
        if (questions.length > 0) {
            return [{
                title: "Chi tiết bài làm",
                items: questions.map((q, idx) => ({
                    itemType: "Question",
                    displayOrder: idx,
                    question: q
                }))
            }];
        }
        return [];
    }, [result]);

    const handleBack = () => {
        const path = assessmentId 
            ? `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment/${assessmentId}`
            : `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment`;
        navigate(path);
    };

    if (loading) return (
        <>
            <MainHeader />
            <div className="quiz-results-container-v3 d-flex flex-column align-items-center justify-content-center" style={{minHeight: '60vh'}}>
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-3 text-muted fw-bold">Đang tải kết quả...</div>
            </div>
        </>
    );

    if (error || !result) return (
        <>
            <MainHeader />
            <div className="quiz-results-container-v3 p-5 text-center">
                <div className="alert alert-danger">{error || "Không tìm thấy kết quả"}</div>
                <Button variant="primary" onClick={handleBack} className="rounded-pill px-4">Quay lại</Button>
            </div>
        </>
    );

    const questions = result.questions || result.Questions || [];
    const totalScore = result.totalScore !== undefined ? result.totalScore : (result.TotalScore || 0);
    const percentage = result.percentage !== undefined ? result.percentage : (result.Percentage || 0);
    
    const safeTotalScore = typeof totalScore === "number" ? totalScore : 0;
    const safePercentage = typeof percentage === "number" ? percentage : 0;
    const maxScore = (safePercentage > 0) ? (safeTotalScore * 100) / safePercentage : (safeTotalScore > 0 ? safeTotalScore : 0);
    
    const { isPassed, submittedAt, timeSpentSeconds } = result;
    const hasScore = typeof totalScore === "number" && typeof percentage === "number";

    return (
        <div className="quiz-results-page-v3">
            <MainHeader />
            <div className="quiz-results-content-v3 mt-4">
                <Container>
                    <Breadcrumb 
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: course?.title || "Khóa học", path: `/course/${courseId}` },
                            { label: "Lesson", path: `/course/${courseId}/learn` },
                            { label: lesson?.title || "Bài học", path: `/course/${courseId}/lesson/${lessonId}` },
                            { label: "Bài tập", path: `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment` },
                            { label: "Kết quả Quiz", isCurrent: true }
                        ]}
                    />

                    <div className="quiz-results-layout-v3 mt-4 d-flex flex-column gap-4">
                        <main className="quiz-results-main-v3 w-100">
                            {/* Original Results Card UI */}
                            <Card className="results-card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                                <Card.Body className="p-0">
                                    <div className="results-header p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(114, 208, 222, 0.1) 0%, rgba(114, 208, 222, 0.05) 100%)' }}>
                                        <div className={`result-icon mb-4 ${isPassed ? "text-success" : "text-danger"}`}>
                                            {isPassed ? (
                                                <FaTrophy style={{ fontSize: '80px' }} />
                                            ) : (
                                                <FaTimesCircle style={{ fontSize: '80px' }} />
                                            )}
                                        </div>
                                        <h2 className="results-title fw-800 mb-4" style={{ fontSize: '2rem', color: 'var(--slate-900)' }}>
                                            {hasScore
                                                ? (isPassed ? "Chúc mừng! Bạn đã hoàn thành bài thi" : "Kết quả làm bài của bạn")
                                                : "Bài làm đã được nộp"}
                                        </h2>
                                        <div className="results-score d-flex flex-column align-items-center">
                                            {hasScore ? (
                                                <>
                                                    <div className="score-display mb-2" style={{ fontSize: '3.5rem', fontWeight: '800' }}>
                                                        <span className="text-primary">{totalScore.toFixed(1)}</span>
                                                        <span className="text-muted mx-2" style={{ fontWeight: '300' }}>/</span>
                                                        <span className="text-secondary">{maxScore}</span>
                                                    </div>
                                                    <div className="score-percentage-badge">
                                                        <Badge bg={isPassed ? "success" : "danger"} className="rounded-pill px-4 py-2" style={{ fontSize: '1.2rem' }}>
                                                            {percentage.toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-muted">Điểm sẽ được công bố sau</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="results-summary p-4 border-top">
                                        <Row className="g-4">
                                            <Col md={4}>
                                                <div className="summary-item d-flex align-items-center p-4 bg-light rounded-4 border-0">
                                                    <FaClock className="text-primary me-3" size={32} />
                                                    <div>
                                                        <div className="text-muted small fw-600 text-uppercase">Thời gian</div>
                                                        <div className="fw-800" style={{ fontSize: '1.1rem' }}>{formatTime(timeSpentSeconds)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="summary-item d-flex align-items-center p-4 bg-light rounded-4 border-0">
                                                    <FaCheckCircle className="text-success me-3" size={32} />
                                                    <div>
                                                        <div className="text-muted small fw-600 text-uppercase">Điểm số</div>
                                                        <div className="fw-800 text-success" style={{ fontSize: '1.1rem' }}>
                                                            {hasScore ? `${totalScore.toFixed(1)} điểm` : "Chưa công bố"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="summary-item d-flex align-items-center p-4 bg-light rounded-4 border-0">
                                                    <FaTrophy className="text-warning me-3" size={32} />
                                                    <div>
                                                        <div className="text-muted small fw-600 text-uppercase">Nộp bài lúc</div>
                                                        <div className="fw-800" style={{ fontSize: '1.1rem' }}>{formatDate(submittedAt)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* View Details Toggle Button */}
                            {questions.length > 0 && (
                                <div className="d-flex justify-content-center my-4">
                                    <Button 
                                        variant={showDetails ? "outline-primary" : "primary"} 
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="rounded-pill px-5 py-3 fw-bold shadow-lg transition-all"
                                        style={{ fontSize: '1.1rem' }}
                                    >
                                        {showDetails ? "Ẩn chi tiết bài làm" : "Xem chi tiết kết quả bài làm"}
                                    </Button>
                                </div>
                            )}

                            {!showDetails && questions.length === 0 && (
                                <div className="text-center p-4 bg-white rounded-4 border border-warning-subtle shadow-sm">
                                    <div className="text-warning fw-bold mb-2">Thông báo</div>
                                    <div className="text-muted">Giáo viên chưa cho phép xem chi tiết đáp án của bài thi này.</div>
                                </div>
                            )}

                            {showDetails && (
                                <div className="d-flex gap-4 quiz-review-animate-fade-in">
                                    <div className="flex-grow-1">
                                        <div className="questions-list-v3">
                                            {effectiveSections.map((section, sIdx) => {
                                                const items = section.items || section.Items || [];
                                                let globalQuestionIndex = 0;
                                                
                                                return (
                                                    <section key={sIdx} className="section-block-v3 mb-5">
                                                        {section.title && <h4 className="section-title-v3 mb-4">{section.title}</h4>}
                                                        <div className="section-items-v3">
                                                            {items.map((item, itemIdx) => {
                                                                const itemType = item.itemType || item.ItemType;
                                                                const group = item.group || item.Group;
                                                                const q = item.question || item.Question;

                                                                if (itemType === "Group" && group) {
                                                                    return (
                                                                        <div key={itemIdx} className="question-group-v3 mb-4">
                                                                            <div className="group-info-v3 p-3 bg-white rounded border border-primary-subtle mb-3">
                                                                                {group.title && <h5 className="fw-bold text-primary mb-2">{group.title}</h5>}
                                                                                {group.description && <div className="small text-dark" dangerouslySetInnerHTML={{ __html: group.description }} />}
                                                                            </div>
                                                                            <div className="group-questions-v3 ms-3">
                                                                                {(group.questions || []).map((gq, gqIdx) => (
                                                                                    <QuizAttemptQuestion
                                                                                        key={gq.questionId || gqIdx}
                                                                                        question={gq}
                                                                                        index={globalQuestionIndex++}
                                                                                        getQuestionTypeLabel={getQuestionTypeLabel}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else if (itemType === "Question" && q) {
                                                                    return (
                                                                        <QuizAttemptQuestion
                                                                            key={q.questionId || itemIdx}
                                                                            question={q}
                                                                            index={globalQuestionIndex++}
                                                                            getQuestionTypeLabel={getQuestionTypeLabel}
                                                                        />
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </div>
                                                    </section>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <aside className="quiz-results-sidebar-v3" style={{ width: '320px', flexShrink: 0 }}>
                                        <div className="sticky-sidebar-v3" style={{ position: 'sticky', top: '24px' }}>
                                            <QuizAttemptSidebar
                                                effectiveSections={effectiveSections}
                                                totalScore={totalScore}
                                                maxScore={maxScore}
                                                questionsCount={questions.length}
                                                scrollToQuestion={scrollToQuestion}
                                            />
                                        </div>
                                    </aside>
                                </div>
                            )}
                            {showDetails && (
                                <div className="d-flex justify-content-center mt-5 mb-5">
                                    <Button variant="outline-secondary" onClick={() => setShowDetails(false)} className="rounded-pill px-5 py-2 fw-bold shadow-sm me-3">
                                        Thu gọn bài làm
                                    </Button>
                                    <Button variant="secondary" onClick={handleBack} className="rounded-pill px-5 py-2 fw-bold shadow-sm">
                                        Quay lại khóa học
                                    </Button>
                                </div>
                            )}

                            {!showDetails && (
                                <div className="d-flex justify-content-center mt-4 mb-5">
                                    <Button variant="secondary" onClick={handleBack} className="rounded-pill px-5 py-2 fw-bold shadow-sm">
                                        Quay lại khóa học
                                    </Button>
                                </div>
                            )}
                        </main>
                    </div>
                </Container>
            </div>
        </div>
    );
}

