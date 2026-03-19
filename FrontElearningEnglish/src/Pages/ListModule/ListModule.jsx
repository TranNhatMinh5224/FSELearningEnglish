import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import ListModuleHeader from "../../Components/ListModule/ListModuleHeader/ListModuleHeader";
import ModuleCard from "../../Components/ListModule/ModuleCard/ModuleCard";

import { moduleService } from "../../Services/moduleService";
import { lessonService } from "../../Services/lessonService";
import { courseService } from "../../Services/courseService";
import "./ListModule.css";

export default function ListModule() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

                // Fetch lesson info
                const lessonResponse = await lessonService.getLessonById(lessonId);
                if (lessonResponse.data?.success && lessonResponse.data?.data) {
                    setLesson(lessonResponse.data.data);
                }

                // Fetch modules
                const modulesResponse = await moduleService.getModulesByLessonId(lessonId);
                if (modulesResponse.data?.success && modulesResponse.data?.data) {
                    const modulesData = modulesResponse.data.data;
                    // Sort by orderIndex
                    const sortedModules = modulesData.sort((a, b) => {
                        const orderA = a.orderIndex || 0;
                        const orderB = b.orderIndex || 0;
                        return orderA - orderB;
                    });
                    setModules(sortedModules);
                } else {
                    setError(modulesResponse.data?.message || "Không thể tải danh sách module");
                }
            } catch (err) {
                console.error("Error fetching list module data:", err);
                setError("Không thể tải dữ liệu bài học");
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchData();
        }
    }, [lessonId, courseId]);

    const handleBackClick = () => {
        navigate(`/course/${courseId}/learn`);
    };

    const handleModuleClick = async (module) => {
        const rawModuleId = module.moduleId || module.ModuleId;
        if (!rawModuleId) {
            console.error("Module ID is missing");
            return;
        }

        // Parse moduleId thành số để đảm bảo đúng format
        const moduleId = typeof rawModuleId === 'string' ? parseInt(rawModuleId) : rawModuleId;
        if (!moduleId || isNaN(moduleId)) {
            console.error("Invalid module ID:", rawModuleId);
            return;
        }

        // Handle both camelCase and PascalCase
        let contentType = module.contentType || module.ContentType;
        const contentTypeName = (module.contentTypeName || module.ContentTypeName || module.name || module.Name || "").toLowerCase();

        // Debug log
        console.log("Module clicked:", {
            moduleId,
            contentType,
            contentTypeName,
            moduleName: module.name || module.Name,
            fullModule: module
        });

        // Convert contentType to number if it's a string or enum
        if (typeof contentType === 'string') {
            // Try to parse as number first
            const parsed = parseInt(contentType);
            if (!isNaN(parsed)) {
                contentType = parsed;
            } else {
                // If it's an enum string like "Assessment", "FlashCard", etc.
                const typeLower = contentType.toLowerCase();
                if (typeLower.includes("assessment") || typeLower.includes("assignment")) {
                    contentType = 3; // Assessment
                } else if (typeLower.includes("flashcard") || typeLower.includes("flash")) {
                    contentType = 2; // FlashCard
                } else {
                    contentType = 1; // Default to Lecture
                }
            }
        }

        // If contentType is still undefined or null, check contentTypeName or module name
        if (contentType === undefined || contentType === null) {
            // Check module name or contentTypeName for hints
            if (contentTypeName.includes("assessment") || contentTypeName.includes("assignment")) {
                contentType = 3; // Assessment
            } else if (contentTypeName.includes("flashcard") || contentTypeName.includes("flash")) {
                contentType = 2; // FlashCard
            } else {
                contentType = 1; // Default to Lecture
            }
        }

        // Gọi API start module ngay khi click vào module
        // Backend sẽ tự động complete cho Lecture/FlashCard
        try {
            console.log(`Starting module ${moduleId}...`);
            await moduleService.startModule(moduleId);
            console.log(`Module ${moduleId} started successfully`);

            // Refresh modules list để cập nhật trạng thái completed
            try {
                const modulesResponse = await moduleService.getModulesByLessonId(lessonId);
                if (modulesResponse.data?.success && modulesResponse.data?.data) {
                    const modulesData = modulesResponse.data.data;
                    // Sort by orderIndex
                    const sortedModules = modulesData.sort((a, b) => {
                        const orderA = a.orderIndex || 0;
                        const orderB = b.orderIndex || 0;
                        return orderA - orderB;
                    });
                    setModules(sortedModules);
                }
            } catch (refreshErr) {
                console.error("Error refreshing modules list:", refreshErr);
                // Tiếp tục navigate dù có lỗi refresh
            }
        } catch (err) {
            console.error(`Error starting module ${moduleId}:`, err);
            // Vẫn tiếp tục navigate dù có lỗi API
        }

        // Navigate based on ContentType: 1=Lecture, 2=FlashCard, 3=Assessment
        if (contentType === 2 || contentTypeName.includes("flashcard") || contentTypeName.includes("flash")) {
            // Navigate to flashcard detail page
            console.log("Navigating to FlashCard page");
            navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/flashcards`);
        } else if (contentType === 3 ||
            contentTypeName.includes("assessment") ||
            contentTypeName.includes("assignment") ||
            contentTypeName.includes("essay") ||
            contentTypeName.includes("quiz") ||
            contentTypeName.includes("test")) {
            // Navigate to assignment detail page (Assessment=3)
            console.log("Navigating to Assignment page");
            navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment`);
        } else if (contentType === 1 || contentTypeName.includes("lecture")) {
            // Navigate to lecture detail page
            console.log("Navigating to Lecture page");
            navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}`);
        } else {
            // Default: navigate to lecture page
            console.log("Default: Navigating to Lecture page");
            navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}`);
        }
    };

    const handlePronunciationClick = (module) => {
        const rawModuleId = module.moduleId || module.ModuleId;
        if (!rawModuleId) {
            console.error("Module ID is missing");
            return;
        }

        // Parse moduleId thành số để đảm bảo đúng format
        const moduleId = typeof rawModuleId === 'string' ? parseInt(rawModuleId) : rawModuleId;
        if (!moduleId || isNaN(moduleId)) {
            console.error("Invalid module ID:", rawModuleId);
            return;
        }

        // Navigate to pronunciation page
        const pronunciationPath = `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/pronunciation`;
        console.log("🔊 [ListModule] Navigating to Pronunciation page:", pronunciationPath);
        console.log("🔊 [ListModule] Params:", { courseId, lessonId, moduleId });
        navigate(pronunciationPath);
    };

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="list-module-container">
                    <div className="loading-message">Đang tải...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <MainHeader />
                <div className="list-module-container">
                    <div className="error-message">{error}</div>
                </div>
            </>
        );
    }

    const lessonTitle = lesson?.title || lesson?.Title || "Bài học";
    const lessonDescription = lesson?.description || lesson?.Description || "";



    return (
        <>
            <MainHeader />
            <div className="list-module-container">
                <Container>
                    <Breadcrumb
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: course?.title || course?.Title || "Khóa học", path: `/course/${courseId}` },
                            { label: "Bài học", path: `/course/${courseId}/learn` },
                            { label: lessonTitle, isCurrent: true }
                        ]}
                    />
                    <ListModuleHeader
                        title={lessonTitle}
                        description={lessonDescription}
                        onBackClick={handleBackClick}
                    />



                    <div className="modules-list d-flex flex-column">
                        {modules.length > 0 ? (
                            modules.map((module, index) => {
                                const moduleId = module.moduleId || module.ModuleId;
                                return (
                                    <ModuleCard
                                        key={moduleId || index}
                                        module={module}
                                        onClick={() => handleModuleClick(module)}
                                        onPronunciationClick={() => handlePronunciationClick(module)}
                                    />
                                );
                            })
                        ) : (
                            <div className="no-modules-message">Chưa có module nào</div>
                        )}
                    </div>
                </Container>
            </div>
        </>
    );
}

