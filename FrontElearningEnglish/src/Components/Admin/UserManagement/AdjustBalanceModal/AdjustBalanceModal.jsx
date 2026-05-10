import React, { useState } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { FaWallet, FaPlus, FaMinus, FaLanguage } from "react-icons/fa";
import { toVietnameseWords } from "../../../../Utils/currencyUtils";
import PremiumCloseButton from "../../../Common/PremiumCloseButton/PremiumCloseButton";
import { PiWalletDuotone } from "react-icons/pi";

export default function AdjustBalanceModal({ show, onClose, user, onConfirm }) {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isAdding, setIsAdding] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!amount) return;
        
        const numericAmount = typeof amount === 'string' 
            ? parseInt(amount.replace(/[^\d]/g, '')) 
            : parseInt(amount);

        if (isNaN(numericAmount) || numericAmount <= 0) return;
        
        setLoading(true);
        const finalAmount = isAdding ? numericAmount : -numericAmount;
        
        await onConfirm(user.userId || user.UserId || user.id, {
            amount: finalAmount,
            reason: reason || (isAdding ? "Admin nạp tiền" : "Admin khấu trừ tiền")
        });
        
        setLoading(false);
        setAmount("");
        setReason("");
    };

    return (
        <Modal show={show} onHide={onClose} centered size="lg" className="modal-modern modal-balance-size">
            <Modal.Header closeButton={false} className="px-4 py-3">
                <Modal.Title className="fw-bold modal-title-centered text-white d-flex align-items-center gap-3">
                    <PiWalletDuotone size={32} />
                    <span>Điều chỉnh số dư</span>
                </Modal.Title>
                <PremiumCloseButton onClick={onClose} />
            </Modal.Header>
            <Modal.Body>
                {user && (
                    <div className="mb-4 p-3 bg-light rounded shadow-sm border">
                        <div className="d-flex align-items-center mb-2">
                            <span className="fw-bold me-2 text-muted">Người dùng:</span>
                            <span className="fw-bold">{user.displayName || user.DisplayName || user.email || user.Email}</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="fw-bold me-2 text-muted">Số dư hiện tại:</span>
                            <span className="text-primary fw-bold fs-5">
                                {(user.balance || user.Balance || 0).toLocaleString("vi-VN")} VNĐ
                            </span>
                        </div>
                    </div>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small text-uppercase">Loại điều chỉnh</Form.Label>
                    <div className="d-flex gap-2">
                        <Button 
                            variant={isAdding ? "success" : "outline-success"} 
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
                            onClick={() => setIsAdding(true)}
                        >
                            <FaPlus /> Nạp tiền
                        </Button>
                        <Button 
                            variant={!isAdding ? "danger" : "outline-danger"} 
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
                            onClick={() => setIsAdding(false)}
                        >
                            <FaMinus /> Khấu trừ
                        </Button>
                    </div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small text-uppercase">Số tiền (VNĐ)</Form.Label>
                    <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-end-0 text-primary"><FaWallet /></InputGroup.Text>
                        <Form.Control 
                            type="number" 
                            placeholder="Nhập số tiền..." 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="border-start-0 py-2 fs-5 fw-bold"
                        />
                        <InputGroup.Text className="bg-white border-start-0 text-muted fw-bold">VNĐ</InputGroup.Text>
                    </InputGroup>
                    {amount > 0 && (
                        <div className="price-in-words text-primary small mt-2 fw-bold italic d-flex align-items-center gap-1">
                            <FaLanguage size={16} />
                            {toVietnameseWords(amount)}
                        </div>
                    )}
                </Form.Group>

                <Form.Group className="mb-1">
                    <Form.Label className="fw-bold text-muted small text-uppercase">Lý do điều chỉnh</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={2} 
                        placeholder="Nhập lý do điều chỉnh..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="shadow-sm"
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className="bg-light border-0 px-4 py-3">
                <Button variant="secondary" onClick={onClose} disabled={loading} className="rounded-pill px-4 fw-bold">
                    Hủy bỏ
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleConfirm} 
                    disabled={loading || !amount}
                    className="rounded-pill px-5 btn-primary-custom"
                >
                    {loading ? "Đang xử lý..." : isAdding ? "Xác nhận nạp tiền" : "Xác nhận khấu trừ"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
