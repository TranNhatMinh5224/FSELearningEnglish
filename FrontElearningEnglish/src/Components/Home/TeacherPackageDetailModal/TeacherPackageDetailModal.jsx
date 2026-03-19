import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { teacherPackageService } from "../../../Services/teacherPackageService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import NotificationModal from "../../Common/NotificationModal/NotificationModal";
import "./TeacherPackageDetailModal.css";

export default function TeacherPackageDetailModal({ 
    show, 
    onHide, 
    teacherPackageId 
}) {
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const fetchPackageDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await teacherPackageService.getById(teacherPackageId);
            
            if (response.data?.success && response.data?.data) {
                setPackageData(response.data.data);
            } else {
                setError("Không thể tải thông tin gói");
            }
        } catch (err) {
            console.error("Error fetching package details:", err);
            setError("Không thể tải thông tin gói");
        } finally {
            setLoading(false);
        }
    }, [teacherPackageId]);

    useEffect(() => {
        if (show && teacherPackageId) {
            fetchPackageDetails();
        } else {
            // Reset khi đóng modal
            setPackageData(null);
            setError("");
        }
    }, [show, teacherPackageId, fetchPackageDetails]);

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            // Đóng modal trước khi navigate
            onHide();
            navigate("/login");
            return;
        }

        // Kiểm tra nếu user đã là giáo viên
        const teacherSubscription = user?.teacherSubscription || user?.TeacherSubscription;
        const isTeacher = teacherSubscription?.isTeacher || teacherSubscription?.IsTeacher;

        if (isTeacher === true) {
            // Đóng modal detail trước, sau đó hiển thị thông báo
            onHide();
            // Delay để modal detail đóng animation xong (Bootstrap modal fade out ~150ms)
            setTimeout(() => {
                setNotification({
                    isOpen: true,
                    type: "info",
                    message: "Gói giáo viên hiện tại của bạn đang hoạt động, vui lòng chờ đến khi hết hạn để kích hoạt gói giáo viên mới!"
                });
            }, 200);
            return;
        }

        // Navigate đến trang thanh toán - đóng modal trước
        const packageType = packageData?.packageName?.toLowerCase() || "";
        onHide();
        // Delay để modal đóng animation xong trước khi navigate
        setTimeout(() => {
            navigate(`/payment?packageId=${teacherPackageId}&package=${packageType}`);
        }, 150);
    };

    const getLevelName = (level) => {
        const levelMap = {
            1: "Basic",
            2: "Standard",
            3: "Premium",
            4: "Professional"
        };
        return levelMap[level] || `Level ${level}`;
    };

    const formatPrice = (price) => {
        if (!price || price === 0) {
            return "Miễn phí";
        }
        return `${price.toLocaleString("vi-VN")} VND`;
    };

    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                centered
                size="lg"
                className="teacher-package-detail-modal"
                backdrop={true}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết gói giáo viên</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Đang tải thông tin...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5">
                            <p className="text-danger">{error}</p>
                            <Button variant="outline-primary" onClick={fetchPackageDetails}>
                                Thử lại
                            </Button>
                        </div>
                    ) : packageData ? (
                        <div className="package-detail-content">
                            <div className="package-header">
                                <h2 className="package-name">{packageData.packageName || packageData.PackageName}</h2>
                                <span className="package-level">
                                    {getLevelName(packageData.level || packageData.Level)}
                                </span>
                            </div>

                            <div className="package-price-section">
                                <div className="price-label">Giá gói</div>
                                <div className="price-value">
                                    {formatPrice(packageData.price || packageData.Price)}
                                </div>
                            </div>

                            <div className="package-features">
                                <h4 className="features-title">Quyền lợi gói</h4>
                                <div className="features-list">
                                    <div className="feature-item">
                                        <span className="feature-icon">📚</span>
                                        <div className="feature-content">
                                            <strong>Tối đa khóa học:</strong>
                                            <span>{packageData.maxCourses || packageData.MaxCourses || 0} khóa học</span>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📖</span>
                                        <div className="feature-content">
                                            <strong>Tối đa bài học:</strong>
                                            <span>{packageData.maxLessons || packageData.MaxLessons || 0} bài học</span>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">👥</span>
                                        <div className="feature-content">
                                            <strong>Tối đa học viên:</strong>
                                            <span>{packageData.maxStudents || packageData.MaxStudents || 0} học viên</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="package-description">
                                <p>
                                    Gói {packageData.packageName || packageData.PackageName} cung cấp đầy đủ công cụ 
                                    và quyền hạn để bạn quản lý và giảng dạy hiệu quả trên nền tảng Catalunya English.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </Modal.Body>
                {packageData && !loading && !error && (
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide}>
                            Đóng
                        </Button>
                        <Button variant="primary" onClick={handleBuyNow} className="buy-now-btn">
                            Mua ngay
                        </Button>
                    </Modal.Footer>
                )}
            </Modal>

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification({ isOpen: false, type: "info", message: "" })}
                type={notification.type}
                message={notification.message}
                autoClose={true}
                autoCloseDelay={4000}
            />
        </>
    );
}
