import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { FaWallet, FaPlusCircle, FaHistory, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import MainHeader from "../../Components/Header/MainHeader";
import { useAuth } from "../../Context/AuthContext";
import { paymentService } from "../../Services/paymentService";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";
import { PRODUCT_TYPE, PAYMENT_GATEWAY } from "../../config/enums";
import "./TopUp.css";

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function TopUp() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [selectedAmount, setSelectedAmount] = useState(PRESET_AMOUNTS[0]);
    const [customAmount, setCustomAmount] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({
        show: false,
        type: "info",
        message: ""
    });

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString("vi-VN") + " VNĐ";
    };

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setIsCustom(false);
    };

    const handleCustomChange = (e) => {
        const val = e.target.value.replace(/\D/g, "");
        setCustomAmount(val);
        if (val) {
            setSelectedAmount(parseInt(val));
        }
    };

    const handleTopUp = async () => {
        if (!selectedAmount || selectedAmount < 10000) {
            setModal({
                show: true,
                type: "error",
                message: "Số tiền nạp tối thiểu là 10,000 VNĐ."
            });
            return;
        }

        try {
            setLoading(true);
            const idempotencyKey = `topup-${user.userId}-${Date.now()}`;

            // ProductId là số tiền nạp cho ProductType.TopUp (3)
            const response = await paymentService.processPayment({
                ProductId: selectedAmount,
                typeproduct: PRODUCT_TYPE.TOP_UP, // 3
                IdempotencyKey: idempotencyKey,
                Gateway: PAYMENT_GATEWAY.PAYOS // 4
            });

            if (response.data?.success && response.data?.data?.paymentId) {
                const paymentId = response.data.data.paymentId;
                // Chuyển hướng đến trang thanh toán chi tiết (giống course checkout)
                // để hiển thị QR code của PayOS
                navigate(`/payment?paymentId=${paymentId}&typeproduct=3`);
            } else {
                throw new Error(response.data?.message || "Không thể tạo yêu cầu nạp tiền.");
            }
        } catch (error) {
            setModal({
                show: true,
                type: "error",
                message: error.response?.data?.message || error.message || "Có lỗi xảy ra khi nạp tiền."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <MainHeader />
            <Container className="topup-container py-5">
                <div className="topup-header mb-4 d-flex align-items-center justify-content-between">
                    <Button variant="link" className="p-0 text-muted d-flex align-items-center back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft className="me-2" /> Quay lại
                    </Button>
                    <h2 className="topup-page-title m-0">Nạp tiền vào ví</h2>
                    <div style={{ width: "80px" }}></div> {/* Spacer */}
                </div>

                <Row>
                    <Col lg={4} className="mb-4">
                        <Card className="balance-card h-100">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
                                <div className="wallet-icon-circle mb-3">
                                    <FaWallet />
                                </div>
                                <h5 className="text-muted mb-2">Số dư hiện tại</h5>
                                <h2 className="current-balance text-primary mb-4">{formatCurrency(user?.balance)}</h2>
                                <Button
                                    variant="outline-primary"
                                    className="w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2"
                                    onClick={() => navigate("/payment-history")}
                                >
                                    <FaHistory /> Lịch sử giao dịch
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card className="topup-selection-card">
                            <Card.Body className="p-4">
                                <h5 className="mb-4 d-flex align-items-center gap-2">
                                    <FaPlusCircle className="text-primary" /> Chọn số tiền cần nạp
                                </h5>

                                <div className="amount-grid mb-4">
                                    {PRESET_AMOUNTS.map((amt) => (
                                        <div
                                            key={amt}
                                            className={`amount-item ${!isCustom && selectedAmount === amt ? "active" : ""}`}
                                            onClick={() => handleAmountSelect(amt)}
                                        >
                                            <span className="amt-value">
                                                {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                                            </span>
                                            <span className="amt-unit">VNĐ</span>
                                        </div>
                                    ))}
                                    <div
                                        className={`amount-item custom-item ${isCustom ? "active" : ""}`}
                                        onClick={() => setIsCustom(true)}
                                    >
                                        <span>Tùy chỉnh</span>
                                    </div>
                                </div>

                                {isCustom && (
                                    <Form.Group className="mb-4">
                                        <Form.Label>Nhập số tiền muốn nạp (VNĐ)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ví dụ: 50.000"
                                            value={customAmount}
                                            onChange={handleCustomChange}
                                            className="amount-input"
                                            autoFocus
                                        />
                                        <Form.Text className="text-muted">
                                            Số tiền nạp tối thiểu là 10.000 VNĐ
                                        </Form.Text>
                                    </Form.Group>
                                )}

                                <div className="selected-summary p-3 rounded mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">Tổng thanh toán:</span>
                                        <span className="total-to-pay">{formatCurrency(selectedAmount)}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-100 py-3 mb-3 topup-submit-btn"
                                    onClick={handleTopUp}
                                    disabled={loading || !selectedAmount}
                                >
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span> Đang xử lý...</>
                                    ) : "Tiến hành nạp tiền"}
                                </Button>

                                <div className="secure-payment-notice">
                                    <FaShieldAlt className="text-success me-2" />
                                    <span>Thanh toán an toàn qua cổng PayOS (Hỗ trợ VietQR)</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <NotificationModal
                isOpen={modal.show}
                onClose={() => setModal({ ...modal, show: false })}
                type={modal.type}
                message={modal.message}
                autoClose={modal.type === "success"}
            />
        </>
    );
}
