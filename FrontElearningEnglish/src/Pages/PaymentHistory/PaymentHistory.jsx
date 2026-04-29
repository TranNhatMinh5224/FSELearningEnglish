import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import CustomPagination from "../../Components/Common/Pagination/CustomPagination";
import "./PaymentHistory.css";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import { paymentService } from "../../Services/paymentService";
import PaymentHistoryItem from "../../Components/PaymentHistory/PaymentHistoryItem/PaymentHistoryItem";
import PaymentDetailModal from "../../Components/PaymentHistory/PaymentDetailModal/PaymentDetailModal";
import { FaWallet, FaHistory, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function PaymentHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const fetchTransactionHistory = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await paymentService.getHistory(currentPage, pageSize);
                // Handle both camelCase and PascalCase responses
                const isSuccess = response.data?.Success !== false && response.data?.success !== false;
                const data = response.data?.data ?? response.data?.Data;
                
                if (isSuccess && data) {
                    // Handle paginated response
                    if (data.items || data.Items) {
                        const items = data.items || data.Items || [];
                        const total = data.totalCount || data.TotalCount || 0;
                        const pages = data.totalPages || data.TotalPages || 1;
                        
                        setTransactions(items);
                        setTotalCount(total);
                        setTotalPages(pages);
                    } else {
                        // Fallback: assume it's a direct array (backward compatibility)
                        const transactionsData = Array.isArray(data) ? data : [];
                        setTransactions(transactionsData);
                        setTotalCount(transactionsData.length);
                        setTotalPages(1);
                    }
                } else {
                    setError(
                        response.data?.Message || response.data?.message || "Không thể tải lịch sử thanh toán"
                    );
                }
            } catch (err) {
                console.error("Error fetching transaction history:", err);
                setError("Không thể tải dữ liệu lịch sử thanh toán");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactionHistory();
    }, [currentPage, pageSize]);

    const handleItemClick = async (paymentId) => {
        try {
            setLoadingDetail(true);
            const response = await paymentService.getTransactionDetail(paymentId);
            if (response.data?.success && response.data?.data) {
                setSelectedTransaction(response.data.data);
                setShowDetailModal(true);
            } else {
                setError(response.data?.message || "Không thể tải chi tiết giao dịch");
            }
        } catch (err) {
            console.error("Error fetching transaction detail:", err);
            setError("Không thể tải chi tiết giao dịch");
        } finally {
            setLoadingDetail(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 1: // Pending
                return { text: "Đang chờ", variant: "warning", customClass: "status-pending" };
            case 2: // Completed
                return { text: "Hoàn thành", variant: "info", customClass: "status-completed" };
            case 3: // Failed
                return { text: "Thất bại", variant: "danger", customClass: "status-failed" };
            case 4: // Expired
                return { text: "Hết hạn", variant: "secondary", customClass: "status-expired" };
            default:
                return { text: "Không xác định", variant: "secondary", customClass: "status-unknown" };
        }
    };

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="payment-history-container">
                    <Container>
                        <div className="loading-wrapper">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h3 className="mt-4 fw-bold text-secondary">Đang tải lịch sử giao dịch...</h3>
                        </div>
                    </Container>
                </div>
            </>
        );
    }

    if (error && transactions.length === 0) {
        return (
            <>
                <MainHeader />
                <div className="payment-history-container">
                    <Container>
                        <Breadcrumb items={[{ label: "Lịch sử thanh toán", isCurrent: true }]} />
                        <div className="error-state text-center mt-5">
                            <div className="error-icon mb-3">⚠️</div>
                            <h4 className="text-danger fw-bold">{error}</h4>
                            <p className="text-secondary">Vui lòng thử lại sau hoặc liên hệ hỗ trợ.</p>
                            <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
                                Tải lại trang
                            </button>
                        </div>
                    </Container>
                </div>
            </>
        );
    }

    return (
        <>
            <MainHeader />
            <div className="payment-history-container">
                <Container>
                    <Breadcrumb 
                        items={[
                            { label: "Lịch sử thanh toán", isCurrent: true }
                        ]}
                    />
                    
                    <div className="payment-history-header mt-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <h1 className="payment-history-title">Lịch sử thanh toán</h1>
                                <p className="payment-history-subtitle">
                                    <FaHistory className="me-2" />
                                    Xem lại tất cả các giao dịch nạp tiền và mua khóa học của bạn
                                </p>
                            </div>
                            <div className="stats-highlight">
                                <div className="stat-card">
                                    <span className="stat-label">Tổng số giao dịch</span>
                                    <span className="stat-value">{totalCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💸</div>
                            <p className="empty-title">Bạn chưa có giao dịch nào</p>
                            <p className="empty-subtitle">Các giao dịch thanh toán của bạn sẽ hiển thị tại đây.</p>
                            <p className="empty-state-hint">
                                Hãy bắt đầu khám phá các khóa học thú vị nhé!
                            </p>
                        </div>
                    ) : (
                        <div className="payment-list-container">
                            <Row className="payment-list-header g-0">
                                <Col xs={12} md={5} lg={4} className="header-column product-column d-flex align-items-center">
                                    <span>Sản phẩm</span>
                                </Col>
                                <Col xs={4} md={2} lg={2} className="header-column amount-column d-none d-md-flex align-items-center justify-content-start">
                                    <span>Số tiền</span>
                                </Col>
                                <Col xs={4} md={2} lg={2} className="header-column status-column d-flex align-items-center justify-content-center">
                                    <span>Trạng thái</span>
                                </Col>
                                <Col xs={4} md={3} lg={4} className="header-column date-column d-none d-md-flex align-items-center justify-content-end">
                                    <span>Ngày thanh toán</span>
                                </Col>
                            </Row>

                            <div className="payment-list">
                                {transactions.map((transaction) => {
                                    const statusBadge = getStatusBadge(transaction.status || transaction.Status);
                                    return (
                                        <PaymentHistoryItem
                                            key={transaction.paymentId || transaction.PaymentId}
                                            transaction={transaction}
                                            statusBadge={statusBadge}
                                            formatDate={formatDate}
                                            onClick={() => handleItemClick(transaction.paymentId || transaction.PaymentId)}
                                        />
                                    );
                                })}
                            </div>

                            <div className="pagination-wrapper">
                                <CustomPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={totalCount}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    showInfo={false}
                                />
                            </div>
                        </div>
                    )}
                </Container>
            </div>

            <PaymentDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
                loading={loadingDetail}
            />
        </>
    );
}

