import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Payment.css";
import { paymentService } from "../../Services/paymentService";
import { teacherPackageService } from "../../Services/teacherPackageService";
import { courseService } from "../../Services/courseService";
import { FaCheckCircle, FaLock } from "react-icons/fa";
import MainHeader from "../../Components/Header/MainHeader";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";

export default function Payment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const packageId = searchParams.get("packageId"); // teacherPackageId từ Home
    const packageType = searchParams.get("package"); // fallback: packageType string
    const courseId = searchParams.get("courseId"); // courseId for course payment
    const typeproduct = searchParams.get("typeproduct"); // 1 for Course, 2 for TeacherPackage

    const [checkoutUrl, setCheckoutUrl] = useState("");
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorType, setErrorType] = useState("error");

    useEffect(() => {
        let isCancelled = false; // Flag to prevent state updates after unmount
        
        const processPayment = async () => {
            try {
                if (isCancelled) return; // Don't proceed if component unmounted
                
                setLoading(true);
                setError("");

                let productId = null;
                let productType = null;

                // Check if this is a course payment
                if (courseId && typeproduct === "1") {
                    const courseResponse = await courseService.getCourseById(courseId);
                    if (isCancelled) return; // Check after async operation
                    
                    if (courseResponse.data?.success && courseResponse.data?.data) {
                        setSelectedCourse(courseResponse.data.data);
                        productId = parseInt(courseId);
                        productType = 1; // ProductType.Course = 1
                    } else {
                        setError("Không tìm thấy khóa học");
                        setLoading(false);
                        return;
                    }
                }
                // Check if this is a teacher package payment
                else if (packageId || packageType) {
                    let selectedPackage = null;

                    // Nếu có packageId, sử dụng trực tiếp
                    if (packageId) {
                        const packagesResponse = await teacherPackageService.getAll();
                        if (isCancelled) return; // Check after async operation
                        
                        const packages = packagesResponse.data?.data || [];
                        selectedPackage = packages.find(
                            (pkg) => pkg.teacherPackageId === parseInt(packageId)
                        );
                    } 
                    // Nếu không có packageId, tìm theo packageType (backward compatibility)
                    else if (packageType) {
                        const packagesResponse = await teacherPackageService.getAll();
                        if (isCancelled) return; // Check after async operation
                        
                        const packages = packagesResponse.data?.data || [];
                        selectedPackage = packages.find(
                            (pkg) => pkg.packageName?.toLowerCase().includes(packageType?.toLowerCase() || "")
                        );
                    }

                    if (!selectedPackage) {
                        setError("Không tìm thấy gói đăng ký");
                        setLoading(false);
                        return;
                    }

                    setSelectedPackage(selectedPackage);
                    productId = selectedPackage.teacherPackageId;
                    productType = 2; // ProductType.TeacherPackage = 2
                } else {
                    setError("Không tìm thấy sản phẩm cần thanh toán");
                    setLoading(false);
                    return;
                }

                // Create payment record
                // Generate unique IdempotencyKey to prevent duplicate payments
                const idempotencyKey = `${Date.now()}-${productId}-${productType}`;
                
                console.log("Creating payment with:", { 
                    ProductId: productId, 
                    typeproduct: productType,
                    IdempotencyKey: idempotencyKey
                });
                
                const paymentResponse = await paymentService.processPayment({
                    ProductId: productId,
                    typeproduct: productType,
                    IdempotencyKey: idempotencyKey
                });
                
                if (isCancelled) return; // Check after async operation
                console.log("Payment response:", paymentResponse.data);

                if (!paymentResponse.data?.success || !paymentResponse.data?.data?.paymentId) {
                    throw new Error(paymentResponse.data?.message || "Không thể tạo thanh toán");
                }

                const createdPaymentId = paymentResponse.data.data.paymentId;

                // Create PayOS link to get QR code and checkout URL
                console.log("Creating PayOS link for payment:", createdPaymentId);
                const payOsResponse = await paymentService.createPayOsLink(createdPaymentId);
                
                if (isCancelled) return; // Check after async operation
                console.log("PayOS response:", payOsResponse.data);

                if (!payOsResponse.data?.success || !payOsResponse.data?.data) {
                    throw new Error(payOsResponse.data?.message || "Không thể tạo link thanh toán");
                }

                const checkoutLink = payOsResponse.data.data.checkoutUrl;

                setCheckoutUrl(checkoutLink);
                setIsRedirecting(true);
                
                // Tự động chuyển hướng (Seamless UX) sau 1.2s để user nhận thức độ bảo mật
                setTimeout(() => {
                    window.location.href = checkoutLink;
                }, 1200);

                // Lưu ý: KHÔNG tắt loading ở đây để giữ lại loading screen sang xịn 
                // cho đến khi trình duyệt nảy sang PayOS.
            } catch (error) {
                console.error("Error processing payment:", error);
                console.error("Error details:", {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                
                let errorMessage = "Có lỗi xảy ra khi xử lý thanh toán";
                let errorType = "error";
                
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                    
                    // Kiểm tra các trường hợp đặc biệt
                    const messageLower = errorMessage.toLowerCase();
                    if (messageLower.includes("đã là giáo viên") || 
                        messageLower.includes("đã là teacher") ||
                        messageLower.includes("đang hoạt động")) {
                        errorType = "info";
                    } else if (messageLower.includes("đã mua") || 
                               messageLower.includes("đã đăng ký")) {
                        errorType = "info";
                    }
                } else if (error.response?.data?.errors) {
                    // Handle validation errors
                    const errors = error.response.data.errors;
                    errorMessage = Object.values(errors).flat().join(", ");
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                setError(errorMessage);
                setLoading(false);
                setIsRedirecting(false);
                
                // Hiển thị thông báo bằng NotificationModal
                setErrorMessage(errorMessage);
                setErrorType(errorType);
                setShowErrorModal(true);
            }
        };

        if (courseId || packageId || packageType) {
            processPayment();
        } else {
            setError("Không tìm thấy sản phẩm cần thanh toán");
            setLoading(false);
        }
        
        // Cleanup function to prevent state updates after unmount
        return () => {
            isCancelled = true;
        };
    }, [courseId, packageId, packageType, typeproduct]);

    const handleBack = () => {
        navigate("/home");
    };

    const handleOpenCheckout = () => {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    };

    return (
        <>
            <MainHeader />
            <div className="payment-container">
                {/* header intentionally left minimal for checkout */}

                <div className="payment-card">
                    {loading ? (
                        <div className="payment-loading">
                            {isRedirecting ? (
                                <>
                                    <FaCheckCircle className="secure-lock-icon redirecting" style={{color: '#3b82f6'}} />
                                    <h2 className="loading-text-primary">Đã tạo kết nối!</h2>
                                    <p className="loading-text-secondary">
                                        Chuẩn bị chuyển hướng đến PayOS...
                                    </p>
                                </>
                            ) : (
                                <>
                                    <FaLock className="secure-lock-icon" />
                                    <h2 className="loading-text-primary">Thiết lập thanh toán bảo mật...</h2>
                                    <p className="loading-text-secondary">
                                        Hệ thống đang mã hóa dữ liệu và chuẩn bị cổng thanh toán an toàn cho bạn. Vui lòng chờ trong giây lát.
                                    </p>
                                    <div className="mt-4 payment-mini-spinner">
                                        <div className="spinner"></div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : error ? (
                        <>
                            <h1 className="payment-title">Có lỗi xảy ra</h1>
                            <div className="payment-error">{error}</div>
                            <button className="btn-back" onClick={handleBack}>
                                Quay lại trang chủ
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="payment-title">Thanh toán</h1>
                            
                            {selectedCourse && (
                                <div className="package-info">
                                    <h3>{selectedCourse.title}</h3>
                                    <p className="package-price">
                                        {selectedCourse.price > 0 
                                            ? `${selectedCourse.price.toLocaleString("vi-VN")}đ`
                                            : "Miễn phí"}
                                    </p>
                                </div>
                            )}
                            
                            {selectedPackage && (
                                <div className="package-info">
                                    <h3>{selectedPackage.packageName}</h3>
                                    <p className="package-price">
                                        {selectedPackage.price > 0 
                                            ? `${selectedPackage.price.toLocaleString("vi-VN")}đ/tháng`
                                            : "Miễn phí"}
                                    </p>
                                </div>
                            )}

                            <div className="payment-methods">
                                <div className="payment-method web-method">
                                    <h2 className="method-title">
                                        <FaCheckCircle /> Thanh toán trực tuyến
                                    </h2>
                                    <p className="method-description">
                                        Thanh toán nhanh chóng qua cổng thanh toán PayOS
                                    </p>
                                    <button className="btn-checkout" onClick={handleOpenCheckout}>
                                        Mở trang thanh toán
                                    </button>
                                </div>
                            </div>

                            <div className="payment-note">
                                <p>
                                    💡 <strong>Lưu ý:</strong> Sau khi thanh toán thành công, 
                                    bạn sẽ được chuyển hướng tự động. Vui lòng không đóng trang này.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <NotificationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                type={errorType}
                message={errorMessage}
                autoClose={true}
                autoCloseDelay={4000}
            />
        </>
    );
}

