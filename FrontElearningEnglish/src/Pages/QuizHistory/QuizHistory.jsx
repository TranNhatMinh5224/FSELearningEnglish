import React, { useEffect, useState } from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import CustomPagination from "../../Components/Common/Pagination/CustomPagination";
import "./QuizHistory.css";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import { quizService } from "../../Services/quizService";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../../Routes/Paths";
import { FaCalendarAlt, FaTrophy, FaChevronRight, FaRegClipboard } from "react-icons/fa";

export default function QuizHistory() {
    const navigate = useNavigate();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(6); // Each card takes more space

    useEffect(() => {
        const fetchQuizHistory = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await quizService.getAllHistory();
                if (response.data?.success && response.data?.data) {
                    setAttempts(response.data.data);
                } else {
                    setError(response.data?.message || "Không thể tải lịch sử làm bài");
                }
            } catch (err) {
                console.error("Error fetching quiz history:", err);
                setError("Không thể tải dữ liệu lịch sử làm bài");
            } finally {
                setLoading(false);
            }
        };

        fetchQuizHistory();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }) + " " + date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusBadge = (status) => {
        // Status: 1=InProgress, 2=Submitted, 3=Graded, 4=TimeExpired, 5=Abandoned
        const statusCode = Number(status);
        switch (statusCode) {
            case 1:
                return <span className="status-badge-custom status-inprogress">Đang làm</span>;
            case 2:
            case 3:
                return <span className="status-badge-custom status-completed">Đã hoàn thành</span>;
            case 4:
                return <span className="status-badge-custom status-expired">Hết giờ</span>;
            case 5:
                return <span className="status-badge-custom status-abandoned">Bỏ dở</span>;
            default:
                return <span className="status-badge-custom status-unknown">Chưa rõ</span>;
        }
    };

    const handleReview = (attempt) => {
        const aId = attempt.attemptId || attempt.AttemptId;
        const cId = attempt.courseId || attempt.CourseId;
        const lId = attempt.lessonId || attempt.LessonId;
        const mId = attempt.moduleId || attempt.ModuleId;
        const qId = attempt.quizId || attempt.QuizId;

        if (aId && cId && lId && mId && qId) {
            navigate(`/course/${cId}/lesson/${lId}/module/${mId}/quiz/${qId}/attempt/${aId}/results`);
        } else {
            console.warn("Missing IDs for navigation:", { aId, cId, lId, mId, qId });
            // Fallback: If we don't have all IDs, we could potentially use a different route
            // for viewing results, but for now we log it.
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentItems = attempts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(attempts.length / pageSize);

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="quiz-history-container">
                    <Container>
                        <div className="loading-wrapper">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h3 className="mt-4 fw-bold text-secondary">Đang chuẩn bị dữ liệu...</h3>
                        </div>
                    </Container>
                </div>
            </>
        );
    }

    return (
        <>
            <MainHeader />
            <div className="quiz-history-container">
                <Container>
                    <Breadcrumb 
                        items={[
                            { label: "Lịch sử làm bài", isCurrent: true }
                        ]}
                    />
                    
                    <div className="quiz-history-header mt-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <h1 className="quiz-history-title">Lịch sử làm bài</h1>
                                <p className="quiz-history-subtitle">
                                    Theo dõi tiến trình và kết quả rèn luyện của bạn
                                </p>
                            </div>
                            <div className="stats-highlight">
                                <div className="stat-card">
                                    <span className="stat-label">Tổng bài đã làm</span>
                                    <span className="stat-value">{attempts.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="error-state text-center mt-5">
                            <div className="error-icon text-danger mb-3" style={{ fontSize: "3rem" }}>⚠️</div>
                            <h4 className="text-danger fw-bold">{error}</h4>
                            <p className="text-secondary">Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.</p>
                            <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
                                Tải lại trang
                            </button>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <p className="empty-title">Chưa có dữ liệu học tập</p>
                            <p className="empty-subtitle">Bạn chưa thực hiện bài Quiz nào. Hãy bắt đầu học để cải thiện trình độ nhé!</p>
                            <button className="btn-go-check" onClick={() => navigate(ROUTE_PATHS.MY_COURSES)}>
                                Khám phá các khóa học ngay
                            </button>
                        </div>
                    ) : (
                        <div className="quiz-list-container">
                            <Row className="quiz-list-header g-0">
                                <Col xs={12} md={4} className="header-column">
                                    <span>Bài Quiz</span>
                                </Col>
                                <Col xs={4} md={2} className="header-column text-center">
                                    <span>Lần làm</span>
                                </Col>
                                <Col xs={4} md={2} className="header-column text-center">
                                    <span>Điểm số</span>
                                </Col>
                                <Col xs={4} md={2} className="header-column text-center">
                                    <span>Trạng thái</span>
                                </Col>
                                <Col xs={12} md={2} className="header-column text-center">
                                    <span>Ngày làm</span>
                                </Col>
                            </Row>

                            <div className="quiz-list-body">
                                        {currentItems.map((attempt) => {
                                            const aId = attempt.attemptId || attempt.AttemptId;
                                            const title = attempt.quizTitle || attempt.QuizTitle || "Bài kiểm tra";
                                            const aNumber = attempt.attemptNumber || attempt.AttemptNumber;
                                            const score = attempt.totalScore ?? attempt.TotalScore ?? 0;
                                            const maxScoreRaw = attempt.totalPossibleScore ?? attempt.TotalPossibleScore;
                                            const maxScore = Number(maxScoreRaw) > 0 ? maxScoreRaw : 10;
                                            const status = attempt.status ?? attempt.Status;
                                            const startedAt = attempt.startedAt || attempt.StartedAt;

                                            return (
                                                <div 
                                                    key={aId} 
                                                    className="quiz-history-item-row"
                                                    onClick={() => handleReview(attempt)}
                                                >
                                                    <Row className="g-0 align-items-center">
                                                        <Col xs={12} md={4} className="quiz-info">
                                                            <div className="quiz-title-wrapper">
                                                                <FaRegClipboard className="item-icon-small" />
                                                                <span className="quiz-name">{title}</span>
                                                            </div>
                                                        </Col>
                                                        <Col xs={4} md={2} className="attempt-info text-center">
                                                            <span className="label d-md-none">Lần: </span>
                                                            <span className="attempt-badge">#{aNumber}</span>
                                                        </Col>
                                                        <Col xs={4} md={2} className="score-info text-center">
                                                            <span className="label d-md-none">Điểm: </span>
                                                            <span className="score-value-text">{score}</span>
                                                            <span className="score-max">/{maxScore}</span>
                                                        </Col>
                                                        <Col xs={4} md={2} className="status-info text-center">
                                                            {getStatusBadge(status)}
                                                        </Col>
                                                        <Col xs={12} md={2} className="date-info text-center">
                                                            <span className="date-text-small">{formatDate(startedAt)}</span>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            );
                                        })}
                            </div>

                            {/* Pagination */}
                            <CustomPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalCount={attempts.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                showInfo={false}
                            />
                        </div>
                    )}
                </Container>
            </div>
        </>
    );
}
