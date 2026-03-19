import React, { useMemo, useCallback } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  FaBook,
  FaVideo,
  FaFileAlt,
  FaSitemap,
  FaExpandAlt,
  FaCompressAlt
} from "react-icons/fa";
import { useEnums } from "../../../Context/EnumContext";
import { useLectureTreeExpand } from "../../../hooks/useLectureTreeExpand";
import SortableLectureNode from "./SortableLectureNode";
import "./LectureTreeView.css";

/**
 * LectureTreeView Component - Hiển thị lectures dạng tree với Drag & Drop
 * Cải thiện: Persist expand state, Drag & Drop reorder
 */
export default function LectureTreeView({
  lectures = [],
  moduleId,
  onAddChild,
  onEdit,
  onDelete,
  onView,
  onReorder
}) {
  const { getEnumLabel } = useEnums();

  // Use custom hook for persistent expand state
  const {
    isExpanded,
    toggleExpand,
    expandAll,
    collapseAll
  } = useLectureTreeExpand(moduleId);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tính tổng số lectures (bao gồm cả con)
  const totalCount = useMemo(() => {
    const countAll = (items) => {
      return items.reduce((sum, item) => {
        const childCount = item.children ? countAll(item.children) : 0;
        return sum + 1 + childCount;
      }, 0);
    };
    return countAll(lectures);
  }, [lectures]);

  // Flatten lectures để lấy tất cả IDs cho sortable context
  const flattenIds = useCallback((items) => {
    let ids = [];
    items.forEach(item => {
      const id = item.lectureId || item.LectureId;
      if (id) ids.push(id);
      if (item.children && item.children.length > 0) {
        ids = ids.concat(flattenIds(item.children));
      }
    });
    return ids;
  }, []);

  const allLectureIds = useMemo(() => flattenIds(lectures), [lectures, flattenIds]);

  // Helper functions for lecture type display
  const getLectureIcon = useCallback((type) => {
    const typeValue = typeof type === 'number' ? type : parseInt(type);
    const typeName = getEnumLabel("LectureType", typeValue)?.toLowerCase() || "";

    if (!typeName) {
      if (typeValue === 1) return <FaBook />;
      if (typeValue === 2) return <FaFileAlt />;
      if (typeValue === 3) return <FaVideo />;
    }

    if (typeName === "content") return <FaBook />;
    if (typeName === "document") return <FaFileAlt />;
    if (typeName === "video") return <FaVideo />;
    return <FaBook />;
  }, [getEnumLabel]);

  const getLectureLabel = useCallback((type) => {
    if (type === null || type === undefined || type === '') return "Nội dung";
    const typeValue = typeof type === 'number' ? type : parseInt(type);
    if (isNaN(typeValue)) return "Nội dung";

    const typeName = getEnumLabel("LectureType", typeValue) || "";
    if (!typeName || typeName === 'Unknown') {
      const fallbackLabels = { 1: "Nội dung", 2: "Tài liệu", 3: "Video" };
      return fallbackLabels[typeValue] || "Nội dung";
    }

    const labels = { "Content": "Nội dung", "Document": "Tài liệu", "Video": "Video" };
    return labels[typeName] || "Nội dung";
  }, [getEnumLabel]);

  const getLectureBadgeVariant = useCallback((type) => {
    if (type === null || type === undefined || type === '') return "primary";
    const typeValue = typeof type === 'number' ? type : parseInt(type);
    if (isNaN(typeValue)) return "primary";

    const typeName = getEnumLabel("LectureType", typeValue)?.toLowerCase() || "";
    if (!typeName || typeName === 'unknown') {
      if (typeValue === 1) return "primary";
      if (typeValue === 2) return "info";
      if (typeValue === 3) return "danger";
      return "primary";
    }

    if (typeName === "content") return "primary";
    if (typeName === "document") return "info";
    if (typeName === "video") return "danger";
    return "primary";
  }, [getEnumLabel]);

  // Color theo level - giúp phân biệt độ sâu
  const getLevelColor = useCallback((level) => {
    const colors = [
      { border: '#0d6efd', bg: 'rgba(13, 110, 253, 0.05)', text: '#0d6efd' },
      { border: '#198754', bg: 'rgba(25, 135, 84, 0.05)', text: '#198754' },
      { border: '#fd7e14', bg: 'rgba(253, 126, 20, 0.05)', text: '#fd7e14' },
      { border: '#6f42c1', bg: 'rgba(111, 66, 193, 0.05)', text: '#6f42c1' },
      { border: '#20c997', bg: 'rgba(32, 201, 151, 0.05)', text: '#20c997' },
    ];
    return colors[Math.min(level, colors.length - 1)];
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find the lecture that was moved and its new position
    const findLectureAndParent = (items, id, parent = null) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = item.lectureId || item.LectureId;
        if (itemId === id) {
          return { lecture: item, parent, index: i, siblings: items };
        }
        if (item.children && item.children.length > 0) {
          const found = findLectureAndParent(item.children, id, item);
          if (found) return found;
        }
      }
      return null;
    };

    const activeInfo = findLectureAndParent(lectures, active.id);
    const overInfo = findLectureAndParent(lectures, over.id);

    if (!activeInfo || !overInfo) return;

    // Build reorder list - same parent reorder
    if (activeInfo.parent === overInfo.parent) {
      const siblings = activeInfo.siblings;
      const oldIndex = activeInfo.index;
      const newIndex = overInfo.index;

      if (oldIndex === newIndex) return;

      // Calculate new order indices
      const reorderList = [];
      const reorderedSiblings = [...siblings];
      const [movedItem] = reorderedSiblings.splice(oldIndex, 1);
      reorderedSiblings.splice(newIndex, 0, movedItem);

      reorderedSiblings.forEach((item, idx) => {
        const itemId = item.lectureId || item.LectureId;
        reorderList.push({
          lectureId: itemId,
          newOrderIndex: idx,
          newParentLectureId: activeInfo.parent
            ? (activeInfo.parent.lectureId || activeInfo.parent.LectureId)
            : null
        });
      });

      if (onReorder && reorderList.length > 0) {
        onReorder(reorderList);
      }
    }
    // Cross-parent move would require more complex logic
    // For now, we only support same-level reordering
  }, [lectures, onReorder]);

  // Recursive render function for children
  const renderLectureNodes = useCallback((items, level = 0, parentTitle = null) => {
    return items.map((lecture, index) => {
      const lectureId = lecture.lectureId || lecture.LectureId;

      return (
        <SortableLectureNode
          key={lectureId}
          lecture={lecture}
          level={level}
          isLast={index === items.length - 1}
          parentTitle={parentTitle}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onToggleExpand={toggleExpand}
          isExpanded={isExpanded(lectureId)}
          getLectureIcon={getLectureIcon}
          getLectureLabel={getLectureLabel}
          getLectureBadgeVariant={getLectureBadgeVariant}
          getLevelColor={getLevelColor}
          isDraggingEnabled={!!onReorder}
          renderChildren={(children, childLevel, childParentTitle) =>
            renderLectureNodes(children, childLevel, childParentTitle)
          }
        />
      );
    });
  }, [
    onAddChild, onEdit, onDelete, onView, onReorder,
    toggleExpand, isExpanded,
    getLectureIcon, getLectureLabel, getLectureBadgeVariant, getLevelColor
  ]);

  return (
    <div className="ltv-container">
      {/* Header thống kê */}
      <div className="ltv-header">
        <div className="ltv-header__stats">
          <FaSitemap className="ltv-header__icon" />
          <span className="ltv-header__text">
            <strong>{lectures.length}</strong> bài gốc • <strong>{totalCount}</strong> tổng cộng
          </span>
        </div>

        <div className="ltv-header__actions">
          <OverlayTrigger placement="top" overlay={<Tooltip>Mở rộng tất cả</Tooltip>}>
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={() => expandAll(lectures)}
            >
              <FaExpandAlt />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Thu gọn tất cả</Tooltip>}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={collapseAll}
            >
              <FaCompressAlt />
            </Button>
          </OverlayTrigger>
        </div>

        <div className="ltv-header__legend">
          <span className="ltv-legend-item ltv-legend-item--level0">Gốc</span>
          <span className="ltv-legend-item ltv-legend-item--level1">Cấp 1</span>
          <span className="ltv-legend-item ltv-legend-item--level2">Cấp 2</span>
          <span className="ltv-legend-item ltv-legend-item--level3">Cấp 3+</span>
        </div>
      </div>

      {/* Tree content with DnD */}
      {lectures.length === 0 ? (
        <div className="ltv-empty">
          <FaBook className="ltv-empty__icon" />
          <p className="ltv-empty__text">Chưa có bài giảng nào</p>
          <p className="ltv-empty__hint">Nhấn "Tạo Lecture mới" để bắt đầu</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allLectureIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="ltv-tree">
              {renderLectureNodes(lectures)}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
