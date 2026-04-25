import React from "react";
import { PiGraduationCapDuotone, PiUsersDuotone, PiCaretRightBold } from "react-icons/pi";
import { useAssets } from "../../../../Context/AssetContext";
import ImageWithIconFallback from "../../../Common/ImageWithIconFallback/ImageWithIconFallback";
import { APP_CONSTANTS } from "../../../../config/constants";
import "./SubmissionCourseCard.css";

export default function SubmissionCourseCard({ course, onClick }) {
    const { getDefaultCourseImage } = useAssets();
    
    // Robust data extraction for Teacher API
    const id = course?.courseId || course?.CourseId || course?.id || course?.ID;
    const title = course?.title || course?.Title || course?.name || course?.Name || course?.courseName || course?.CourseName || "Khóa học chưa đặt tên";
    const studentCount = course?.studentCount || course?.StudentCount || course?.enrollmentCount || course?.EnrollmentCount || 0;
    const imageUrl = course?.imageUrl || course?.ImageUrl;
    
    const defaultImage = getDefaultCourseImage() || APP_CONSTANTS.DEFAULT_COURSE_IMAGE;

    return (
        <div className="submission-course-card" onClick={() => onClick && onClick(course)}>
            <div className="submission-card-image-wrapper">
                <ImageWithIconFallback
                    imageUrl={imageUrl}
                    fallbackImageUrl={defaultImage}
                    icon={<PiGraduationCapDuotone size={64} className="text-primary-fallback" />}
                    alt={title}
                    className="submission-card-image"
                    imageKey={id}
                />
                {studentCount > 0 && (
                    <div className="student-badge">
                        <PiUsersDuotone size={14} />
                        <span>{studentCount} Học sinh</span>
                    </div>
                )}
            </div>
            
            <div className="submission-card-content">
                <h3 className="submission-card-title">{title}</h3>
                <div className="submission-card-footer">
                    <span className="manage-label">Quản lý bài nộp</span>
                    <PiCaretRightBold className="arrow-icon" />
                </div>
            </div>
        </div>
    );
}
