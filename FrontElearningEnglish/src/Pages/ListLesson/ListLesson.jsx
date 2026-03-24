import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import ListLessonHeader from "../../Components/ListLesson/ListLessonHeader/ListLessonHeader";
import LessonCard from "../../Components/ListLesson/LessonCard/LessonCard";
import ProgressBar from "../../Components/ListLesson/ProgressBar/ProgressBar";
import { lessonService } from "../../Services/lessonService";
import { courseService } from "../../Services/courseService";
import { moduleService } from "../../Services/moduleService";
import "./ListLesson.css";

export default function ListLesson() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                // Fetch course info
                const courseResponse = await courseService.getCourseById(courseId);
                if (courseResponse.data?.success && courseResponse.data?.data) {
                    setCourse(courseResponse.data.data);
                }

                // Fetch lessons
                const lessonsResponse = await lessonService.getLessonsByCourseId(courseId);
                if (lessonsResponse.data?.success && lessonsResponse.data?.data) {
                    const lessonsData = lessonsResponse.data.data;
                    const sortedLessons = lessonsData.sort((a, b) => {
                        const orderA = a.orderIndex || a.OrderIndex || 0;
                        const orderB = b.orderIndex || b.OrderIndex || 0;
                        return orderA - orderB;
                    });
                    setLessons(sortedLessons);
                }

                // Fetch modules for milestones
                try {
                    const modulesResponse = await moduleService.getModulesByCourseId(courseId);
                    if (modulesResponse.data?.success && modulesResponse.data?.data) {
                        setModules(modulesResponse.data.data);
                    }
                } catch (mErr) {
                    console.error("Error fetching modules:", mErr);
                }

            } catch (err) {
                console.error("Error fetching list lesson data:", err);
                setError("Không thể tải dữ liệu khóa học");
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const handleLessonClick = (lessonId) => {
        navigate(`/course/${courseId}/lesson/${lessonId}`);
    };

    // Tính toán milestones từ modules
    const calculateMilestones = () => {
        if (!modules || modules.length === 0 || lessons.length === 0) return [];

        let accumulatedLessons = 0;
        const totalLessonsCount = lessons.length;

        return modules.map(module => {
            // Đếm số bài học trong module này (giả sử backend trả về lessonIds hoặc tương đương)
            // Nếu không có data chính xác, chúng ta chia đều milestones theo số lượng module
            // Ở đây giả lập: chia đều
            const milestonePos = (Math.random() * 80) + 10; // Giả lập vị trí bài học
            return {
                title: module.title || module.Title,
                position: milestonePos
            };
        }).sort((a, b) => a.position - b.position);
    };

    // Lấy tiến độ từ API (ưu tiên) hoặc tính từ lessons array
    const getProgressData = () => {
        const apiCompletedLessons = course?.completedLessons || course?.CompletedLessons;
        const apiTotalLessons = course?.totalLessons || course?.TotalLessons;
        const apiProgressPercentage = course?.progressPercentage || course?.ProgressPercentage;

        if (apiCompletedLessons !== undefined && apiTotalLessons !== undefined) {
            const safePercentage = Math.min(Math.max(Number(apiProgressPercentage) || 0, 0), 100);
            return {
                completed: apiCompletedLessons,
                total: apiTotalLessons,
                percentage: safePercentage > 0 ? safePercentage : (apiTotalLessons > 0 ? Math.round((apiCompletedLessons / apiTotalLessons) * 100) : 0)
            };
        }

        const completedLessonsCount = lessons.filter(lesson =>
            lesson.isCompleted || lesson.IsCompleted
        ).length;
        const totalLessonsCount = lessons.length;
        const progressPercentage = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

        return {
            completed: completedLessonsCount,
            total: totalLessonsCount,
            percentage: progressPercentage
        };
    };

    const progressData = getProgressData();
    const milestones = calculateMilestones();

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="list-lesson-container">
                    <div className="loading-message">Đang tải...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <MainHeader />
                <div className="list-lesson-container">
                    <div className="error-message">{error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <MainHeader />
            <div className={`list-lesson-container ${isSticky ? "has-sticky-bar" : ""}`}>
                <Container>
                    <Breadcrumb
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: course?.title || course?.Title || "Khóa học", path: `/course/${courseId}` },
                            { label: "Bài học", isCurrent: true }
                        ]}
                    />
                    <ListLessonHeader courseTitle={course?.title || course?.Title || "Khóa học"} />

                    <div className={`progress-section ${isSticky ? "sticky-active" : ""}`}>
                        {progressData.total > 0 && (
                            <ProgressBar
                                completed={progressData.completed}
                                total={progressData.total}
                                percentage={progressData.percentage}
                                milestones={milestones}
                                variant="compact"
                            />
                        )}
                    </div>

                    <div className="lessons-list d-flex flex-column">
                        {lessons.length > 0 ? (
                            lessons.map((lesson, index) => {
                                const lessonId = lesson.lessonId || lesson.LessonId;
                                return (
                                    <LessonCard
                                        key={lessonId || index}
                                        lesson={lesson}
                                        orderNumber={index + 1}
                                        onClick={handleLessonClick}
                                    />
                                );
                            })
                        ) : (
                            <div className="no-lessons-message">Chưa có bài học nào</div>
                        )}
                    </div>
                </Container>
            </div>
        </>
    );
}

