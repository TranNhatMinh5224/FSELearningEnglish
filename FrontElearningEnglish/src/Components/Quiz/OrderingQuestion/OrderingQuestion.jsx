import React, { useState, useEffect } from "react";
import { FaGripVertical, FaArrowUp, FaArrowDown, FaQuestionCircle } from "react-icons/fa";
import { Card, Alert, Button } from "react-bootstrap";
import "./OrderingQuestion.css";

export default function OrderingQuestion({ question, answer, onChange }) {
    const options = question.options || question.Options || [];
    
    const [orderedOptions, setOrderedOptions] = useState(() => {
        if (!Array.isArray(options) || options.length === 0) return [];

        // Initialize from answer if exists
        if (Array.isArray(answer) && answer.length > 0) {
            try {
                // Reorder options based on answer IDs
                const ordered = answer.map(id => {
                    return options.find(opt => {
                        const optId = opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId;
                        return Number(optId) === Number(id);
                    });
                }).filter(Boolean);

                // Add any missing options that weren't in the answer array
                const orderedIds = new Set(ordered.map(opt => Number(opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId)));
                options.forEach(opt => {
                    const optId = Number(opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId);
                    if (!orderedIds.has(optId)) {
                        ordered.push(opt);
                    }
                });

                return ordered.length > 0 ? ordered : [...options];
            } catch (e) {
                console.error("Error initializing ordering options:", e);
                return [...options];
            }
        }
        // Default: use original order
        return [...options];
    });

    // Reset state when question changes (critical for groups)
    const questionIdNum = Number(question.questionId || question.QuestionId);
    const isResettingRef = React.useRef(false);
    const [draggingIndex, setDraggingIndex] = useState(null);

    useEffect(() => {
        if (!options || options.length === 0) return;
        
        isResettingRef.current = true;
        
        // Logical reset
        let initialOrder = [...options];
        if (Array.isArray(answer) && answer.length > 0) {
            try {
                const ordered = answer.map(id => 
                    options.find(opt => Number(opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId) === Number(id))
                ).filter(Boolean);
                
                const orderedIds = new Set(ordered.map(opt => Number(opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId)));
                options.forEach(opt => {
                    const optId = Number(opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId);
                    if (!orderedIds.has(optId)) ordered.push(opt);
                });
                if (ordered.length > 0) initialOrder = ordered;
            } catch (e) {}
        }
        
        setOrderedOptions(initialOrder);
        
        // Brief timeout to let the reset complete before useEffect for onChange triggers
        setTimeout(() => {
            isResettingRef.current = false;
        }, 10);
    }, [questionIdNum]); // Only dependent on questionId to re-init

    useEffect(() => {
        // Skip onChange during initialization/reset
        if (isResettingRef.current) return;

        // Update answer when order changes
        if (orderedOptions && orderedOptions.length > 0) {
            const orderedIds = orderedOptions
                .filter(opt => opt !== undefined && opt !== null)
                .map(opt => {
                    const id = opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId;
                    return Number(id); // Force Number for backend scoring
                });
            
            // Only trigger onChange if we have valid IDs
            if (orderedIds.length > 0) {
                onChange(orderedIds);
            }
        }
    }, [orderedOptions, onChange]);

    const moveUp = (index) => {
        if (index === 0) return;
        const newOrder = [...orderedOptions];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setOrderedOptions(newOrder);
    };

    const moveDown = (index) => {
        if (index === orderedOptions.length - 1) return;
        const newOrder = [...orderedOptions];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setOrderedOptions(newOrder);
    };

    const handleDragStart = (e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Add a small delay so the ghost image is created before we add the dragging class
        setTimeout(() => {
            e.target.classList.add('is-dragging');
        }, 0);
    };

    const handleDragEnter = (e, index) => {
        if (draggingIndex === null || draggingIndex === index) return;
        
        // Perform the swap in the state for "live" reordering
        const newOrder = [...orderedOptions];
        const draggedItem = newOrder[draggingIndex];
        newOrder.splice(draggingIndex, 1);
        newOrder.splice(index, 0, draggedItem);
        
        setDraggingIndex(index);
        setOrderedOptions(newOrder);
    };

    const handleDragEnd = (e) => {
        setDraggingIndex(null);
        e.target.classList.remove('is-dragging');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        // Drop logic handled by live swapping in onDragEnter
    };

    if (!orderedOptions || orderedOptions.length === 0) {
        return <div className="text-muted p-3 border rounded bg-light">Không có nội dung để sắp xếp.</div>;
    }

    return (
        <div className="ordering-question">
            <div className="ordering-instructions mb-4">
                <FaQuestionCircle className="me-3 text-cyan fs-5" />
                <p className="mb-0 small">Kéo thả các mục hoặc dùng nút mũi tên để sắp xếp theo thứ tự đúng.</p>
            </div>
            <div className="ordering-list">
                {orderedOptions.map((option, index) => {
                    if (!option) return null;
                    
                    const optionId = option.optionId || option.OptionId || option.answerOptionId || option.AnswerOptionId;
                    const optionText = option.optionText || option.OptionText || option.text || option.Text || "---";
                    const optionMedia = option.mediaUrl || option.MediaUrl;
                    const isDraggingThis = draggingIndex === index;
                    
                    return (
                        <Card
                            key={optionId || `idx-${index}`}
                            className={`ordering-item ${isDraggingThis ? 'is-dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                        >
                            <Card.Body className="ordering-item-content d-flex align-items-center p-0">
                                <div className="d-flex align-items-center w-100 gap-3">
                                    <div className="ordering-item-handle">
                                        <FaGripVertical />
                                    </div>
                                    <div className="ordering-item-number">
                                        {index + 1}
                                    </div>
                                    <div className="ordering-item-text">
                                        {optionText}
                                        {optionMedia && (
                                            <div className="ordering-item-media mt-2">
                                                {optionMedia.includes('.mp4') || optionMedia.includes('.webm') ? (
                                                    <video src={optionMedia} controls className="ordering-media-element" />
                                                ) : optionMedia.includes('.mp3') || optionMedia.includes('.wav') ? (
                                                    <audio src={optionMedia} controls className="ordering-media-element w-100" />
                                                ) : (
                                                    <img src={optionMedia} alt="Option media" className="ordering-media-element" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ordering-item-actions pe-3">
                                        <Button
                                            variant="light"
                                            onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                                            disabled={index === 0}
                                        >
                                            <FaArrowUp />
                                        </Button>
                                        <Button
                                            variant="light"
                                            onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                                            disabled={index === orderedOptions.length - 1}
                                        >
                                            <FaArrowDown />
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

