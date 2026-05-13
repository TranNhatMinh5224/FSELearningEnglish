import React from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaTrash, FaPlus, FaSortAmountDown, FaArrowUp, FaArrowDown, FaGripVertical } from "react-icons/fa";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function OrderingFields({ options, handleOptionChange, moveOption, reorderOptions, removeOption, addOption }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = (options || []).findIndex(opt => opt.tempId === active.id);
      const newIndex = (options || []).findIndex(opt => opt.tempId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderOptions(oldIndex, newIndex);
      }
    }
  };

  const itemIds = (options || []).map(opt => opt.tempId).filter(Boolean);

  return (
    <div className="form-section-card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="form-section-header bg-light p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="d-flex align-items-center gap-2">
                <FaSortAmountDown className="text-primary fs-5" /> 
                <span className="fw-bold text-dark">Sắp xếp thứ tự đúng</span>
            </div>
            <Badge bg="primary" className="rounded-pill px-3">
                {options?.length || 0} phần tử
            </Badge>
        </div>
      
        <div className="p-3">
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={itemIds}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="options-list">
                        {(options || []).map((option, index) => (
                            <SortableItem 
                                key={option.tempId || index} 
                                id={option.tempId} 
                                option={option} 
                                index={index} 
                                optionsLength={options.length}
                                handleOptionChange={handleOptionChange}
                                moveOption={moveOption}
                                removeOption={removeOption}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="text-center mt-3">
                <Button 
                    variant="outline-primary"
                    className="rounded-pill px-3 py-1 btn-sm fw-bold hover-lift"
                    onClick={addOption}
                >
                    <FaPlus className="me-1" size={12} /> Thêm phần tử
                </Button>
            </div>
            
            <div className="mt-4 p-3 rounded-4 d-flex align-items-center gap-3" style={{ background: 'rgba(119, 101, 245, 0.05)', border: '1px dashed rgba(119, 101, 245, 0.3)' }}>
                <div className="icon-circle bg-primary text-white shadow-sm" style={{ width: '32px', height: '32px', minWidth: '32px', fontSize: '0.9rem' }}>
                    <FaGripVertical />
                </div>
                <div className="small text-dark">
                    <div className="fw-bold text-primary mb-1">Mẹo sắp xếp nhanh:</div>
                    Cầm vào <strong>biểu tượng vạch dọc</strong> và kéo các ô để thay đổi vị trí. 
                    Thứ tự hiển thị tại đây sẽ được lưu làm <strong>thứ tự đáp án chính xác</strong>.
                </div>
            </div>
        </div>
    </div>
  );
}

function SortableItem(props) {
  // If library is not ready, render a standard item without drag-and-drop hooks
  if (!useSortable) {
    return <StandardItem {...props} />;
  }
  return <SortableItemInternal {...props} />;
}

function SortableItemInternal({ id, option, index, optionsLength, handleOptionChange, moveOption, removeOption }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS && CSS.Transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className={`option-item mb-2 p-2 border rounded-3 bg-white d-flex align-items-center gap-2 shadow-sm border-light ${isDragging ? 'shadow-lg border-primary' : 'hover-lift'}`}
    >
        <div className="d-flex align-items-center gap-1">
            <div 
                {...attributes} 
                {...listeners} 
                className="p-2 cursor-grab text-muted hover-text-primary" 
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                title="Kéo để đổi vị trí"
            >
                <FaGripVertical />
            </div>
            <div className="d-flex flex-column gap-1 d-none d-md-flex">
                <Button 
                    variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                    disabled={index === 0}
                    onClick={() => moveOption(index, 'up')}
                    style={{ fontSize: '8px' }}
                >
                    <FaArrowUp />
                </Button>
                <Button 
                    variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                    disabled={index === optionsLength - 1}
                    onClick={() => moveOption(index, 'down')}
                    style={{ fontSize: '8px' }}
                >
                    <FaArrowDown />
                </Button>
            </div>
        </div>
        
        <div className="fw-bold text-primary small d-flex align-items-center justify-content-center bg-light rounded-circle flex-shrink-0" style={{ width: '28px', height: '28px' }}>
            {index + 1}
        </div>
        
        <Form.Control
            type="text"
            value={option.text || ""}
            onChange={(e) => handleOptionChange(index, "text", e.target.value)}
            placeholder={`Phần tử thứ ${index + 1}...`}
            className="border-0 shadow-none fw-medium bg-transparent p-0 small"
            style={{ fontSize: 'var(--font-size-sm)' }}
        />
        
        <Button 
            variant="link" 
            className="text-danger p-0 border-0 ms-auto opacity-50 hover-opacity-100" 
            onClick={() => removeOption(index)}
        >
            <FaTrash size={14} />
        </Button>
    </div>
  );
}

function StandardItem({ option, index, optionsLength, handleOptionChange, moveOption, removeOption }) {
  return (
    <div className="option-item mb-2 p-2 border rounded-3 bg-white d-flex align-items-center gap-2 shadow-sm border-light">
        <div className="d-flex align-items-center gap-1">
            <div className="p-2 text-muted opacity-25">
                <FaGripVertical />
            </div>
            <div className="d-flex flex-column gap-1">
                <Button 
                    variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                    disabled={index === 0}
                    onClick={() => moveOption(index, 'up')}
                    style={{ fontSize: '8px' }}
                >
                    <FaArrowUp />
                </Button>
                <Button 
                    variant="light" size="sm" className="p-0 px-1 rounded-2 border shadow-sm" 
                    disabled={index === optionsLength - 1}
                    onClick={() => moveOption(index, 'down')}
                    style={{ fontSize: '8px' }}
                >
                    <FaArrowDown />
                </Button>
            </div>
        </div>
        
        <div className="fw-bold text-primary small d-flex align-items-center justify-content-center bg-light rounded-circle flex-shrink-0" style={{ width: '28px', height: '28px' }}>
            {index + 1}
        </div>
        
        <Form.Control
            type="text"
            value={option.text || ""}
            onChange={(e) => handleOptionChange(index, "text", e.target.value)}
            placeholder={`Phần tử thứ ${index + 1}...`}
            className="border-0 shadow-none fw-medium bg-transparent p-0 small"
        />
        
        <Button 
            variant="link" 
            className="text-danger p-0 border-0 ms-auto opacity-50 hover-opacity-100" 
            onClick={() => removeOption(index)}
        >
            <FaTrash size={14} />
        </Button>
    </div>
  );
}

