import React, { useState, useEffect } from "react";
import adminPaymentService from "../../../Services/adminPaymentService";
import { toast } from "react-toastify";
import { FaSync, FaExclamationTriangle, FaCheckCircle, FaClock, FaBug } from "react-icons/fa";
import "./PaymentMonitoring.css";

const PaymentMonitoring = () => {
    const [failedWebhooks, setFailedWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retryingId, setRetryingId] = useState(null);

    const fetchFailedWebhooks = async () => {
        try {
            setLoading(true);
            const response = await adminPaymentService.getFailedWebhooks();
            if (response.data.success) {
                setFailedWebhooks(response.data.data);
            }
        } catch (error) {
            toast.error("Không thể lấy danh sách webhook lỗi");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFailedWebhooks();
    }, []);

    const handleRetry = async (webhookId) => {
        try {
            setRetryingId(webhookId);
            const response = await adminPaymentService.retryWebhook(webhookId);
            if (response.data.success) {
                toast.success("Đã kích hoạt thử lại cho webhook này");
                // Remove from list or refresh
                setFailedWebhooks(failedWebhooks.filter(w => w.webhookId !== webhookId));
            }
        } catch (error) {
            toast.error("Lỗi khi kích hoạt lại webhook");
        } finally {
            setRetryingId(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("vi-VN");
    };

    return (
        <div className="monitoring-container">
            <div className="monitoring-header">
                <div className="header-title">
                    <FaBug className="title-icon" />
                    <h1>Giám sát thanh toán (Dead Letter Webhooks)</h1>
                </div>
                <button className="btn-refresh" onClick={fetchFailedWebhooks} disabled={loading}>
                    <FaSync className={loading ? "spin" : ""} /> Làm mới
                </button>
            </div>

            <div className="monitoring-overview">
                <div className="stat-card warning">
                    <FaExclamationTriangle className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-value">{failedWebhooks.length}</span>
                        <span className="stat-label">Webhook thất bại cần xử lý</span>
                    </div>
                </div>
                <p className="overview-note">
                    Danh sách dưới đây là các Webhook từ PayOS đã vượt quá số lần thử lại tối đa (5 lần) và đang nằm trong hàng đợi "Dead Letter".
                </p>
            </div>

            {loading ? (
                <div className="monitoring-loading">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : failedWebhooks.length === 0 ? (
                <div className="empty-state">
                    <FaCheckCircle className="empty-icon" />
                    <h3>Tuyệt vời! Không có webhook nào bị lỗi.</h3>
                    <p>Hệ thống hiện đang hoạt động ổn định.</p>
                </div>
            ) : (
                <div className="webhook-table-container">
                    <table className="webhook-table">
                        <thead>
                            <tr>
                                <th>Order Code</th>
                                <th>Thời gian tạo</th>
                                <th>Số lần thử</th>
                                <th>Lỗi cuối cùng</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {failedWebhooks.map((webhook) => (
                                <tr key={webhook.webhookId}>
                                    <td className="bold">{webhook.orderCode}</td>
                                    <td>
                                        <div className="date-cell">
                                            <FaClock className="small-icon" />
                                            {formatDate(webhook.createdAt)}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="retry-badge">{webhook.retryCount}/{webhook.maxRetries}</span>
                                    </td>
                                    <td className="error-cell">
                                        <div className="error-text" title={webhook.lastError}>
                                            {webhook.lastError || "Không có thông tin lỗi"}
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-retry-action"
                                            onClick={() => handleRetry(webhook.webhookId)}
                                            disabled={retryingId === webhook.webhookId}
                                        >
                                            {retryingId === webhook.webhookId ? "Đang xử lý..." : "Thử lại"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentMonitoring;
