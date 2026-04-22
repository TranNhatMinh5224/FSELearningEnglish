import React from "react";
import { Dropdown } from "react-bootstrap";
import { FaWallet, FaPlusCircle, FaHistory } from "react-icons/fa";
import { useAuth } from "../../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import "./WalletDropdown.css";

export default function WalletDropdown() {
    const { user, isAuthenticated, isGuest } = useAuth();
    const navigate = useNavigate();

    if (isGuest || !isAuthenticated) {
        return null;
    }

    // Format tiền VND
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    return (
        <Dropdown
            className="wallet-wrapper"
            align="end"
        >
            <Dropdown.Toggle
                as="div"
                className="wallet-badge d-flex align-items-center"
                id="wallet-dropdown"
            >
                <FaWallet className="wallet-icon" />
                <span className="wallet-balance-short">{formatCurrency(user?.balance)}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="wallet-dropdown-menu">
                <div className="wallet-header">
                    <div className="wallet-title">Số dư tài khoản</div>
                    <div className="wallet-balance-large">{formatCurrency(user?.balance)}</div>
                </div>

                <Dropdown.Divider />

                <Dropdown.Item onClick={() => navigate(ROUTE_PATHS.TOPUP || "/topup")} className="wallet-action-item">
                    <FaPlusCircle className="action-icon topup-icon" />
                    <span>Nạp thêm tiền</span>
                </Dropdown.Item>

                <Dropdown.Item onClick={() => navigate(ROUTE_PATHS.PAYMENT_HISTORY)} className="wallet-action-item">
                    <FaHistory className="action-icon history-icon" />
                    <span>Lịch sử giao dịch</span>
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}
