import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Row, Col, Card } from "react-bootstrap";
import { FaQuestionCircle, FaEdit, FaCheckCircle, FaRandom } from "react-icons/fa";
import { useSubmissionStatus } from "../../../hooks/useSubmissionStatus";
import { quizAttemptService } from "../../../Services/quizAttemptService";
import { essayService } from "../../../Services/essayService";
import { essaySubmissionService } from "../../../Services/essaySubmissionService";
import { quizService } from "../../../Services/quizService";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import "./AssessmentInfoModal.css";

export default function AssessmentInfoModal({
    isOpen,
    onClose,
    assessment,
    onStartQuiz,
    onStartEssay
}) {
    useSubmissionStatus();
    const [quiz, setQuiz] = useState(null);
    const [essay, setEssay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [inProgressAttempt, setInProgressAttempt] = useState(null);
    const [checkingProgress, setCheckingProgress] = useState(false);
    const [essayHasSubmission, setEssayHasSubmission] = useState(false);
    const [showCannotStartModal, setShowCannotStartModal] = useState(false);
    const [differentQuizTitle, setDifferentQuizTitle] = useState("");

    const checkGlobalProgress = useCallback(async () => {
        setCheckingProgress(true);
        console.log(" [AssessmentInfoModal] Checking global active attempt via API");

        try {
            const response = await quizAttemptService.checkAnyActiveAttempt();
            const attemptData = response.data?.data;
            const hasActive = attemptData?.hasActiveAttempt || attemptData?.HasActiveAttempt;

            if (response.data?.success && hasActive) {
                console.log(" [AssessmentInfoModal] Found global active attempt:", attemptData);
                
                setInProgressAttempt({
                    attemptId: attemptData.attemptId || attemptData.AttemptId,
                    quizId: attemptData.quizId || attemptData.QuizId,
                    courseId: attemptData.courseId || attemptData.CourseId,
                    lessonId: attemptData.lessonId || attemptData.LessonId,
                    moduleId: attemptData.moduleId || attemptData.ModuleId,
                    quizTitle: attemptData.quizTitle || attemptData.QuizTitle || "Bài làm dở"
                });

                const currentQuizId = assessment?.quizId || assessment?.QuizId;
                const activeQuizId = attemptData.quizId || attemptData.QuizId;

                // Nếu đang làm dở một bài KHÁC với bài hiện tại
                if (currentQuizId && activeQuizId && parseInt(currentQuizId) !== parseInt(activeQuizId)) {
                    setDifferentQuizTitle(attemptData.quizTitle || attemptData.QuizTitle || "một bài khác");
                } else {
                    setDifferentQuizTitle("");
                }
            } else {
                console.log(" [AssessmentInfoModal] No active attempt found globally");
                setInProgressAttempt(null);
                setDifferentQuizTitle("");
            }
        } catch (err) {
            console.error(" [AssessmentInfoModal] Error checking global progress:", err);
            setInProgressAttempt(null);
        } finally {
            setCheckingProgress(false);
        }
    }, [assessment]);

    const checkEssaySubmission = useCallback(async (essayId) => {
        try {
            const statusResponse = await essaySubmissionService.getSubmissionStatus(essayId);
            if (statusResponse?.data?.success && statusResponse?.data?.data) {
                const submission = statusResponse.data.data;
                if (submission && (submission.submissionId || submission.SubmissionId)) {
                    setEssayHasSubmission(true);
                } else {
                    setEssayHasSubmission(false);
                }
            } else {
                setEssayHasSubmission(false);
            }
        } catch (err) {
            console.log(" [AssessmentInfoModal] No essay submission found:", err);
            setEssayHasSubmission(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !assessment) return;

        const loadData = async () => {
            setLoading(true);
            setError("");
            setQuiz(null);
            setEssay(null);
            setInProgressAttempt(null);
            setEssayHasSubmission(false);
            setDifferentQuizTitle("");

            try {
                const quizId = assessment.quizId || assessment.QuizId;
                const essayId = assessment.essayId || assessment.EssayId;

                if (quizId) {
                    const quizResponse = await quizService.getById(quizId);
                    if (quizResponse.data?.success && quizResponse.data?.data) {
                        setQuiz(quizResponse.data.data);
                        await checkGlobalProgress();
                    } else {
                        setError("Không thể tải thông tin quiz");
                    }
                } else if (essayId) {
                    const essayResponse = await essayService.getById(essayId);
                    if (essayResponse.data?.success && essayResponse.data?.data) {
                        setEssay(essayResponse.data.data);
                        await checkEssaySubmission(essayId);
                    } else {
                        setError("Không thể tải thông tin essay");
                    }
                } else {
                    setError("Không tìm thấy thông tin quiz hoặc essay");
                }
            } catch (err) {
                console.error("Error loading assessment data:", err);
                setError("Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, assessment, checkGlobalProgress, checkEssaySubmission]);

    const formatDate = (dateString) => {
        if (!dateString) return "Không có";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatTimeLimit = (timeLimit) => {
        if (!timeLimit) return "Không giới hạn";
        if (typeof timeLimit === 'string') {
            const parts = timeLimit.split(':');
            const hours = parseInt(parts[0]) || 0;
            const minutes = parseInt(parts[1]) || 0;
            if (hours > 0) {
                return `${hours} giờ ${minutes} phút`;
            }
            return `${minutes} phút`;
        }
        if (typeof timeLimit === 'number') {
            if (timeLimit >= 60) {
                const hours = Math.floor(timeLimit / 60);
                const mins = timeLimit % 60;
                return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
            }
            return `${timeLimit} phút`;
        }
        return "Không giới hạn";
    };

    const handleStart = async (isNewAttempt = true) => {
        if (quiz) {
            try {
                setLoading(true);

                if (isNewAttempt && inProgressAttempt && inProgressAttempt.attemptId) {
                    setShowCannotStartModal(true);
                    setLoading(false);
                    return;
                }

                if (!isNewAttempt && inProgressAttempt && inProgressAttempt.attemptId) {
                    console.log(" [AssessmentInfoModal] Continuing in-progress attempt:", inProgressAttempt.attemptId);
                    onStartQuiz({
                        ...assessment,
                        attemptId: inProgressAttempt.attemptId,
                        quizId: inProgressAttempt.quizId,
                        courseId: inProgressAttempt.courseId,
                        lessonId: inProgressAttempt.lessonId,
                        moduleId: inProgressAttempt.moduleId,
                        isGlobalResume: true
                    });
                    onClose();
                    return;
                }

                console.log(" [AssessmentInfoModal] Starting new quiz attempt");
                const response = await quizAttemptService.start(quiz.quizId || quiz.QuizId);
                if (response.data?.success && response.data?.data) {
                    const attemptData = response.data.data;
                    const attemptId = attemptData.attemptId || attemptData.AttemptId;
                    const quizId = attemptData.quizId || attemptData.QuizId || quiz.quizId || quiz.QuizId;

                    onStartQuiz({
                        ...assessment,
                        attemptId,
                        quizId,
                        attemptData
                    });
                    onClose();
                } else {
                    setShowCannotStartModal(true);
                    setLoading(false);
                }
            } catch (err) {
                console.error("❌ [AssessmentInfoModal] Error starting quiz:", err);
                const msg = err.response?.data?.message || "Không thể bắt đầu làm quiz";
                if (msg && /active|already|đang làm|đã có/i.test(msg)) {
                    await checkGlobalProgress();
                    setShowCannotStartModal(true);
                } else {
                    setError(msg);
                }
                setLoading(false);
            }
        } else if (essay) {
            const essayId = essay.essayId || essay.EssayId;
            if (essayId) {
                onStartEssay({
                    ...assessment,
                    essayId: essayId
                });
                onClose();
            } else {
                setError("Không tìm thấy thông tin essay");
            }
        }
    };

    if (!isOpen || !assessment) return null;

    const isQuiz = !!quiz;

    return (
        <>
            <Modal
                show={isOpen}
                onHide={onClose}
                centered
                className="modal-modern assessment-info-modal"
                dialogClassName="modal-lg-custom"
                backdrop={loading || checkingProgress ? 'static' : true}
                keyboard={!(loading || checkingProgress)}
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-center w-100">
                        <div className="d-flex flex-column align-items-center">
                            <div className="mb-3">
                                {isQuiz ? (
                                    <FaQuestionCircle className="text-white" size={48} />
                                ) : (
                                    <FaEdit className="text-white" size={48} />
                                )}
                            </div>
                            <div>{assessment.title}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {loading || checkingProgress ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-3 text-muted">Đang tải thông tin...</p>
                        </div>
                    ) : (
                        <>
                            {(quiz?.title || assessment.title) && (
                                <div className="form-section-card mb-3">
                                    <div className="form-section-title">
                                        <FaEdit className="me-2" />
                                        Tiêu đề
                                    </div>
                                    <div className="mt-2">
                                        <p className="mb-0">{quiz?.title || assessment.title}</p>
                                    </div>
                                </div>
                            )}

                            {(quiz?.description || assessment.description) && (
                                <div className="form-section-card mb-3">
                                    <div className="form-section-title">
                                        <FaEdit className="me-2" />
                                        Mô tả
                                    </div>
                                    <div className="mt-2">
                                        <p className="mb-0">{quiz?.description || assessment.description}</p>
                                    </div>
                                </div>
                            )}

                            {quiz?.instructions && (
                                <div className="form-section-card mb-3">
                                    <div className="form-section-title">
                                        <FaEdit className="me-2" />
                                        Hướng dẫn
                                    </div>
                                    <div className="mt-2">
                                        <p className="mb-0">{quiz.instructions}</p>
                                    </div>
                                </div>
                            )}

                            <Row className="g-3 mb-3">
                                {(quiz?.duration || assessment.timeLimit) && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Thời gian làm bài</div>
                                                <div className="fw-bold">
                                                    {formatTimeLimit(quiz?.duration || assessment.timeLimit)}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {quiz?.totalQuestions && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Tổng số câu hỏi</div>
                                                <div className="fw-bold">{quiz.totalQuestions} câu</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {(quiz?.passingScore !== undefined || assessment.passingScore) && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Điểm đạt</div>
                                                <div className="fw-bold">
                                                    {quiz?.passingScore !== undefined ? quiz.passingScore : assessment.passingScore} điểm
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {assessment.totalPoints && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Tổng điểm</div>
                                                <div className="fw-bold">{assessment.totalPoints} điểm</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {quiz?.maxAttempts !== undefined && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Số lần làm tối đa</div>
                                                <div className="fw-bold">
                                                    {quiz.allowUnlimitedAttempts || quiz.maxAttempts === null ? "Không giới hạn" : `${quiz.maxAttempts} lần`}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {(quiz?.availableFrom || assessment.openAt) && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Mở từ</div>
                                                <div className="fw-bold">
                                                    {formatDate(quiz?.availableFrom || assessment.openAt)}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}

                                {assessment.dueAt && (
                                    <Col md={6}>
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="text-muted small mb-1">Hạn nộp</div>
                                                <div className="fw-bold">{formatDate(assessment.dueAt)}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}
                            </Row>

                            {quiz && (quiz.shuffleQuestions || quiz.shuffleAnswers || quiz.showAnswersAfterSubmit || quiz.showScoreImmediately) && (
                                <div className="form-section-card mb-3">
                                    <div className="form-section-title">
                                        <FaCheckCircle className="me-2" />
                                        Thông tin bổ sung
                                    </div>
                                    <div className="mt-2">
                                        <div className="d-flex flex-wrap gap-2">
                                            {quiz.shuffleQuestions && (
                                                <span className="badge bg-primary">
                                                    <FaRandom className="me-1" />
                                                    Câu hỏi được xáo trộn
                                                </span>
                                            )}
                                            {quiz.shuffleAnswers && (
                                                <span className="badge bg-primary">
                                                    <FaRandom className="me-1" />
                                                    Đáp án được xáo trộn
                                                </span>
                                            )}
                                            {quiz.showAnswersAfterSubmit && (
                                                <span className="badge bg-success">
                                                    <FaCheckCircle className="me-1" />
                                                    Hiển thị đáp án sau khi nộp
                                                </span>
                                            )}
                                            {quiz.showScoreImmediately && (
                                                <span className="badge bg-success">
                                                    <FaCheckCircle className="me-1" />
                                                    Hiển thị điểm ngay lập tức
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer className="d-flex flex-column gap-2">
                    {isQuiz && inProgressAttempt && (
                        <Button
                            variant="outline-primary"
                            className="w-100"
                            onClick={() => handleStart(false)}
                            disabled={loading || checkingProgress}
                        >
                            {loading || checkingProgress ? "Đang tải..." : (differentQuizTitle ? `Tiếp tục: ${differentQuizTitle}` : "Tiếp tục bài đang làm")}
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        className={`w-100 ${isQuiz ? "btn-quiz" : "btn-essay"}`}
                        onClick={() => handleStart(true)}
                        disabled={loading || checkingProgress || (!quiz && !essay) || (differentQuizTitle !== "" && inProgressAttempt)}
                    >
                        {loading || checkingProgress ? "Đang tải..." : (isQuiz ? "Bắt đầu làm bài" : (essayHasSubmission ? "Cập nhật Essay" : "Bắt đầu viết Essay"))}
                    </Button>
                    <Button
                        variant="outline-secondary"
                        className="w-100"
                        onClick={onClose}
                        disabled={loading || checkingProgress}
                    >
                        Hủy
                    </Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                isOpen={showCannotStartModal}
                onClose={() => setShowCannotStartModal(false)}
                onConfirm={() => {
                    setShowCannotStartModal(false);
                    handleStart(false);
                }}
                title="Không thể bắt đầu bài mới"
                message={differentQuizTitle 
                    ? `Bạn đang có một bài quiz chưa hoàn thành: "${differentQuizTitle}". Bạn phải hoàn thành bài đó trước khi bắt đầu bài mới.`
                    : "Bạn đang có một bài quiz chưa hoàn thành. Vui lòng tiếp tục bài đang làm hoặc nộp bài trước khi bắt đầu bài mới."
                }
                confirmText={differentQuizTitle ? "Tiếp tục bài làm dở" : "Tiếp tục làm bài"}
                cancelText="Đóng"
                type="warning"
            />
        </>
    );
}
