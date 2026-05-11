import { FaCheckCircle } from "react-icons/fa";
import { PiBookOpenDuotone } from "react-icons/pi";
import { useAssets } from "../../../Context/AssetContext";
import ImageWithIconFallback from "../../Common/ImageWithIconFallback/ImageWithIconFallback";
import "./LessonCard.css";

export default function LessonCard({ lesson, orderNumber, onClick, staggerIndex = 0 }) {
    const { getDefaultLessonImage } = useAssets();
    const {
        lessonId,
        LessonId,
        title = "Bài học",
        Title,
        imageUrl,
        ImageUrl,
        isCompleted = false,
        IsCompleted = false,
        orderIndex,
        OrderIndex,
        description,
        Description,
    } = lesson || {};

    // Animation delay for stagger effect
    const animationDelay = `${staggerIndex * 0.1}s`;

    const finalLessonId = lessonId || LessonId;
    const finalTitle = title || Title || "Bài học";
    const finalIsCompleted = isCompleted || IsCompleted;
    const finalOrderIndex = orderIndex || OrderIndex;
    const finalDescription = description || Description;
    const displayOrder = orderNumber || finalOrderIndex || 1;
    const defaultImage = getDefaultLessonImage();
    const customImageUrl = imageUrl || ImageUrl;

    const handleClick = () => {
        if (onClick && finalLessonId) {
            onClick(finalLessonId);
        }
    };

    return (
        <div
            className={`lesson-card ${finalIsCompleted ? "completed" : ""}`}
            onClick={handleClick}
            style={{ animationDelay }}
        >
            <div className="lesson-card-img-container">
                <ImageWithIconFallback
                    imageUrl={customImageUrl}
                    fallbackImageUrl={defaultImage}
                    icon={<PiBookOpenDuotone size={64} />}
                    alt={finalTitle}
                    className="lesson-card-img"
                    iconClassName="lesson-card-img-placeholder"
                    imageKey={finalLessonId}
                />
                {finalIsCompleted && (
                    <div className="lesson-completed-badge-premium">
                        <FaCheckCircle size={18} />
                    </div>
                )}
            </div>
            <div className="lesson-info">
                <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <h3 className="lesson-title">{finalTitle}</h3>
                        {finalIsCompleted && (
                            <span className="lesson-mastered-tag">Mastered</span>
                        )}
                    </div>
                    {lesson.moduleCount > 0 && (
                        <span className="lesson-count-badge">
                            {lesson.completedCount || 0}/{lesson.moduleCount} bài học
                        </span>
                    )}
                </div>
                {finalDescription && <p className="lesson-description">{finalDescription}</p>}
            </div>
        </div>
    );
}

