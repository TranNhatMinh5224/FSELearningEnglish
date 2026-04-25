import React from "react";
import { useNavigate } from "react-router-dom";
import { PiGraduationCapDuotone } from "react-icons/pi";
import { useAssets } from "../../../Context/AssetContext";
import ImageWithIconFallback from "../../Common/ImageWithIconFallback/ImageWithIconFallback";
import "./SuggestedCourseCard.css";

const SuggestedCourseCard = ({ course, isEnrolled = false, showEnrolledBadge = true }) => {
    const navigate = useNavigate();
    const { getDefaultCourseImage } = useAssets();
    const {
        id,
        courseId,
        title = "Khóa học",
        Title,
        name,
        Name,
        courseName,
        CourseName,
        imageUrl,
        price = 0,
    } = course || {};
    
    const finalTitle = (title && title !== "Khóa học") ? title : (Title || name || Name || courseName || CourseName || "Khóa học");
    const defaultImage = getDefaultCourseImage();
    const finalImageUrl = imageUrl || "";

    const handleClick = () => {
        const finalCourseId = courseId || id;
        if (finalCourseId) {
            navigate(`/course/${finalCourseId}`);
        }
    };

    const formatPrice = (price) => {
        if (!price || price === 0) {
            return "Miễn phí";
        }
        return `${price.toLocaleString("vi-VN")}đ`;
    };

    return (
        <div className={`suggested-course-card ${isEnrolled ? 'enrolled-course' : ''}`} onClick={handleClick}>
            {isEnrolled && showEnrolledBadge && (
                <div className="enrolled-badge">
                    <span className="checkmark-icon">✓</span>
                    <span className="enrolled-text">Đã tham gia</span>
                </div>
            )}
            <div className="course-image-wrapper">
                <ImageWithIconFallback
                    imageUrl={finalImageUrl}
                    fallbackImageUrl={defaultImage}
                    icon={<PiGraduationCapDuotone size={48} />}
                    alt={`Ảnh khóa học ${finalTitle}`}
                    className="course-image"
                    imageKey={id || courseId}
                />
            </div>
            <div className="course-content">
                <h4 className="course-title">{finalTitle}</h4>
                <div className="course-price">{formatPrice(price)}</div>
                <button 
                    className={`course-action-btn ${isEnrolled ? 'enrolled' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    {isEnrolled ? "Vào học ngay" : "Đăng ký ngay"}
                </button>
            </div>
        </div>
    );
};

export default SuggestedCourseCard;
