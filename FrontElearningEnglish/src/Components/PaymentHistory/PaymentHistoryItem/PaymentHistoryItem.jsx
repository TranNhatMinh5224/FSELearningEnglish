import React from "react";
import { Badge } from "react-bootstrap";
import "./PaymentHistoryItem.css";

export default function PaymentHistoryItem({ transaction, statusBadge, formatDate, onClick }) {
    const productName = transaction.productName || transaction.ProductName || "N/A";
    const amount = transaction.amount || transaction.Amount || 0;
    const paidAt = transaction.paidAt || transaction.PaidAt || transaction.createdAt || transaction.CreatedAt;

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <div className="payment-item" onClick={onClick}>
            <div className="payment-column product-column">
                <span className="mobile-label d-md-none">Sản phẩm</span>
                <span className="payment-product">{productName}</span>
            </div>
            <div className="payment-column amount-column">
                <span className="mobile-label d-md-none">Số tiền</span>
                <span className="payment-amount">{formatAmount(amount)}</span>
            </div>
            <div className="payment-column status-column">
                <span className="mobile-label d-md-none">Trạng thái</span>
                <Badge bg={statusBadge.variant} className={`status-badge ${statusBadge.customClass || ""}`}>
                    {statusBadge.text}
                </Badge>
            </div>
            <div className="payment-column date-column">
                <span className="mobile-label d-md-none">Ngày thanh toán</span>
                <span className="payment-date">{formatDate(paidAt)}</span>
            </div>
        </div>
    );
}

