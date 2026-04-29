import React from "react";
import { Row, Col } from "react-bootstrap";
import "./PaymentHistoryItem.css";
import { FaReceipt, FaCreditCard, FaCalendarAlt, FaChevronRight } from "react-icons/fa";

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
        <div className="payment-history-item-row" onClick={onClick}>
            <Row className="g-0 align-items-center">
                <Col xs={12} md={5} lg={4} className="product-info">
                    <div className="product-title-wrapper">
                        <FaReceipt className="item-icon-small" />
                        <span className="payment-product">{productName}</span>
                    </div>
                </Col>
                <Col xs={6} md={2} lg={2} className="amount-info">
                    <span className="label d-md-none">Số tiền: </span>
                    <span className="payment-amount">{formatAmount(amount)}</span>
                </Col>
                <Col xs={6} md={2} lg={2} className="status-info text-center">
                    <span className="label d-md-none">Trạng thái: </span>
                    <span className={`status-badge-custom ${statusBadge.customClass || ""}`}>
                        {statusBadge.text}
                    </span>
                </Col>
                <Col xs={12} md={3} lg={4} className="date-info text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <span className="payment-date">{formatDate(paidAt)}</span>
                        <FaChevronRight className="chevron-icon d-none d-md-block" />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

