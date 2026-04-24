import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronRight, FaCheckCircle, FaCircle } from "react-icons/fa";
import "./LectureTree.css";

const LectureTree = ({ lectureTree, currentLectureId, onLectureClick }) => {
    const [expandedItems, setExpandedItems] = useState(new Set());
    const treeContentRef = useRef(null);
    const activeItemRef = useRef(null);
    const hasInitializedRef = useRef(false); // Track if we've done initial auto-expand

    // Reset initialization when tree changes (e.g., switching modules)
    useEffect(() => {
        hasInitializedRef.current = false;
        setExpandedItems(new Set()); // Reset expanded items when tree changes
    }, [lectureTree]);

    // Auto-expand items that contain the current lecture ONLY on initial load
    // After that, user controls expand/collapse manually
    useEffect(() => {
        if (currentLectureId && lectureTree.length > 0 && !hasInitializedRef.current) {
            const findParentIds = (items, targetId, parentIds = []) => {
                for (const item of items) {
                    const itemId = item.lectureId || item.LectureId;
                    const children = item.children || item.Children || [];
                    
                    if (itemId === targetId) {
                        return parentIds;
                    }
                    
                    if (children.length > 0) {
                        const result = findParentIds(children, targetId, [...parentIds, itemId]);
                        if (result !== null) {
                            return result;
                        }
                    }
                }
                return null;
            };

            const parentIds = findParentIds(lectureTree, currentLectureId);
            if (parentIds) {
                setExpandedItems(new Set(parentIds));
            }
            
            hasInitializedRef.current = true;
        }
    }, [currentLectureId, lectureTree]);

    // Scroll to active item when currentLectureId changes (but don't change expanded state)
    useEffect(() => {
        if (currentLectureId && lectureTree.length > 0) {
            setTimeout(() => {
                if (activeItemRef.current && treeContentRef.current) {
                    const activeElement = activeItemRef.current;
                    const treeContent = treeContentRef.current;
                    
                    const activeTop = activeElement.offsetTop;
                    const activeHeight = activeElement.offsetHeight;
                    const treeHeight = treeContent.clientHeight;
                    const treeScrollTop = treeContent.scrollTop;
                    
                    const isVisible = activeTop >= treeScrollTop && 
                                    (activeTop + activeHeight) <= (treeScrollTop + treeHeight);
                    
                    if (!isVisible) {
                        const scrollTo = activeTop - (treeHeight / 2) + (activeHeight / 2);
                        treeContent.scrollTo({
                            top: Math.max(0, scrollTo),
                            behavior: 'smooth'
                        });
                    }
                }
            }, 100);
        }
    }, [currentLectureId, lectureTree]);

    const renderTreeItem = (lecture, level = 0, index = 0, prefix = "") => {
        const lectureId = lecture.lectureId || lecture.LectureId;
        const title = lecture.title || lecture.Title || "";
        const children = lecture.children || lecture.Children || [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedItems.has(lectureId);
        const isActive = lectureId === currentLectureId;

        // Generate hierarchical label: e.g., 1, 1.1, 1.1.2
        const currentNumber = index + 1;
        const hierarchicalLabel = prefix ? `${prefix}.${currentNumber}` : `${currentNumber}`;
        const displayLabel = hierarchicalLabel;
        const displayTitle = title;

        const handleNodeClick = (e) => {
            e.stopPropagation();
            onLectureClick(lectureId);
            
            if (hasChildren && !isExpanded) {
                const newExpanded = new Set(expandedItems);
                newExpanded.add(lectureId);
                setExpandedItems(newExpanded);
            }
        };

        const handleExpandToggle = (e) => {
            e.stopPropagation();
            const newExpanded = new Set(expandedItems);
            if (newExpanded.has(lectureId)) {
                newExpanded.delete(lectureId);
            } else {
                newExpanded.add(lectureId);
            }
            setExpandedItems(newExpanded);
        };

        return (
            <div key={lectureId} className="tree-item">
                <div
                    ref={isActive ? activeItemRef : null}
                    className={`tree-node ${isActive ? "active" : ""} ${hasChildren ? "has-children" : "leaf-node"} level-${level}`}
                    onClick={handleNodeClick}
                >
                    {!hasChildren && (
                        <span className="status-icon">
                            {isActive ? <FaCheckCircle className="status-completed" /> : <FaCircle className="status-pending" />}
                        </span>
                    )}
                    {hasChildren && (
                        <span className="expand-icon-placeholder">
                            {isExpanded ? <FaChevronDown className="folder-icon" /> : <FaChevronRight className="folder-icon" />}
                        </span>
                    )}
                    <span className="tree-numbering">{displayLabel}</span>
                    <span className="tree-title" title={displayTitle}>{displayTitle}</span>
                    {hasChildren && (
                        <span className="expand-icon" onClick={handleExpandToggle}>
                            {/* Hidden expand icon since it's now at the front */}
                        </span>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="tree-children">
                        {children.map((child, idx) => renderTreeItem(child, level + 1, idx, hierarchicalLabel))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="lecture-tree">
            <div ref={treeContentRef} className="tree-content">
                {lectureTree.length > 0 ? (
                    lectureTree.map((lecture, idx) => renderTreeItem(lecture, 0, idx, ""))
                ) : (
                    <div className="no-lectures-message">Chưa có bài giảng nào</div>
                )}
            </div>
        </div>
    );
};

LectureTree.displayName = "LectureTree";

export default LectureTree;
