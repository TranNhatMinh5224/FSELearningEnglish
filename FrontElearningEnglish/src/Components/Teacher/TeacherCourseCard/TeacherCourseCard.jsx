import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherCourseCard.css";
import { useAssets } from "../../../Context/AssetContext";
import { PiGraduationCapDuotone } from "react-icons/pi";
import ImageWithIconFallback from "../../Common/ImageWithIconFallback/ImageWithIconFallback";

export default function TeacherCourseCard({ course }) {
  const navigate = useNavigate();
  const { getDefaultCourseImage } = useAssets();
  const defaultCourseImage = getDefaultCourseImage();
  const {
    courseId,
    id,
    title = "Khóa học",
    imageUrl,
    studentCount = 0,
    maxStudent = 0,
    lessonCount = 0,
    classCode,
  } = course || {};

  const finalCourseId = courseId || id;
  const displayImageUrl = imageUrl || defaultCourseImage;

  const handleClick = () => {
    if (finalCourseId) {
      navigate(`/teacher/course/${finalCourseId}`);
    }
  };

  return (
    <div className="teacher-course-card" onClick={handleClick}>
      <div className="teacher-course-card-image">
        <ImageWithIconFallback
          imageUrl={imageUrl}
          fallbackImageUrl={defaultCourseImage}
          icon={<PiGraduationCapDuotone size={48} />}
          alt={title}
          className="teacher-course-img"
        />
      </div>
      <div className="teacher-course-card-content d-flex flex-column">
        <h3 className="teacher-course-card-title">{title}</h3>
        <div className="teacher-course-card-stats d-flex flex-wrap">
          <span className="teacher-course-stat d-flex align-items-center">
            {studentCount}/{maxStudent} học viên
          </span>
          <span className="teacher-course-stat d-flex align-items-center">
            {lessonCount} bài học
          </span>
          {classCode && (
            <span className="teacher-course-stat d-flex align-items-center">
              Mã lớp: {classCode}
            </span>
          )}
        </div>
        <button
          className="teacher-course-manage-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (finalCourseId) {
              navigate(`/teacher/course/${finalCourseId}`);
            }
          }}
        >
          Quản lý khóa học
        </button>
      </div>
    </div>
  );
}
