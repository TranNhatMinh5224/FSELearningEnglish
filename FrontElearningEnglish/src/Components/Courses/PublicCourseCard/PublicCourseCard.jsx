import React from "react";
import { PiGraduationCapDuotone } from "react-icons/pi";
import ImageWithIconFallback from "../../Common/ImageWithIconFallback/ImageWithIconFallback";
import "./PublicCourseCard.css";

export default function PublicCourseCard({ course, onStart }) {
    const {
        title = "Khóa học",
        imageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    } = course || {};

    const displayImageUrl = imageUrl;

    return (
        <div className="public-course-card">
            <ImageWithIconFallback
                imageUrl={imageUrl}
                icon={<PiGraduationCapDuotone size={48} />}
                alt={title}
                className="public-course-image"
            />
            <div className="course-info">
                <h3>{title}</h3>
                <button className="start-btn" onClick={() => onStart?.(course)}>
                    Bắt đầu học
                </button>
            </div>
        </div>
    );
}

