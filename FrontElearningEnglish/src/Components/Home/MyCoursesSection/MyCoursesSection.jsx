import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CourseCard from "../CourseCard/CourseCard";
import { useSystemCourses } from "../../../hooks/useCourses";
import "./MyCoursesSection.css";

export default function MyCoursesSection({ courses = [] }) {
    const { data: systemCourses, isLoading: loading, error } = useSystemCourses();
    const scrollContainerRef = useRef(null);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);

    // Derived state: Filter featured courses
    const displayCourses = React.useMemo(() => {
        if (systemCourses && systemCourses.length > 0) {
            return systemCourses.filter(course => course.isFeatured === true);
        }
        return courses.length > 0 ? courses : [];
    }, [systemCourses, courses]);

    // Check scroll position and update button visibility
    const checkScrollPosition = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        const canScroll = scrollWidth > clientWidth;
        
        if (!canScroll) {
            setShowLeftButton(false);
            setShowRightButton(false);
            return;
        }

        const isAtStart = scrollLeft <= 0;
        const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;

        setShowLeftButton(!isAtStart);
        setShowRightButton(!isAtEnd);
    };

    const handleScrollLeft = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const cards = container.querySelectorAll('.course-card');
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth;
        const gap = 28;
        const scrollDistance = (cardWidth * 2) + gap;
        const newScrollLeft = Math.max(0, container.scrollLeft - scrollDistance);
        container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    };

    const handleScrollRight = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const cards = container.querySelectorAll('.course-card');
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth;
        const gap = 28;
        const scrollDistance = (cardWidth * 2) + gap;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const newScrollLeft = Math.min(maxScroll, container.scrollLeft + scrollDistance);
        container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            checkScrollPosition();
        }, 100);
        return () => clearTimeout(timer);
    }, [displayCourses.length]);

    useEffect(() => {
        const handleResize = () => checkScrollPosition();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <section className="my-courses-section">
            <h2>Kho tàng khóa học nổi bật</h2>
            {loading ? (
                <div className="loading-message">Đang tải khóa học...</div>
            ) : error ? (
                <div className="error-message">{error.message || "Lỗi khi tải dữ liệu"}</div>
            ) : displayCourses.length > 0 ? (
                <div className="course-grid-wrapper">
                    {showLeftButton && (
                        <button className="scroll-button scroll-button-left" onClick={handleScrollLeft} aria-label="Scroll left">
                            <FaChevronLeft />
                        </button>
                    )}
                    <div className="course-grid" ref={scrollContainerRef} onScroll={checkScrollPosition}>
                        {displayCourses.map((course, index) => (
                            <CourseCard key={course.id || index} course={course} />
                        ))}
                    </div>
                    {showRightButton && (
                        <button className="scroll-button scroll-button-right" onClick={handleScrollRight} aria-label="Scroll right">
                            <FaChevronRight />
                        </button>
                    )}
                </div>
            ) : (
                <div className="no-courses-message">Chưa có khóa học nào</div>
            )}
        </section>
    );
}
