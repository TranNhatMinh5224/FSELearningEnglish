import React from "react";
import Skeleton from "./Skeleton";
import "./Skeleton.css";

// --- Lecture Skeletons ---
export const LectureContentSkeleton = () => {
    return (
        <div className="lecture-content-skeleton">
            <Skeleton width="60%" height="40px" className="mb-4" /> {/* Title */}
            <div className="mb-5 d-flex gap-3">
                <Skeleton width="100px" height="24px" />
                <Skeleton width="120px" height="24px" />
            </div>
            <Skeleton width="100%" height="200px" className="mb-4" /> {/* Image/Video Area */}
            <Skeleton width="100%" height="20px" className="mb-2" />
            <Skeleton width="100%" height="20px" className="mb-2" />
            <Skeleton width="90%" height="20px" className="mb-4" />
            <Skeleton width="100%" height="150px" className="mb-4" />
            <Skeleton width="80%" height="20px" className="mb-2" />
        </div>
    );
};

export const LectureTreeSkeleton = () => {
    return (
        <div className="lecture-tree-skeleton p-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="mb-3 d-flex align-items-center gap-2">
                    <Skeleton width="24px" height="24px" borderRadius="50%" />
                    <Skeleton width={i % 2 === 0 ? "80%" : "60%"} height="20px" />
                </div>
            ))}
        </div>
    );
};

// --- Assessment Skeletons ---
export const AssessmentCardSkeleton = () => {
    return (
        <div className="assessment-card-skeleton p-3 border rounded mb-3 bg-white" style={{ border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <div className="flex-grow-1">
                    <Skeleton width="70%" height="24px" className="mb-2" />
                    <Skeleton width="40%" height="16px" />
                </div>
            </div>
            <div className="pt-3 border-top">
                <Skeleton width="60%" height="14px" className="mb-2" />
                <Skeleton width="50%" height="14px" />
            </div>
        </div>
    );
};

export const AssessmentDetailSkeleton = () => {
    return (
        <div className="assessment-detail-skeleton py-4">
            <div className="mb-5 d-flex justify-content-between align-items-start flex-wrap gap-4">
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <Skeleton width="80%" height="40px" className="mb-3" />
                    <Skeleton width="100%" height="20px" className="mb-2" />
                    <Skeleton width="90%" height="20px" />
                </div>
                <Skeleton width="280px" height="120px" />
            </div>
            <div className="row g-4">
                <div className="col-lg-6 border-end">
                    <Skeleton width="40%" height="28px" className="mb-4" />
                    {[...Array(3)].map((_, i) => <AssessmentCardSkeleton key={i} />)}
                </div>
                <div className="col-lg-6">
                    <Skeleton width="40%" height="28px" className="mb-4" />
                    {[...Array(2)].map((_, i) => <AssessmentCardSkeleton key={i} />)}
                </div>
            </div>
        </div>
    );
};
export const FlashCardSkeleton = () => {
    return (
        <div className="flashcard-skeleton py-4 d-flex flex-column align-items-center">
            {/* Progress Bar Skeleton */}
            <div className="w-100 mb-4" style={{ maxWidth: '600px' }}>
                <div className="d-flex justify-content-between mb-2">
                    <Skeleton width="60px" height="16px" />
                    <Skeleton width="40px" height="16px" />
                </div>
                <Skeleton width="100%" height="8px" borderRadius="10px" />
            </div>
            
            {/* Main Card Skeleton */}
            <div className="flashcard-viewer-skeleton" style={{ 
                width: '100%', 
                maxWidth: '500px', 
                height: '400px', 
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
            }}>
                <Skeleton width="40%" height="32px" className="mb-4" />
                <Skeleton width="60%" height="24px" className="mb-3" />
                <Skeleton width="20%" height="20px" className="mb-5" />
                <div className="w-100 mt-4 d-flex justify-content-between px-4">
                     <Skeleton width="100px" height="45px" borderRadius="25px" />
                     <Skeleton width="100px" height="45px" borderRadius="25px" />
                </div>
            </div>
        </div>
    );
};

export const LessonDetailSkeleton = () => {
    return (
        <div className="lesson-detail-skeleton py-4">
            <div className="row g-4">
                {/* Left Col - Lesson Info */}
                <div className="col-md-4">
                    <div className="p-4 border rounded bg-white" style={{ height: '400px' }}>
                        <Skeleton width="100%" height="200px" className="mb-4" borderRadius="12px" />
                        <Skeleton width="80%" height="32px" className="mb-3" />
                        <Skeleton width="100%" height="60px" className="mb-4" />
                        <Skeleton width="100%" height="45px" borderRadius="8px" />
                    </div>
                </div>
                {/* Right Col - Modules List */}
                <div className="col-md-8">
                    <div className="p-4 border rounded bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Skeleton width="150px" height="28px" />
                        </div>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="mb-3 p-3 border rounded d-flex align-items-center gap-3">
                                <Skeleton width="50px" height="50px" borderRadius="8px" />
                                <div className="flex-grow-1">
                                    <Skeleton width="40%" height="20px" className="mb-2" />
                                    <Skeleton width="20%" height="14px" />
                                </div>
                                <Skeleton width="80px" height="32px" />
                            </div>
                        ))}
                        <Skeleton width="100%" height="50px" className="mt-3" borderRadius="8px" />
                    </div>
                </div>
            </div>
        </div>
    );
};
