import React from "react";
import ImageWithIconFallback from "../../../Common/ImageWithIconFallback/ImageWithIconFallback";
import ActionButtons from "../../../Common/ActionButtons";
import { FaBook } from "react-icons/fa";
import "./AdminLessonCard.css";

export default function AdminLessonCard({ 
    lesson, 
    onClick, 
    onUpdate, 
    onDelete,
    getDefaultLessonImage
}) {
    const lessonTitle = lesson.title || lesson.Title || "Bài học";
    const lessonImage = lesson.imageUrl || lesson.ImageUrl || (getDefaultLessonImage ? getDefaultLessonImage() : "");
    const moduleCount = lesson.totalModules || lesson.TotalModules || 0;
    const lessonId = lesson.lessonId || lesson.LessonId;

    return (
        <div className="admin-lesson-card">
            <div className="admin-lesson-card-main" onClick={onClick}>
                <div className="admin-lesson-image-wrapper">
                    <ImageWithIconFallback
                        imageUrl={lessonImage}
                        ImageUrl={lessonImage}
                        icon={<div className="lesson-fallback-icon"><FaBook /></div>}
                        alt={lessonTitle}
                        className="admin-lesson-image"
                        imageKey={lessonId}
                    />
                </div>
                <div className="admin-lesson-info">
                    <h4 className="admin-lesson-title">{lessonTitle}</h4>
                </div>
            </div>
            <div className="admin-lesson-actions">
                <ActionButtons
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    updateTitle="Chỉnh sửa bài học"
                    deleteTitle="Xóa bài học"
                />
            </div>
        </div>
    );
}
