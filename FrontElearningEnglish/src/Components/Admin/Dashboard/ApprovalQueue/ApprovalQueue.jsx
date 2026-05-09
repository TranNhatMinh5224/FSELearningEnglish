import React from "react";
import "./ApprovalQueue.css";
import { MdCheckCircle, MdRateReview, MdSchool, MdHistoryEdu, MdChevronRight } from "react-icons/md";
import Skeleton from "../../../Common/Skeleton/Skeleton";

export default function ApprovalQueue({ items, loading, onAction }) {
  const getIcon = (type) => {
    switch (type) {
      case 'course': return <MdSchool className="queue-icon course" />;
      case 'essay': return <MdHistoryEdu className="queue-icon essay" />;
      default: return <MdRateReview className="queue-icon" />;
    }
  };

  return (
    <div className="dashboard-chart-card approval-queue-card">
      <div className="chart-header">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <MdRateReview className="fs-5 text-warning" />
          Quick Approval Queue
        </h6>
        <span className="badge-count">{items.length} Pending</span>
      </div>

      <div className="queue-list mt-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="queue-item skeleton-item">
              <Skeleton width="40px" height="40px" borderRadius="50%" />
              <div className="ms-3 flex-grow-1">
                <Skeleton width="50%" height="15px" className="mb-2" />
                <Skeleton width="30%" height="10px" />
              </div>
              <Skeleton width="60px" height="24px" borderRadius="8px" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="empty-queue py-4 text-center">
            <MdCheckCircle className="fs-1 text-success opacity-25 mb-2" />
            <p className="text-muted small">All caught up! No pending approvals.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="queue-item">
              <div className="queue-icon-wrapper">
                {getIcon(item.type)}
              </div>
              <div className="queue-content ms-3">
                <div className="queue-title">{item.title}</div>
                <div className="queue-subtitle text-muted">{item.subtitle}</div>
              </div>
              <button 
                className="btn-queue-action ms-auto"
                onClick={() => onAction(item)}
              >
                Review <MdChevronRight />
              </button>
            </div>
          ))
        )}
      </div>
      
      {items.length > 0 && (
        <div className="queue-footer mt-3 pt-3 border-top">
          <button className="btn-link-all w-100">View Full Workflow</button>
        </div>
      )}
    </div>
  );
}
