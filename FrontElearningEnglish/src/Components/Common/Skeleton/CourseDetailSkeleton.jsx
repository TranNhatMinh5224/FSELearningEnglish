import React from "react";
import Skeleton from "./Skeleton";
import { Container, Row, Col } from "react-bootstrap";
import "./Skeleton.css";

const CourseDetailSkeleton = () => {
  return (
    <div className="admin-course-detail-container skeleton-container">
      <Container fluid className="px-0">
        <Row className="g-4">
          {/* Main Content Area */}
          <Col lg={8}>
            <div className="course-main-card" style={{ borderRadius: '24px', padding: '2rem', background: '#fff' }}>
              <div className="d-flex align-items-center gap-4 mb-4">
                 <Skeleton width="100px" height="100px" borderRadius="16px" />
                 <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="32px" className="mb-2" />
                    <Skeleton width="30%" height="20px" />
                 </div>
              </div>
              
              <Skeleton width="100%" height="200px" borderRadius="16px" className="mb-4" />
              <Skeleton width="100%" height="100px" borderRadius="12px" />
            </div>

            <div className="lessons-section mt-5">
               <Skeleton width="150px" height="28px" className="mb-4" />
               {[1, 2, 3].map((i) => (
                 <Skeleton key={i} width="100%" height="80px" borderRadius="16px" className="mb-3" />
               ))}
            </div>
          </Col>

          {/* Sidebar Area */}
          <Col lg={4}>
            <div className="course-stats-sidebar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="course-stat-card-skeleton" 
                     style={{ 
                       background: '#fff', 
                       borderRadius: '24px', 
                       padding: '1.5rem', 
                       marginBottom: '1rem',
                       border: '1px solid #f1f5f9'
                     }}>
                  <div className="d-flex align-items-center gap-3">
                    <Skeleton width="48px" height="48px" borderRadius="12px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="40%" height="14px" className="mb-2" />
                      <Skeleton width="70%" height="22px" />
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
