import React from "react";
import SuggestedCourseCard from "../SuggestedCourseCard/SuggestedCourseCard";
import { useSystemCourses } from "../../../hooks/useCourses";
import "./SuggestedCoursesSection.css";

export default function SuggestedCoursesSection({ courses = [] }) {
    const { data: systemCourses, isLoading: loading, error } = useSystemCourses();

    // Use systemCourses from API, fallback to prop courses, then empty array
    const displayCourses = React.useMemo(() => {
        if (systemCourses && systemCourses.length > 0) {
            return systemCourses;
        }
        return courses.length > 0 ? courses : [];
    }, [systemCourses, courses]);

    return (
        <div className="suggested-courses-section">
            <h2 className="fs-3">Catalunya English - Tiếng Anh Số 1 Việt Nam</h2>
            {loading ? (
                <div className="row g-3 g-md-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                            <div className="course-card-skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-price"></div>
                                    <div className="skeleton-button"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="error-message">{error.message || "Lỗi khi tải dữ liệu"}</div>
            ) : displayCourses.length > 0 ? (
                <div className="row g-3 g-md-4">
                    {displayCourses.map((course, index) => (
                        <div key={course.id || index} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                            <SuggestedCourseCard
                                course={course}
                                isEnrolled={course.isEnrolled || false}
                                showEnrolledBadge={true}
                                priority={index < 2}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-courses-message">Chưa có khóa học nào</div>
            )}
        </div>
    );
}
