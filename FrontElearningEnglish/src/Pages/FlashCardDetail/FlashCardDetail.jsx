import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import FlashCardProgressBar from "../../Components/FlashCardDetail/FlashCardProgressBar/FlashCardProgressBar";
import FlashCardViewer from "../../Components/FlashCardDetail/FlashCardViewer/FlashCardViewer";
import { flashcardService } from "../../Services/flashcardService";
import { moduleService } from "../../Services/moduleService";
import { lessonService } from "../../Services/lessonService";
import { courseService } from "../../Services/courseService";
import { flashcardReviewService } from "../../Services/flashcardReviewService";
import { FlashCardSkeleton } from "../../Components/Common/Skeleton/LectureDetailSkeleton";
import "./FlashCardDetail.css";
import "./FlashCardCompletion.css";

export default function FlashCardDetail() {
    const { courseId, lessonId, moduleId } = useParams();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [module, setModule] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionMessage, setCompletionMessage] = useState("");
    const moduleStartedRef = useRef(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");
                const parsedModuleId = parseInt(moduleId);
                if (parsedModuleId && !moduleStartedRef.current.has(parsedModuleId)) {
                    try {
                        await moduleService.startModule(parsedModuleId);
                        moduleStartedRef.current.add(parsedModuleId);
                    } catch (err) { console.error(err); }
                }

                const [courseRes, lessonRes, moduleRes, flashcardsRes] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessonById(lessonId),
                    moduleService.getModuleById(moduleId),
                    flashcardService.getFlashcardsByModuleId(moduleId)
                ]);

                if (courseRes.data?.success) setCourse(courseRes.data.data);
                if (lessonRes.data?.success) setLesson(lessonRes.data.data);
                if (moduleRes.data?.success) setModule(moduleRes.data.data);

                if (flashcardsRes.data?.success) {
                    const flashcardsData = flashcardsRes.data.data;
                    const flashcardsWithDetails = await Promise.all(
                        flashcardsData.map(async (f) => {
                            try {
                                if (f.example && f.exampleTranslation) return f;
                                const detail = await flashcardService.getFlashcardById(f.flashCardId);
                                return detail.data?.success ? { ...f, ...detail.data.data } : f;
                            } catch { return f; }
                        })
                    );
                    setFlashcards(flashcardsWithDetails);
                    if (flashcardsWithDetails.length > 0) setCurrentIndex(0);
                } else {
                    setError(flashcardsRes.data?.message || "Không thể tải danh sách flashcard");
                }
            } catch (err) {
                setError("Không thể tải dữ liệu flashcard");
            } finally {
                setLoading(false);
            }
        };

        if (moduleId) fetchData();
    }, [moduleId, courseId, lessonId]);

    const handlePrevious = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);
    const handleNext = () => currentIndex < flashcards.length - 1 && setCurrentIndex(currentIndex + 1);

    const handleComplete = async () => {
        try {
            const response = await flashcardReviewService.startModule(moduleId);
            if (response.data?.success) {
                setCompletionMessage(response.data.message || `Bạn đã thêm ${flashcards.length} từ vào danh sách ôn tập`);
                setShowCompletion(true);
            } else { setError(response.data?.message); }
        } catch { setError("Lỗi khi hoàn thành module"); }
    };

    const lessonTitle = lesson?.title || lesson?.Title || "Bài học";
    const courseTitle = course?.title || course?.Title || "Khóa học";
    const moduleName = module?.name || module?.Name || "Module";

    return (
        <>
            <MainHeader />
            <div className="flashcard-detail-container">
                <Container>
                    <Breadcrumb
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: courseTitle, path: `/course/${courseId}` },
                            { label: "Học tập", path: `/course/${courseId}/learn` },
                            { label: lessonTitle, path: `/course/${courseId}/lesson/${lessonId}` },
                            { label: moduleName, isCurrent: true }
                        ]}
                    />
                </Container>

                {loading ? (
                    <Container className="flashcard-content-container"><FlashCardSkeleton /></Container>
                ) : error ? (
                    <div className="error-message text-center py-5">{error}</div>
                ) : flashcards.length === 0 ? (
                    <div className="no-flashcards-message text-center py-5">Chưa có flashcard nào</div>
                ) : showCompletion ? (
                    <Container>
                        <div className="flashcard-completion-screen d-flex flex-column align-items-center justify-content-center">
                            <div className="completion-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.2" /><path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="completion-title">Hoàn thành Flash Card!</h2>
                            <p className="completion-message">{completionMessage}</p>
                            <div className="completion-actions d-flex gap-3 mt-4">
                                <button className="completion-back-button secondary" onClick={() => navigate(`/course/${courseId}/lesson/${lessonId}`)}>Trở về</button>
                                <button className="completion-pronunciation-button" onClick={() => navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/pronunciation`)}>Luyện phát âm ngay</button>
                            </div>
                        </div>
                    </Container>
                ) : (
                    <Container className="flashcard-content-container d-flex flex-column align-items-center">
                        <FlashCardProgressBar current={currentIndex + 1} total={flashcards.length} />
                        <FlashCardViewer
                            flashcard={flashcards[currentIndex]}
                            onPrevious={handlePrevious} onNext={handleNext}
                            canGoPrevious={currentIndex > 0} canGoNext={currentIndex < flashcards.length - 1}
                            isLastCard={currentIndex === flashcards.length - 1} onComplete={handleComplete}
                        />
                    </Container>
                )}
            </div>
        </>
    );
}
