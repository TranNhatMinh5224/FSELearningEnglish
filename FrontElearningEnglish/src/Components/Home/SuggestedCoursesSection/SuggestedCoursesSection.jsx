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
            <h3 className="fs-3">Catalunya English -Tiếng Anh Số 1 Việt Nam </h3>
            {loading ? (
                <div className="loading-message">Đang tải khóa học...</div>
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
