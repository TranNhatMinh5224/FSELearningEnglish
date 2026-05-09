import React from "react";
import "./RecentTransactions.css";
import { MdOutlineHistory, MdCheckCircle, MdPending, MdCancel, MdError } from "react-icons/md";
import Skeleton from "../../../Common/Skeleton/Skeleton";

export default function RecentTransactions({ transactions, loading, onViewAll }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 2: return <MdCheckCircle className="status-icon success" />; // Completed
      case 1: return <MdPending className="status-icon warning" />;    // Pending
      case 3: return <MdError className="status-icon danger" />;       // Failed
      case 5: return <MdCancel className="status-icon muted" />;       // Cancelled
      default: return <MdPending className="status-icon muted" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1: return "Pending";
      case 2: return "Success";
      case 3: return "Failed";
      case 4: return "Expired";
      case 5: return "Cancelled";
      default: return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-chart-card recent-transactions-card">
      <div className="chart-header">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <MdOutlineHistory className="fs-5 text-primary" />
          Recent Transactions
        </h6>
        <button className="btn-view-all" onClick={onViewAll}>View All</button>
      </div>

      <div className="transactions-list mt-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="transaction-item skeleton-item">
              <Skeleton width="40px" height="40px" borderRadius="12px" />
              <div className="ms-3 flex-grow-1">
                <Skeleton width="60%" height="15px" className="mb-2" />
                <Skeleton width="40%" height="10px" />
              </div>
              <Skeleton width="80px" height="20px" />
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="empty-transactions py-4 text-center text-muted">
            No recent transactions found.
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.paymentId} className="transaction-item">
              <div className="user-avatar-box">
                {tx.userDisplayName?.charAt(0) || "U"}
              </div>
              <div className="transaction-info ms-3">
                <div className="user-name">{tx.userDisplayName || "Customer"}</div>
                <div className="product-name text-muted">{tx.productName}</div>
              </div>
              <div className="transaction-meta ms-auto text-end">
                <div className="amount fw-bold">
                  {tx.amount?.toLocaleString("vi-VN")} đ
                </div>
                <div className={`status-tag status-${getStatusText(tx.status).toLowerCase()}`}>
                  {getStatusIcon(tx.status)}
                  {getStatusText(tx.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
