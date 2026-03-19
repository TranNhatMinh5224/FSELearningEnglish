import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, Badge, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    FaChevronDown,
    FaChevronRight,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaSitemap,
    FaClock,
    FaGripVertical
} from 'react-icons/fa';

/**
 * SortableLectureNode - Component cho mỗi node trong tree với khả năng drag & drop
 */
export default function SortableLectureNode({
    lecture,
    level = 0,
    isLast = false,
    parentTitle = null,
    onAddChild,
    onEdit,
    onDelete,
    onView,
    onToggleExpand,
    isExpanded,
    getLectureIcon,
    getLectureLabel,
    getLectureBadgeVariant,
    getLevelColor,
    isDraggingEnabled = true,
    renderChildren
}) {
    const lectureId = lecture.lectureId || lecture.LectureId;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: lectureId,
        disabled: !isDraggingEnabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto'
    };

    const hasChildren = lecture.children && lecture.children.length > 0;
    const title = lecture.title || lecture.Title;
    const type = lecture.type || lecture.Type;
    const duration = lecture.duration || lecture.Duration;
    const numberingLabel = lecture.numberingLabel || lecture.NumberingLabel;
    const levelColor = getLevelColor(level);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            onToggleExpand(lectureId);
        }
    };

    const handleView = (e) => {
        e.stopPropagation();
        onView?.(lecture);
    };

    const handleAddChild = (e) => {
        e.stopPropagation();
        onAddChild?.(lecture);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit?.(lecture);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(lecture);
    };

    // Format duration
    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`ltv-node ltv-node--level${Math.min(level, 4)} ${isDragging ? 'ltv-node--dragging' : ''}`}
        >
            {/* Đường nối dọc từ cha */}
            {level > 0 && (
                <div
                    className={`ltv-node__connector ${isLast ? 'ltv-node__connector--last' : ''}`}
                    style={{ borderColor: getLevelColor(level - 1).border }}
                />
            )}

            {/* Card chính */}
            <Card
                className={`ltv-card ${isDragging ? 'ltv-card--dragging' : ''}`}
                style={{
                    borderLeftColor: levelColor.border,
                    backgroundColor: levelColor.bg
                }}
            >
                <Card.Body className="ltv-card__body">
                    {/* Row 1: Main content */}
                    <div className="ltv-card__main">
                        {/* Drag handle */}
                        {isDraggingEnabled && (
                            <div
                                className="ltv-card__drag-handle"
                                {...attributes}
                                {...listeners}
                            >
                                <FaGripVertical />
                            </div>
                        )}

                        {/* Expand icon */}
                        <div className="ltv-card__expand" onClick={handleToggle}>
                            {hasChildren ? (
                                <span className="ltv-expand-icon ltv-expand-icon--active">
                                    {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                </span>
                            ) : (
                                <span className="ltv-expand-icon ltv-expand-icon--placeholder" />
                            )}
                        </div>

                        {/* Icon theo type */}
                        <div className={`ltv-card__type-icon ltv-card__type-icon--${getLectureBadgeVariant(type)}`}>
                            {getLectureIcon(type)}
                        </div>

                        {/* Info */}
                        <div className="ltv-card__info">
                            {/* Title row */}
                            <div className="ltv-card__title-row">
                                {numberingLabel && (
                                    <span className="ltv-card__numbering">{numberingLabel}</span>
                                )}
                                <h6 className="ltv-card__title" onClick={handleView} title="Nhấn để xem chi tiết">
                                    {title}
                                    <FaEye className="ltv-card__view-icon" />
                                </h6>
                            </div>

                            {/* Meta row */}
                            <div className="ltv-card__meta">
                                <Badge bg={getLectureBadgeVariant(type)} className="ltv-badge ltv-badge--type">
                                    {getLectureLabel(type)}
                                </Badge>

                                {/* Level indicator */}
                                <span
                                    className="ltv-badge ltv-badge--level"
                                    style={{ backgroundColor: levelColor.border, color: '#fff' }}
                                >
                                    {level === 0 ? 'Gốc' : `Cấp ${level}`}
                                </span>

                                {/* Children count */}
                                {hasChildren && (
                                    <Badge bg="secondary" className="ltv-badge ltv-badge--children">
                                        <FaSitemap className="me-1" style={{ fontSize: '0.65rem' }} />
                                        {lecture.children.length} con
                                    </Badge>
                                )}

                                {/* Duration for video */}
                                {duration && (
                                    <span className="ltv-card__duration">
                                        <FaClock /> {formatDuration(duration)}
                                    </span>
                                )}

                                {/* Parent info - hiển thị rõ thuộc lecture nào */}
                                {parentTitle && (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>Con của: {parentTitle}</Tooltip>}
                                    >
                                        <span className="ltv-card__parent">
                                            ↳ <strong>{parentTitle}</strong>
                                        </span>
                                    </OverlayTrigger>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="ltv-card__actions" onClick={(e) => e.stopPropagation()}>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Thêm bài con vào "{title}"</Tooltip>}>
                                <Button variant="success" size="sm" className="ltv-btn ltv-btn--add" onClick={handleAddChild}>
                                    <FaPlus />
                                    <span className="ltv-btn__text">Thêm con</span>
                                </Button>
                            </OverlayTrigger>

                            <OverlayTrigger placement="top" overlay={<Tooltip>Chỉnh sửa</Tooltip>}>
                                <Button variant="outline-primary" size="sm" className="ltv-btn ltv-btn--edit" onClick={handleEdit}>
                                    <FaEdit />
                                </Button>
                            </OverlayTrigger>

                            <OverlayTrigger placement="top" overlay={<Tooltip>Xóa</Tooltip>}>
                                <Button variant="outline-danger" size="sm" className="ltv-btn ltv-btn--delete" onClick={handleDelete}>
                                    <FaTrash />
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Children - render through callback to maintain DnD context */}
            {hasChildren && (
                <Collapse in={isExpanded}>
                    <div className="ltv-children">
                        {renderChildren ? renderChildren(lecture.children, level + 1, title) : null}
                    </div>
                </Collapse>
            )}
        </div>
    );
}
