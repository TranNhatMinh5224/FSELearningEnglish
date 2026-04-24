import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import LectureTree from "../../Components/LectureDetail/LectureTree/LectureTree";
import LectureHeader from "../../Components/LectureDetail/LectureHeader/LectureHeader";
import LectureContent from "../../Components/LectureDetail/LectureContent/LectureContent";
import LectureFooter from "../../Components/LectureDetail/LectureFooter/LectureFooter";
import { lectureService } from "../../Services/lectureService";
import { courseService } from "../../Services/courseService";
import { lessonService } from "../../Services/lessonService";
import { moduleService } from "../../Services/moduleService";
import "./LectureDetail.css";

export default function LectureDetail() {
    const { courseId, lessonId, moduleId, lectureId } = useParams();
    const navigate = useNavigate();
    
    // State
    const [lectureTree, setLectureTree] = useState([]);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [selectedLectureId, setSelectedLectureId] = useState(null);
    const [module, setModule] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [loadingTree, setLoadingTree] = useState(true);
    const [loadingLecture, setLoadingLecture] = useState(false);
    const [error, setError] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const isResizingRef = useRef(false);

    // Sidebar Resize Handlers
    const startResizing = useCallback((e) => {
        isResizingRef.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResizing);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizingRef.current) return;
        
        // Get the boxed container position to calculate relative width
        const container = document.querySelector('.lecture-boxed-container');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth >= 200 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    }, []);

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopResizing);
        };
    }, [handleMouseMove, stopResizing]);

    // Refs
    const moduleStartedRef = useRef(new Set());
    const isFetchingTreeRef = useRef(false);
    const isFetchingLectureRef = useRef(false);

    // Helper: Flatten lecture tree
    const flattenLectureTree = useCallback((tree, result = []) => {
        for (const item of tree) {
            result.push(item);
            const children = item.children || item.Children || [];
            if (children.length > 0) flattenLectureTree(children, result);
        }
        return result;
    }, []);

    // Helper: Find first lecture
    const findFirstLecture = useCallback((tree) => {
        if (tree && tree.length > 0) return tree[0].lectureId || tree[0].LectureId;
        return null;
    }, []);

    const getAllLectures = useCallback(() => flattenLectureTree(lectureTree), [lectureTree, flattenLectureTree]);

    const getNavigationLectures = useCallback(() => {
        const allLectures = getAllLectures();
        const currentId = currentLecture?.lectureId || currentLecture?.LectureId || (lectureId ? parseInt(lectureId) : null);
        if (!currentId || allLectures.length === 0) return { previous: null, next: null };
        const currentIndex = allLectures.findIndex(l => (l.lectureId || l.LectureId) === currentId);
        if (currentIndex === -1) return { previous: null, next: null };
        return {
            previous: currentIndex > 0 ? allLectures[currentIndex - 1] : null,
            next: currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null,
        };
    }, [getAllLectures, currentLecture, lectureId]);

    const fetchLectureDetail = useCallback(async (lectureIdToLoad, updateUrl = true) => {
        if (isFetchingLectureRef.current) return;
        isFetchingLectureRef.current = true;
        try {
            setSelectedLectureId(lectureIdToLoad);
            setLoadingLecture(true);
            setError("");
            const res = await lectureService.getLectureById(lectureIdToLoad);
            if (res.data?.success && res.data?.data) {
                setCurrentLecture(res.data.data);
                if (updateUrl) {
                    const newUrl = `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/lecture/${lectureIdToLoad}`;
                    window.history.replaceState(null, '', newUrl);
                }
                const content = document.querySelector('.lecture-content-section');
                if (content) content.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setError(res.data?.message || "Lỗi tải bài giảng");
            }
        } catch (err) {
            setError("Lỗi tải bài giảng");
        } finally {
            setLoadingLecture(false);
            isFetchingLectureRef.current = false;
        }
    }, [courseId, lessonId, moduleId]);

    useEffect(() => {
        const fetchTree = async () => {
            if (isFetchingTreeRef.current) return;
            isFetchingTreeRef.current = true;
            try {
                setLoadingTree(true);
                const parsedMid = typeof moduleId === 'string' ? parseInt(moduleId) : moduleId;
                if (parsedMid && !isNaN(parsedMid) && !moduleStartedRef.current.has(parsedMid)) {
                    await moduleService.startModule(parsedMid);
                    moduleStartedRef.current.add(parsedMid);
                }
                const [cR, lR, mR, tR] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessonById(lessonId),
                    moduleService.getModuleById(moduleId),
                    lectureService.getLectureTreeByModuleId(moduleId)
                ]);
                if (cR.data?.data) setCourse(cR.data.data);
                if (lR.data?.data) setLesson(lR.data.data);
                if (mR.data?.data) setModule(mR.data.data);
                if (tR.data?.data) {
                    setLectureTree(tR.data.data);
                    if (lectureId) {
                        const parsedId = parseInt(lectureId);
                        setSelectedLectureId(parsedId);
                        await fetchLectureDetail(parsedId, false);
                    } else {
                        const firstId = findFirstLecture(tR.data.data);
                        if (firstId) {
                            setSelectedLectureId(firstId);
                            await fetchLectureDetail(firstId, true);
                        }
                    }
                }
            } catch (err) {
                setError("Lỗi tải dữ liệu");
            } finally {
                setLoadingTree(false);
                isFetchingTreeRef.current = false;
            }
        };
        if (moduleId) fetchTree();
    }, [moduleId, courseId, lessonId, lectureId, fetchLectureDetail, findFirstLecture]);

    const handleLectureClick = useCallback((id) => fetchLectureDetail(id, true), [fetchLectureDetail]);
    const handlePrevious = useCallback(() => {
        const { previous } = getNavigationLectures();
        if (previous) fetchLectureDetail(previous.lectureId || previous.LectureId, true);
    }, [getNavigationLectures, fetchLectureDetail]);
    const handleNext = useCallback(() => {
        const { next } = getNavigationLectures();
        if (next) fetchLectureDetail(next.lectureId || next.NextId || next.LectureId, true);
    }, [getNavigationLectures, fetchLectureDetail]);

    if (loadingTree) return (
        <div className="lecture-page-wrapper">
            <MainHeader />
            <div className="lecture-loading"><div className="loading-spinner"></div><p>Đang tải...</p></div>
        </div>
    );

    const lessonTitle = lesson?.title || lesson?.Title || "Bài học";
    const courseTitle = course?.title || course?.Title || "Khóa học";
    const moduleName = module?.name || module?.Name || "Module";
    const navigation = getNavigationLectures();
    const currentLectureId = selectedLectureId || currentLecture?.lectureId || currentLecture?.LectureId || (lectureId ? parseInt(lectureId) : null);

    return (
        <div className="lecture-page-wrapper">
            <MainHeader />
            
            <Container className="py-4 py-md-5">
                <div className={`lecture-boxed-container d-flex flex-column ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    {/* Header */}
                    <LectureHeader
                        sidebarCollapsed={sidebarCollapsed}
                        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                        courseId={courseId}
                        lessonId={lessonId}
                        courseTitle={courseTitle}
                        lessonTitle={lessonTitle}
                        moduleName={moduleName}
                    />

                    {/* Content Wrapper */}
                    <div className="lecture-content-wrapper d-flex flex-grow-1 position-relative">
                        {!sidebarCollapsed && (
                            <div 
                                className="lecture-sidebar-overlay d-md-none"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            />
                        )}

                        <aside 
                            className={`lecture-sidebar d-flex flex-column ${sidebarCollapsed ? 'collapsed' : ''}`}
                            style={{ 
                                width: sidebarCollapsed ? 0 : `${sidebarWidth}px`, 
                                minWidth: sidebarCollapsed ? 0 : `${sidebarWidth}px` 
                            }}
                        >
                            <LectureTree
                                lectureTree={lectureTree}
                                currentLectureId={currentLectureId}
                                onLectureClick={handleLectureClick}
                            />
                        </aside>

                        {!sidebarCollapsed && (
                            <div 
                                className="sidebar-resizer" 
                                onMouseDown={startResizing}
                            />
                        )}

                        <div className="lecture-main-wrapper d-flex flex-column flex-grow-1">
                            <section className="lecture-content-section flex-grow-1">
                                <div className="lecture-content-container">
                                    <LectureContent
                                        lecture={currentLecture}
                                        loading={loadingLecture}
                                        error={error}
                                    />
                                </div>
                            </section>

                            {currentLecture && (
                                <LectureFooter
                                    onPrevious={handlePrevious}
                                    onNext={handleNext}
                                    hasPrevious={!!navigation.previous}
                                    hasNext={!!navigation.next}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
