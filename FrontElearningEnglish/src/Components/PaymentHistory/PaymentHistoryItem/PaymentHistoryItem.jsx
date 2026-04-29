import React from "react";
import { Badge, Row, Col } from "react-bootstrap";
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
        <div className="payment-item-wrapper" onClick={onClick}>
            <Row className="payment-item g-0 align-items-center">
                <Col xs={12} md={5} lg={4} className="payment-column product-column">
                    <span className="mobile-label d-md-none">Sản phẩm</span>
                    <span className="payment-product">{productName}</span>
                </Col>
                <Col xs={6} md={2} lg={2} className="payment-column amount-column">
                    <span className="mobile-label d-md-none">Số tiền</span>
                    <span className="payment-amount">{formatAmount(amount)}</span>
                </Col>
                <Col xs={6} md={2} lg={2} className="payment-column status-column text-md-center">
                    <span className="mobile-label d-md-none">Trạng thái</span>
                    <Badge bg={statusBadge.variant} className={`status-badge ${statusBadge.customClass || ""}`}>
                        {statusBadge.text}
                    </Badge>
                </Col>
                <Col xs={12} md={3} lg={4} className="payment-column date-column">
                    <span className="mobile-label d-md-none">Ngày thanh toán</span>
                    <span className="payment-date">{formatDate(paidAt)}</span>
                </Col>
            </Row>
        </div>
    );
}

