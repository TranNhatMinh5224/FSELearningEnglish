import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaClock } from "react-icons/fa";
import "./PaymentSuccess.css";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status");

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        <div className="success-icon-wrapper" style={{ color: "#f59e0b" }}>
          <FaClock className="success-icon" />
        </div>

        <h1 className="result-title">Giao dịch đang xử lý</h1>
        <p className="result-message">
          Hệ thống đã ghi nhận yêu cầu thanh toán. Vui lòng đợi thêm vài giây để cổng thanh toán xác nhận.
        </p>

        {(orderCode || status) && (
          <div className="payment-details">
            {orderCode && (
              <div className="detail-row">
                <span className="detail-label">Mã đơn:</span>
                <span className="detail-value">{orderCode}</span>
              </div>
            )}
            {status && (
              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                <span className="detail-value">{status}</span>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate("/payment-history")}>Xem lịch sử giao dịch</button>
          <button className="btn-secondary" onClick={() => navigate("/home")}>Về trang chủ</button>
        </div>
      </div>
    </div>
  );
}
