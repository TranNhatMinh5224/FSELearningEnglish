import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginRequiredModal.css";
import { FaLock, FaSignInAlt, FaTimes } from "react-icons/fa";
import { ROUTE_PATHS } from "../../../Routes/Paths";

export default function LoginRequiredModal({ isOpen, onClose }) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        onClose();
        navigate(ROUTE_PATHS.LOGIN);
    };

    return (
        <div className="login-required-modal-overlay" onClick={onClose}>
            <div className="login-required-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="login-required-modal-header">
                    <div className="login-required-icon-wrapper">
                        <FaLock className="login-required-icon" />
                    </div>
                    <h2 className="login-required-modal-title">Yêu cầu đăng nhập</h2>
                    <p className="login-required-message">
                        Vui lòng đăng nhập để truy cập tính năng này và khám phá thêm nhiều nội dung học tập thú vị!
                    </p>
                </div>

                <div className="login-required-modal-footer">
                    <button
                        type="button"
                        className="modal-btn modal-btn-cancel"
                        onClick={onClose}
                    >
                        <FaTimes className="btn-icon" />
                        <span>Hủy</span>
                    </button>
                    <button
                        type="button"
                        className="modal-btn login-required-btn"
                        onClick={handleLogin}
                    >
                        <FaSignInAlt className="btn-icon" />
                        <span>Đăng nhập ngay</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

