import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import adminPaymentService from "../../../Services/adminPaymentService";
import { toast } from "react-toastify";
import { FaSync, FaExclamationTriangle, FaCheckCircle, FaClock, FaBug, FaFileInvoiceDollar, FaFilter, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PaymentMonitoring.css";

const PaymentMonitoring = () => {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") || "";
    const [activeTab, setActiveTab] = useState("transactions");
    
    // ... rest of state ...
    const [failedWebhooks, setFailedWebhooks] = useState([]);
    const [webhooksLoading, setWebhooksLoading] = useState(true);
    const [retryingId, setRetryingId] = useState(null);

    // State for Transactions
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [gatewayFilter, setGatewayFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const fetchFailedWebhooks = async () => {
        try {
            setWebhooksLoading(true);
            const response = await adminPaymentService.getFailedWebhooks();
            if (response.data.success) {
                setFailedWebhooks(response.data.data);
            }
        } catch (error) {
            toast.error("Không thể lấy danh sách webhook lỗi");
        } finally {
            setWebhooksLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setTransactionsLoading(true);
            const response = await adminPaymentService.getTransactions({
                PageNumber: page,
                PageSize: pageSize,
                Status: statusFilter || undefined,
                Gateway: gatewayFilter || undefined,
                SearchTerm: searchTerm || undefined
            });
            if (response.data.success) {
                setTransactions(response.data.data.items);
                setTotalTransactions(response.data.data.totalCount);
            }
        } catch (error) {
            toast.error("Không thể lấy danh sách giao dịch");
        } finally {
            setTransactionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "webhooks") {
            fetchFailedWebhooks();
        } else {
            const timer = setTimeout(() => {
                fetchTransactions();
            }, searchTerm ? 500 : 0);
            return () => clearTimeout(timer);
        }
    }, [activeTab, page, statusFilter, gatewayFilter, searchTerm]);

    const handleRetry = async (webhookId) => {
        try {
            setRetryingId(webhookId);
            const response = await adminPaymentService.retryWebhook(webhookId);
            if (response.data.success) {
                toast.success("Đã kích hoạt thử lại cho webhook này");
                setFailedWebhooks(failedWebhooks.filter(w => w.webhookId !== webhookId));
            }
        } catch (error) {
            toast.error("Lỗi khi kích hoạt lại webhook");
        } finally {
            setRetryingId(null);
        }
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleString("vi-VN") : "---";
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 0: return "badge-pending";    // Pending
            case 1: return "badge-completed";  // Completed
            case 2: return "badge-failed";     // Failed
            case 3: return "badge-cancelled";  // Cancelled
            default: return "badge-secondary";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 0: return "Đang chờ";
            case 1: return "Thành công";
            case 2: return "Thất bại";
            case 3: return "Đã hủy";
            default: return "Không xác định";
        }
    };

    const getGatewayText = (gateway) => {
        switch (gateway) {
            case 1: return "PayOS";
            case 2: return "Ví nội bộ";
            default: return "Khác";
        }
    };

    const renderWebhooksTab = () => (
        <div className="tab-content">
            <div className="monitoring-overview">
                <div className="stat-card warning">
                    <FaExclamationTriangle className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-value">{failedWebhooks.length}</span>
                        <span className="stat-label">Webhook thất bại cần xử lý</span>
                    </div>
                </div>
                <p className="overview-note">
                    Các Webhook từ PayOS đã vượt quá số lần thử lại tối đa (5 lần) và đang nằm trong hệ thống xử lý lỗi.
                </p>
            </div>

            {webhooksLoading ? (
                <div className="monitoring-loading">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : failedWebhooks.length === 0 ? (
                <div className="empty-state">
                    <FaCheckCircle className="empty-icon" />
                    <h3>Tuyệt vời! Không có webhook nào bị lỗi.</h3>
                </div>
            ) : (
                <div className="table-responsive">
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
                                    <td>{formatDate(webhook.createdAt)}</td>
                                    <td className="text-center">{webhook.retryCount}/{webhook.maxRetries}</td>
                                    <td className="error-cell">
                                        <div className="error-text" title={webhook.lastError}>
                                            {webhook.lastError || "N/A"}
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-retry-action"
                                            onClick={() => handleRetry(webhook.webhookId)}
                                            disabled={retryingId === webhook.webhookId}
                                        >
                                            {retryingId === webhook.webhookId ? "Đang gửi..." : "Thử lại"}
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

    const renderTransactionsTab = () => (
        <div className="tab-content">
            <div className="filter-bar mb-4 p-3 bg-light rounded shadow-sm d-flex flex-wrap gap-3 align-items-center">
                <div className="search-box position-relative flex-grow-1" style={{ maxWidth: '600px', minWidth: '300px' }}>
                    <FaSearch className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }} />
                    <input 
                        type="text" 
                        className="form-control ps-5" 
                        placeholder="Tìm email, tên hoặc mã GD..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        title={searchTerm}
                    />
                </div>
                <div className="filter-item d-flex align-items-center gap-2">
                    <FaFilter className="text-muted" />
                    <select className="form-select status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="0">Đang chờ</option>
                        <option value="1">Thành công</option>
                        <option value="2">Thất bại</option>
                        <option value="3">Đã hủy</option>
                    </select>
                </div>
                <div className="filter-item">
                    <select className="form-select gateway-select" value={gatewayFilter} onChange={(e) => setGatewayFilter(e.target.value)}>
                        <option value="">Tất cả cổng</option>
                        <option value="1">PayOS</option>
                        <option value="2">Ví nội bộ</option>
                    </select>
                </div>
                <div className="filter-stats ms-auto text-muted">
                    Tổng cộng: <strong>{totalTransactions}</strong>
                </div>
            </div>

            {transactionsLoading ? (
                <div className="monitoring-loading">
                    <div className="spinner"></div>
                    <p>Đang tải lịch sử...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="empty-state">
                    <FaCheckCircle className="empty-icon text-muted" />
                    <h3>Chưa có dữ liệu giao dịch nào.</h3>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="transaction-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Khách hàng</th>
                                    <th>Sản phẩm</th>
                                    <th>Số tiền</th>
                                    <th>Cổng</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.paymentId}>
                                        <td>{formatDate(tx.createdAt)}</td>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-name bold">{tx.userDisplayName || "Khách"}</div>
                                                <div className="user-email text-muted small">{tx.userEmail}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-info-cell">
                                                <span className="product-name">{tx.productName}</span>
                                            </div>
                                        </td>
                                        <td className="bold text-nowrap">
                                            {tx.amount.toLocaleString("vi-VN")} VNĐ
                                        </td>
                                        <td>
                                            <div className="tx-ref-info">
                                                <div className="ref-id text-muted small">ID: {tx.providerTransactionId || "N/A"}</div>
                                                <div className="gateway-badge small">
                                                    {getGatewayText(tx.gateway || (tx.paymentMethod === "InternalWallet" ? 2 : 1))}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(tx.status)}`}>
                                                {getStatusText(tx.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container d-flex justify-content-between align-items-center mt-4">
                        <span className="page-info text-muted">
                            Trang {page} / {Math.ceil(totalTransactions / pageSize) || 1}
                        </span>
                        <div className="page-actions d-flex gap-2">
                            <button 
                                className="btn-pagination" 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                <FaChevronLeft /> Trước
                            </button>
                            <button 
                                className="btn-pagination"
                                disabled={page >= Math.ceil(totalTransactions / pageSize)}
                                onClick={() => setPage(page + 1)}
                            >
                                Tiếp <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="monitoring-container">
            <div className="monitoring-header">
                <div className="header-title">
                    <FaFileInvoiceDollar className="title-icon" />
                    <h1>Quản lý Tài chính & Giao dịch</h1>
                </div>
                <button className="btn-refresh" onClick={() => activeTab === "webhooks" ? fetchFailedWebhooks() : fetchTransactions()} disabled={webhooksLoading || transactionsLoading}>
                    <FaSync className={webhooksLoading || transactionsLoading ? "spin" : ""} /> Làm mới
                </button>
            </div>

            <div className="monitoring-tabs">
                <button 
                    className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
                    onClick={() => { setActiveTab("transactions"); setPage(1); }}
                >
                    <FaFileInvoiceDollar className="me-2" /> Lịch sử giao dịch
                </button>
                <button 
                    className={`tab-btn ${activeTab === "webhooks" ? "active" : ""}`}
                    onClick={() => setActiveTab("webhooks")}
                >
                    <FaBug className="me-2" /> Webhook lỗi
                    {failedWebhooks.length > 0 && <span className="tab-badge">{failedWebhooks.length}</span>}
                </button>
            </div>

            {activeTab === "webhooks" ? renderWebhooksTab() : renderTransactionsTab()}
        </div>
    );
};

export default PaymentMonitoring;
