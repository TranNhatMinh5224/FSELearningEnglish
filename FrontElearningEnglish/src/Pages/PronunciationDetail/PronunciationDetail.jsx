import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import PronunciationCard from "../../Components/PronunciationDetail/PronunciationCard/PronunciationCard";
import { pronunciationService } from "../../Services/pronunciationService";
import { moduleService } from "../../Services/moduleService";
import { lessonService } from "../../Services/lessonService";
import { courseService } from "../../Services/courseService";
import "./PronunciationDetail.css";

export default function PronunciationDetail() {
    const { courseId, lessonId, moduleId } = useParams();
    const navigate = useNavigate();

    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [module, setModule] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionResults, setSessionResults] = useState({}); // Tracking results for this specific session

    useEffect(() => {
    }, [courseId, lessonId, moduleId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                // Fetch course info
                const courseRes = await courseService.getCourseById(courseId);
                if (courseRes.data?.success) setCourse(courseRes.data.data);
                
                // Fetch lesson info
                const lessonRes = await lessonService.getLessonById(lessonId);
                if (lessonRes.data?.success) setLesson(lessonRes.data.data);
                
                // Fetch module info
                const moduleRes = await moduleService.getModuleById(moduleId);
                if (moduleRes.data?.success) setModule(moduleRes.data.data);

                // Fetch flashcards with pronunciation progress
                const flashcardsResponse = await pronunciationService.getByModule(moduleId);
                if (flashcardsResponse.data?.success && flashcardsResponse.data?.data) {
                    const flashcardsData = flashcardsResponse.data.data;

                    // Always fetch detailed information for each flashcard to get correct audioUrl
                    // (Same as FlashCardDetail - pronunciation API may return incorrect audioUrl)
                    const { flashcardService } = await import("../../Services/flashcardService");
                    const flashcardsWithDetails = await Promise.all(
                        flashcardsData.map(async (flashcard) => {
                            try {
                                const flashCardId = flashcard.flashCardId || flashcard.FlashCardId;

                                // Always fetch detailed flashcard to get correct audioUrl
                                const detailResponse = await flashcardService.getFlashcardById(flashCardId);
                                if (
                                    detailResponse.data?.success &&
                                    detailResponse.data?.data
                                ) {
                                    // Merge detail data with list data - prioritize detail API audioUrl
                                    return {
                                        ...flashcard,
                                        audioUrl:
                                            detailResponse.data.data.audioUrl ||
                                            detailResponse.data.data.AudioUrl ||
                                            flashcard.audioUrl ||
                                            flashcard.AudioUrl,
                                        imageUrl:
                                            detailResponse.data.data.imageUrl ||
                                            detailResponse.data.data.ImageUrl ||
                                            flashcard.imageUrl ||
                                            flashcard.ImageUrl,
                                        pronunciation:
                                            detailResponse.data.data.pronunciation ||
                                            flashcard.pronunciation ||
                                            flashcard.Phonetic,
                                        phonetic:
                                            detailResponse.data.data.pronunciation ||
                                            flashcard.phonetic ||
                                            flashcard.Phonetic,
                                    };
                                }
                                return flashcard;
                            } catch (err) {
                                console.error(
                                    `Error fetching detail for flashcard ${flashcard.flashCardId || flashcard.FlashCardId}:`,
                                    err
                                );
                                return flashcard; // Return original if detail fetch fails
                            }
                        })
                    );

                    setFlashcards(flashcardsWithDetails);
                    if (flashcardsWithDetails.length > 0) {
                        setCurrentIndex(0);
                    }
                } else {
                    setError(flashcardsResponse.data?.message || "Không thể tải danh sách flashcard");
                }

                // Fetch summary
                const summaryResponse = await pronunciationService.getModuleSummary(moduleId);
                if (summaryResponse.data?.success && summaryResponse.data?.data) {
                    setSummary(summaryResponse.data.data);
                }
            } catch (err) {
                console.error("Error fetching pronunciation data:", err);
                setError("Không thể tải dữ liệu phát âm");
            } finally {
                setLoading(false);
            }
        };

        if (moduleId) {
            fetchData();
        }
    }, [moduleId, courseId, lessonId]);

    const handleBackClick = () => {
        navigate(`/course/${courseId}/lesson/${lessonId}`);
    };

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleAssessmentComplete = async (assessmentResult) => {
        // Record result for this session
        if (assessmentResult && currentFlashcard) {
            const cardId = currentFlashcard.flashCardId || currentFlashcard.FlashCardId;
            setSessionResults(prev => ({
                ...prev,
                [cardId]: assessmentResult
            }));
        }

        // Reload data from backend to update persistent progress
        try {
            const flashcardsResponse = await pronunciationService.getByModule(moduleId);
            if (flashcardsResponse.data?.success && flashcardsResponse.data?.data) {
                setFlashcards(flashcardsResponse.data.data);
            }

            // Reload summary
            const summaryResponse = await pronunciationService.getModuleSummary(moduleId);
            if (summaryResponse.data?.success && summaryResponse.data?.data) {
                setSummary(summaryResponse.data.data);
            }
        } catch (err) {
            console.error("Error reloading data:", err);
        }
    };

    const handleComplete = async () => {
        // Calculate session-based summary instead of using backend lifetime summary
        const practicedInSession = Object.keys(sessionResults);
        
        if (practicedInSession.length > 0) {
            const results = Object.values(sessionResults);
            
            const count = results.length;
            const avgScore = results.reduce((acc, r) => acc + (r.PronunciationScore || r.pronunciationScore || 0), 0) / count;
            const avgAccuracy = results.reduce((acc, r) => acc + (r.AccuracyScore || r.accuracyScore || 0), 0) / count;
            const avgFluency = results.reduce((acc, r) => acc + (r.FluencyScore || r.fluencyScore || 0), 0) / count;
            const avgCompleteness = results.reduce((acc, r) => acc + (r.CompletenessScore || r.completenessScore || 0), 0) / count;
            
            // Determine grade for this session
            let grade = "F";
            let message = "Cố gắng luyện tập thêm nhé!";
            
            if (avgScore >= 95) { grade = "A+"; message = "🌟 Session xuất sắc! Bạn phát âm rất chuẩn."; }
            else if (avgScore >= 90) { grade = "A"; message = "🎉 Session tuyệt vời! Tiếp tục phát huy nhé."; }
            else if (avgScore >= 80) { grade = "B"; message = "👍 Session khá tốt! Cố lên chút nữa để đạt A."; }
            else if (avgScore >= 70) { grade = "C"; message = "📚 Session đạt mức khá. Cần trau chuốt thêm."; }
            else if (avgScore >= 60) { grade = "D"; message = "💪 Session này tạm ổn, hãy nghe kỹ lại phát âm chuẩn."; }

            setSummary({
                totalFlashCards: flashcards.length,
                totalPracticed: count,
                masteredCount: results.filter(r => (r.PronunciationScore || r.pronunciationScore || 0) >= 90).length,
                averageScore: avgScore,
                averageAccuracyScore: avgAccuracy,
                averageFluencyScore: avgFluency,
                averageCompletenessScore: avgCompleteness,
                grade: grade,
                message: message,
                isSessionRecent: true
            });
        }
        
        setShowSummary(true);
    };

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="pronunciation-detail-container">
                    <Container>
                        <div className="loading-message">Đang tải...</div>
                    </Container>
                </div>
            </>
        );
    }

    if (error && flashcards.length === 0) {
        return (
            <>
                <MainHeader />
                <div className="pronunciation-detail-container">
                    <Container>
                        <div className="error-message">{error}</div>
                        <Button variant="primary" onClick={handleBackClick} className="mt-3">
                            Quay lại
                        </Button>
                    </Container>
                </div>
            </>
        );
    }

    const currentFlashcard = flashcards[currentIndex];
    const canGoNext = currentIndex < flashcards.length - 1;
    const canGoPrevious = currentIndex > 0;

    return (
        <>
            <MainHeader />
            <div className="pronunciation-detail-container">
                <Container>
                    <Breadcrumb 
                        className="pronunciation-breadcrumb"
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: course?.title || "Khóa học", path: `/course/${courseId}` },
                            { label: "Lesson", path: `/course/${courseId}/learn` },
                            { label: lesson?.title || "Bài học", path: `/course/${courseId}/lesson/${lessonId}` },
                            { label: "Luyện phát âm", isCurrent: true }
                        ]}
                    />
                    <Row>
                        <Col>
                            <div className="pronunciation-header d-flex align-items-center justify-content-center gap-3">
                                <h1 className="pronunciation-title">Luyện Phát Âm</h1>
                            </div>
                        </Col>
                    </Row>

                    {!showSummary && currentFlashcard && (
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <PronunciationCard
                                    flashcard={currentFlashcard}
                                    currentIndex={currentIndex}
                                    totalCards={flashcards.length}
                                    onNext={handleNext}
                                    onPrevious={handlePrevious}
                                    canGoNext={canGoNext}
                                    canGoPrevious={canGoPrevious}
                                    onAssessmentComplete={handleAssessmentComplete}
                                    onComplete={handleComplete}
                                />
                            </Col>
                        </Row>
                    )}

                    {showSummary && summary && (
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <div className="pronunciation-summary">
                                    <h2 className="summary-title">
                                        {summary.isSessionRecent ? "Kết quả lượt vừa luyện" : "Kết quả luyện phát âm"}
                                    </h2>
                                    <Row className="summary-stats g-3">
                                        <Col xs={6} md={4} lg={3} className="stat-item">
                                            <div className="stat-value">{summary.totalFlashCards || 0}</div>
                                            <div className="stat-label">Tổng số từ</div>
                                        </Col>
                                        <Col xs={6} md={4} lg={3} className="stat-item">
                                            <div className="stat-value">{summary.totalPracticed || 0}</div>
                                            <div className="stat-label">Từ đã luyện</div>
                                        </Col>
                                        <Col xs={6} md={4} lg={3} className="stat-item">
                                            <div className="stat-value">{summary.masteredCount || 0}</div>
                                            <div className="stat-label">Phát âm chuẩn</div>
                                        </Col>
                                        <Col xs={6} md={4} lg={3} className="stat-item">
                                            <div className="stat-value">{summary.averageScore?.toFixed(1) || 0}</div>
                                            <div className="stat-label">Điểm trung bình</div>
                                        </Col>
                                        
                                        {/* New Detailed Stats */}
                                        <Col xs={6} md={4} lg={3} className="stat-item detail-stat">
                                            <div className="stat-value accuracy">{summary.averageAccuracyScore?.toFixed(1) || 0}%</div>
                                            <div className="stat-label">Độ chính xác</div>
                                        </Col>
                                        <Col xs={6} md={4} lg={3} className="stat-item detail-stat">
                                            <div className="stat-value fluency">{summary.averageFluencyScore?.toFixed(1) || 0}%</div>
                                            <div className="stat-label">Độ trôi chảy</div>
                                        </Col>
                                        <Col xs={6} md={4} lg={3} className="stat-item detail-stat">
                                            <div className="stat-value completeness">{summary.averageCompletenessScore?.toFixed(1) || 0}%</div>
                                            <div className="stat-label">Độ hoàn thiện</div>
                                        </Col>
                                    </Row>
                                    <div className="summary-grade d-flex align-items-center justify-content-center gap-3">
                                        <div className="grade-label">Xếp loại:</div>
                                        <div className="grade-value">{summary.grade || "N/A"}</div>
                                    </div>
                                    <div className="summary-message">
                                        <p>{summary.message || "Chúc mừng bạn đã hoàn thành!"}</p>
                                    </div>
                                    <div className="summary-actions d-flex justify-content-center">
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => {
                                                setShowSummary(false);
                                                setSessionResults({});
                                                setCurrentIndex(0);
                                            }}
                                            className="summary-action-button me-2"
                                        >
                                            Luyện lại
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            onClick={handleBackClick}
                                            className="summary-action-button"
                                        >
                                            Quay lại
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        </>
    );
}

