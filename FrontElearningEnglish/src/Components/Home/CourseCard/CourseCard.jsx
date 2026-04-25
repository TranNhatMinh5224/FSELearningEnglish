import React from "react";
import { useNavigate } from "react-router-dom";
import { PiGraduationCapDuotone } from "react-icons/pi";
import { useAssets } from "../../../Context/AssetContext";
import ImageWithIconFallback from "../../Common/ImageWithIconFallback/ImageWithIconFallback";
import { APP_CONSTANTS } from "../../../config/constants";
import "./CourseCard.css";

export default function CourseCard({ course, onClick }) {
    const navigate = useNavigate();
    const { getDefaultCourseImage } = useAssets();
    const {
        id,
        courseId,
        CourseId,
        title = "Khóa học",
        Title,
        name,
        Name,
        courseName,
        CourseName,
        imageUrl,
        ImageUrl,
    } = course || {};

    const finalId = id || courseId || CourseId || course?.id || course?.courseId;
    const finalTitle = (title && title !== "Khóa học") ? title : (Title || name || Name || courseName || CourseName || "Khóa học");
    const defaultImage = getDefaultCourseImage() || APP_CONSTANTS.DEFAULT_COURSE_IMAGE;
    const customImageUrl = imageUrl || ImageUrl;

    const handleClick = () => {
        if (onClick) {
            onClick(course);
            return;
        }
        if (finalId) {
            navigate(`/course/${finalId}`);
        }
    };

    return (
        <div className="course-card" onClick={handleClick}>
            <ImageWithIconFallback
                imageUrl={customImageUrl}
                fallbackImageUrl={defaultImage}
                icon={<PiGraduationCapDuotone size={48} />}
                alt={finalTitle}
                className="course-image"
                imageKey={finalId}
            />
            <div className="course-info">
                <h3>{finalTitle}</h3>
            </div>
        </div>
    );
}
