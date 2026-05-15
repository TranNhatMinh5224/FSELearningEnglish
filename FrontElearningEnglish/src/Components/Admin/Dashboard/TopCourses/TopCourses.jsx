import React from "react";
import "./TopCourses.css";
import { MdBarChart, MdPeople, MdChevronRight, MdAutoGraph } from "react-icons/md";
import Skeleton from "../../../Common/Skeleton/Skeleton";

export default function TopCourses({ courses, loading, onViewAll }) {
  return (
    <div className="dashboard-chart-card top-courses-card">
      <div className="chart-header">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <MdAutoGraph className="fs-5 text-success" />
          Top Performing Courses
        </h6>
        <button className="btn-view-all" onClick={onViewAll}>Explore</button>
      </div>

      <div className="courses-list mt-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="course-item skeleton-item">
              <Skeleton width="40px" height="40px" borderRadius="8px" />
              <div className="ms-3 flex-grow-1">
                <Skeleton width="60%" height="15px" className="mb-2" />
                <Skeleton width="40%" height="10px" />
              </div>
              <Skeleton width="50px" height="20px" />
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="empty-state py-4 text-center text-muted">
            No course data available.
          </div>
        ) : (
          courses.slice(0, 4).map((course) => (
            <div key={course.courseId} className="course-performance-item">
              <div className="course-icon-box">
                <MdBarChart />
              </div>
              <div className="course-details ms-3">
                <div className="course-name">{course.title}</div>
                <div className="course-instructor text-muted small">{course.teacherName || "System Admin"}</div>
              </div>
              <div className="course-stats ms-auto text-end">
                <div className="student-count d-flex align-items-center gap-1 justify-content-end">
                  <MdPeople className="text-primary" />
                  <strong>{course.studentCount || 0}</strong>
                </div>
                <div className="small text-muted">Students</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
