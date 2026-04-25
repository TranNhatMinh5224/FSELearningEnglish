import React from "react";
import { Row, Col } from "react-bootstrap";
import SubmissionCourseCard from "./SubmissionCourseCard";
import "./CourseList.css";

export default function CourseList({ courses, onSelect }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <p>Chưa có khóa học nào</p>
      </div>
    );
  }

  return (
    <Row className="course-list-row g-4">
      {courses.map((course) => {
        const courseId = course.courseId || course.CourseId || course.id;
        return (
          <Col key={courseId} xs={12} sm={6} md={4} lg={3} className="d-flex justify-content-center">
            <SubmissionCourseCard 
              course={course} 
              onClick={() => onSelect(course)} 
            />
          </Col>
        );
      })}
    </Row>
  );
}

