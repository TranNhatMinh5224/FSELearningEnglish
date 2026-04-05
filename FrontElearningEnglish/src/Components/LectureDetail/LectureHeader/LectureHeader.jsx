import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaComments } from "react-icons/fa";
import Breadcrumb from "../../Common/Breadcrumb/Breadcrumb";
import "./LectureHeader.css";

const LectureHeader = ({ 
    sidebarCollapsed, 
    onToggleSidebar, 
    courseId, 
    lessonId, 
    courseTitle, 
    lessonTitle, 
    moduleName 
}) => {
    const navigate = useNavigate();

    return (
        <header className="lecture-header d-flex align-items-center justify-content-between">
            <div className="lecture-header-left d-flex align-items-center flex-grow-1">
                <button 
                    className="sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <FaBars />
                </button>
                <div className="lecture-breadcrumb-wrapper flex-grow-1">
                    <Breadcrumb 
                        items={[
                            { label: "Khóa học của tôi", path: "/my-courses" },
                            { label: courseTitle, path: `/course/${courseId}` },
                            { label: "Lesson", path: `/course/${courseId}/learn` },
                            { label: lessonTitle, path: `/course/${courseId}/lesson/${lessonId}` },
                            { label: moduleName, isCurrent: true }
                        ]}
                    />
                </div>
            </div>
            <div className="lecture-header-right d-flex align-items-center">
                <button className="discussion-btn btn btn-primary btn-sm">
                    <FaComments />
                    <span className="d-none d-sm-inline">Xem thảo luận</span>
                </button>
            </div>
        </header>
    );
};

LectureHeader.displayName = "LectureHeader";

export default LectureHeader;
