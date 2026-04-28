import React, { useState } from "react";
import { Modal, Button, Form, InputGroup, Alert } from "react-bootstrap";
import { FaWallet, FaPlus, FaMinus, FaLanguage, FaHistory } from "react-icons/fa";
import { toVietnameseWords } from "../../../../Utils/currencyUtils";
import PremiumCloseButton from "../../../Common/PremiumCloseButton/PremiumCloseButton";

export default function AdjustBalanceModal({ show, onClose, user, onConfirm }) {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isAdding, setIsAdding] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!amount) return;
        
        // Loại bỏ tất cả ký tự không phải là số (như dấu chấm, dấu phẩy phân cách)
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
        <Modal show={show} onHide={onClose} centered size="lg" className="modal-modern">
            <Modal.Header closeButton={false}>
                <Modal.Title className="fw-bold modal-title-centered">Điều chỉnh số dư</Modal.Title>
                <PremiumCloseButton onClick={onClose} />
            </Modal.Header>
            <Modal.Body>
                {user && (
                    <div className="mb-4 p-3 bg-light rounded">
                        <div className="d-flex align-items-center mb-2">
                            <span className="fw-bold me-2">Người dùng:</span>
                            <span>{user.displayName || user.DisplayName || user.email || user.Email}</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="fw-bold me-2">Số dư hiện tại:</span>
                            <span className="text-primary fw-bold">
                                {(user.balance || user.Balance || 0).toLocaleString("vi-VN")} VNĐ
                            </span>
                        </div>
                    </div>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Loại điều chỉnh</Form.Label>
                    <div className="d-flex gap-2">
                        <Button 
                            variant={isAdding ? "success" : "outline-success"} 
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setIsAdding(true)}
                        >
                            <FaPlus /> Nạp tiền
                        </Button>
                        <Button 
                            variant={!isAdding ? "danger" : "outline-danger"} 
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setIsAdding(false)}
                        >
                            <FaMinus /> Khấu trừ
                        </Button>
                    </div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Số tiền (VNĐ)</Form.Label>
                    <InputGroup>
                        <InputGroup.Text><FaWallet /></InputGroup.Text>
                        <Form.Control 
                            type="number" 
                            placeholder="Nhập số tiền..." 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <InputGroup.Text>VNĐ</InputGroup.Text>
                    </InputGroup>
                    {amount > 0 && (
                        <div className="price-in-words text-primary small mt-1 fw-bold italic">
                            <FaLanguage size={14} className="me-1" />
                            {toVietnameseWords(amount)}
                        </div>
                    )}
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Lý do</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={2} 
                        placeholder="Nhập lý do điều chỉnh..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    Hủy
                </Button>
                <Button 
                    variant={isAdding ? "success" : "danger"} 
                    onClick={handleConfirm}
                    disabled={loading || !amount}
                >
                    {loading ? "Đang xử lý..." : "Xác nhận"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
