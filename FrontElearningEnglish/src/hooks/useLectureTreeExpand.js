import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook để persist expand state của lecture tree vào localStorage
 * @param {number|string} moduleId - ID của module để tạo key duy nhất
 * @returns {Object} - { expandedIds, toggleExpand, setExpandedIds, isExpanded }
 */
export function useLectureTreeExpand(moduleId) {
    const storageKey = `lecture_tree_expand_${moduleId}`;

    // Initialize state từ localStorage
    const [expandedIds, setExpandedIds] = useState(() => {
        if (!moduleId) return new Set();

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return new Set(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.warn('Failed to load expand state:', e);
        }
        return new Set();
    });

    // Sync to localStorage khi expandedIds thay đổi
    useEffect(() => {
        if (!moduleId) return;

        try {
            const toSave = Array.from(expandedIds);
            localStorage.setItem(storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save expand state:', e);
        }
    }, [expandedIds, storageKey, moduleId]);

    // Toggle một lecture ID
    const toggleExpand = useCallback((lectureId) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lectureId)) {
                newSet.delete(lectureId);
            } else {
                newSet.add(lectureId);
            }
            return newSet;
        });
    }, []);

    // Check nếu một lecture đang expand
    const isExpanded = useCallback((lectureId) => {
        return expandedIds.has(lectureId);
    }, [expandedIds]);

    // Expand all từ danh sách lectures
    const expandAll = useCallback((lectures) => {
        const getAllIds = (items) => {
            let ids = [];
            items.forEach(item => {
                const id = item.lectureId || item.LectureId;
                if (id) ids.push(id);
                if (item.children && item.children.length > 0) {
                    ids = ids.concat(getAllIds(item.children));
                }
            });
            return ids;
        };

        setExpandedIds(new Set(getAllIds(lectures)));
    }, []);

    // Collapse all
    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    return {
        expandedIds,
        toggleExpand,
        setExpandedIds,
        isExpanded,
        expandAll,
        collapseAll
    };
}

export default useLectureTreeExpand;
