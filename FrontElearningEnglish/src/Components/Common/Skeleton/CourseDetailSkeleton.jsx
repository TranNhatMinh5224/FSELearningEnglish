import React from "react";
import Skeleton from "./Skeleton";
import { Container, Row, Col } from "react-bootstrap";
import "./Skeleton.css";

const CourseDetailSkeleton = () => {
  return (
    <div className="teacher-course-detail-container skeleton-container">
      <Container fluid className="px-0">
        <Row className="g-4">
          {/* Sidebar Area (Left in Teacher Detail) */}
          <Col md={4}>
            <div className="course-info-card-skeleton" style={{ background: '#fff', borderRadius: '24px', padding: '2rem' }}>
              <Skeleton width="100%" height="200px" borderRadius="16px" className="mb-4" />
              <Skeleton width="80%" height="32px" className="mb-3" />
              <Skeleton width="100%" height="100px" borderRadius="12px" className="mb-4" />
              
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-3 d-flex align-items-center gap-3">
                  <Skeleton width="40px" height="40px" borderRadius="10px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height="12px" className="mb-2" />
                    <Skeleton width="60%" height="18px" />
                  </div>
                </div>
              ))}
            </div>
          </Col>

          {/* Main Content Area (Right in Teacher Detail) */}
          <Col md={8}>
            <div className="lessons-section-skeleton" style={{ background: '#fff', borderRadius: '24px', padding: '2rem' }}>
               <Skeleton width="200px" height="28px" className="mb-4" />
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="mb-3 p-3" style={{ border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <Skeleton width="80px" height="60px" borderRadius="12px" />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="50%" height="20px" className="mb-2" />
                            <Skeleton width="30%" height="14px" />
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CourseDetailSkeleton;
