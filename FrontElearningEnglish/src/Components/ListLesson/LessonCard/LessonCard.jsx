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
                    <div className="lesson-completed-badge">
                        <FaCheckCircle size={10} />
                    </div>
                )}
            </div>
            <div className="lesson-info">
                <h3 className="lesson-title">{finalTitle}</h3>
                {finalDescription && <p className="lesson-description">{finalDescription}</p>}
            </div>
        </div>
    );
}

