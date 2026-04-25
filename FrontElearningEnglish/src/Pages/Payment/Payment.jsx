import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Payment.css";
import { paymentService } from "../../Services/paymentService";
import { teacherPackageService } from "../../Services/teacherPackageService";
import { courseService } from "../../Services/courseService";
import { FaCheckCircle, FaLock, FaCopy, FaInfoCircle } from "react-icons/fa";
import MainHeader from "../../Components/Header/MainHeader";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";
import { useAuth } from "../../Context/AuthContext";
import { FaWallet, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { PRODUCT_TYPE, PAYMENT_GATEWAY } from "../../config/enums";
import { ROUTE_PATHS } from "../../Routes/Paths";

export default function Payment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const packageId = searchParams.get("packageId"); // teacherPackageId từ Home
    const packageType = searchParams.get("package"); // fallback: packageType string
    const courseId = searchParams.get("courseId"); // courseId for course payment
    const typeproduct = searchParams.get("typeproduct"); // 1 for Course, 2 for TeacherPackage
    const paymentIdFromUrl = searchParams.get("paymentId"); // paymentId if already created

    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorType, setErrorType] = useState("error");
    const [payOsDetails, setPayOsDetails] = useState(null);
    const [pollingStartTime] = useState(Date.now());
    const [pollingActive, setPollingActive] = useState(true);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const { user, refreshUser } = useAuth();
    const [selectedGateway, setSelectedGateway] = useState(PAYMENT_GATEWAY.INTERNAL_WALLET); 
    const [neededAmount, setNeededAmount] = useState(0);

    const getPayOsValue = useCallback((camelKey, pascalKey) => {
        if (!payOsDetails) return "";
        return payOsDetails[camelKey] ?? payOsDetails[pascalKey] ?? "";
    }, [payOsDetails]);

    const resolveQrImageSrc = useCallback(() => {
        const qrCode = getPayOsValue("qrCode", "QrCode");
        if (!qrCode) return "";

        if (typeof qrCode === "string") {
            const trimmed = qrCode.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
                return trimmed;
            }

            // qrCode là chuỗi raw (EMV/text) -> render bằng dịch vụ QR
            return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(trimmed)}`;
        }

        return "";
    }, [getPayOsValue]);
    // Polling logic to check payment status
    useEffect(() => {
        let pollInterval;
        if (payOsDetails && !isRedirecting && pollingActive) {
            pollInterval = setInterval(async () => {
                // Check for timeout (15 minutes = 900,000 ms)
                if (Date.now() - pollingStartTime > 900000) {
                    setPollingActive(false);
                    clearInterval(pollInterval);
                    return;
                }

                try {
                    const currentPaymentId = getPayOsValue("paymentId", "PaymentId");
                    if (!currentPaymentId) return;

                    const statusRes = await paymentService.confirmPayOsPayment(currentPaymentId);
                    if (statusRes.data?.success) {
                        clearInterval(pollInterval);
                        setIsRedirecting(true);
                        setTimeout(() => {
                            navigate(`/payment-success?paymentId=${currentPaymentId}&status=success`);
                        }, 1000);
                    }
                } catch {
                }
            }, 4000); // Poll every 4 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [payOsDetails, isRedirecting, pollingActive, pollingStartTime, navigate, getPayOsValue]);

    const handleManualCheck = async () => {
        if (isCheckingStatus) return;

        try {
            setIsCheckingStatus(true);
            const currentPaymentId = getPayOsValue("paymentId", "PaymentId");
            if (!currentPaymentId) return;

            const statusRes = await paymentService.confirmPayOsPayment(currentPaymentId);
            if (statusRes.data?.success) {
                setIsRedirecting(true);
                setTimeout(() => {
                    navigate(`/payment-success?paymentId=${currentPaymentId}&status=success`);
                }, 1000);
            } else {
                setErrorMessage("Giao dịch chưa hoàn tất hoặc chưa được ghi nhận.");
                setErrorType("info");
                setShowErrorModal(true);
            }
        } catch (err) {
            setErrorMessage("Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau.");
            setErrorType("error");
            setShowErrorModal(true);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleCancel = async () => {
        if (isCancelling) return;

        const currentPaymentId = getPayOsValue("paymentId", "PaymentId");
        if (!currentPaymentId) {
            navigate("/home");
            return;
        }

        try {
            setIsCancelling(true);
            setPollingActive(false); // Stop polling immediately
            
            await paymentService.cancelPayment(currentPaymentId);
            
            setErrorMessage("Đã hủy giao dịch thành công.");
            setErrorType("info");
            setShowErrorModal(true);
            
            setTimeout(() => {
                navigate("/home");
            }, 1500);
        } catch (err) {
            console.error("Cancel error:", err);
            // Even if API fails, still navigate away to avoid sticky state for user
            navigate("/home");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleWalletPayment = async (productId, productType) => {
        try {
            setLoading(true);
            const idempotencyKey = `wallet-${user.userId}-${Date.now()}`;

            const response = await paymentService.processPayment({
                ProductId: productId,
                typeproduct: productType,
                IdempotencyKey: idempotencyKey,
                Gateway: PAYMENT_GATEWAY.INTERNAL_WALLET
            });

            if (response.data?.success && response.data?.data) {
                const pId = response.data.data.paymentId;
                setIsRedirecting(true);
                // Refresh user balance in background
                refreshUser();
                setTimeout(() => {
                    navigate(`/payment-success?paymentId=${pId}&status=success&method=wallet`);
                }, 1500);
            } else {
                throw new Error(response.data?.message || "Thanh toán bằng ví thất bại");
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || "Lỗi thanh toán ví");
            setErrorType("error");
            setShowErrorModal(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        let isCancelled = false; // Flag to prevent state updates after unmount

        const processPayment = async () => {
            try {
                if (isCancelled) return; // Don't proceed if component unmounted

                setLoading(true);
                setError("");

                const numeralTypeProduct = parseInt(typeproduct);
                let productId = null;
                let productType = null;

                // CASE 1: Payment already created (e.g. from TopUp)
                if (paymentIdFromUrl) {
                    const payOsResponse = await paymentService.createPayOsLink(paymentIdFromUrl);
                    if (isCancelled) return;

                    if (!payOsResponse.data?.success || !payOsResponse.data?.data) {
                        throw new Error(payOsResponse.data?.message || "Không thể lấy thông tin thanh toán");
                    }

                    setPayOsDetails(payOsResponse.data.data);
                    setSelectedGateway(PAYMENT_GATEWAY.PAYOS);
                    setLoading(false);
                    return;
                }

                // CASE 2: New payment creation (Course or TeacherPackage)
                if (courseId && numeralTypeProduct === PRODUCT_TYPE.COURSE) {
                    const courseResponse = await courseService.getCourseById(courseId);
                    if (isCancelled) return;
                    if (courseResponse.data?.success && courseResponse.data?.data) {
                        const courseData = courseResponse.data.data;
                        setSelectedCourse(courseData);
                        productId = parseInt(courseId);
                        productType = PRODUCT_TYPE.COURSE;
                        
                        // Check balance
                        if (user?.balance < courseData.price) {
                            setNeededAmount(courseData.price - (user?.balance || 0));
                        }
                        setSelectedGateway(PAYMENT_GATEWAY.INTERNAL_WALLET);
                    }
                } else if (packageId || packageType) {
                    let matchedPackage = null;
                    const packagesResponse = await teacherPackageService.getAll();
                    if (isCancelled) return;
                    const packages = packagesResponse.data?.data || [];
                    if (packageId) {
                        matchedPackage = packages.find(pkg => pkg.teacherPackageId === parseInt(packageId));
                    } else if (packageType) {
                        matchedPackage = packages.find(pkg => pkg.packageName?.toLowerCase().includes(packageType.toLowerCase()));
                    }

                    if (matchedPackage) {
                        setSelectedPackage(matchedPackage);
                        productId = matchedPackage.teacherPackageId;
                        productType = PRODUCT_TYPE.TEACHER_PACKAGE;

                        // Check balance
                        if (user?.balance < matchedPackage.price) {
                            setNeededAmount(matchedPackage.price - (user?.balance || 0));
                        }
                        setSelectedGateway(PAYMENT_GATEWAY.INTERNAL_WALLET);
                    }
                } else if (numeralTypeProduct === PRODUCT_TYPE.TOP_UP) {
                    // Logic handled if we had an amount in URL, but usually TopUp goes to TopUp.jsx first
                    // If arrived here with typeproduct=3, we expect paymentId or we need to redirect
                    navigate(ROUTE_PATHS.TOPUP);
                    return;
                }

                if (!productId) {
                    setError("Không tìm thấy sản phẩm cần thanh toán");
                    setLoading(false);
                    return;
                }

                // Auto-process for FREE products
                const currentPrice = selectedCourse?.price ?? selectedPackage?.price ?? 0;
                if (currentPrice === 0 && productId && productType) {
                    const idempotencyKey = `${Date.now()}-${productId}-${productType}-free`;
                    const paymentResponse = await paymentService.processPayment({
                        ProductId: productId,
                        typeproduct: productType,
                        IdempotencyKey: idempotencyKey,
                        Gateway: PAYMENT_GATEWAY.INTERNAL_WALLET
                    });

                    if (isCancelled) return;

                    if (paymentResponse.data?.success) {
                        const createdPaymentId = paymentResponse.data.data.paymentId;
                        setIsRedirecting(true);
                        setTimeout(() => {
                            navigate(`/payment-success?paymentId=${createdPaymentId}&status=success&type=free`);
                        }, 1000);
                        return;
                    }
                }

                setLoading(false);

            } catch (error) {
                let errorMessage = "Có lỗi xảy ra khi xử lý thanh toán";
                let errorType = "error";

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                setError(errorMessage);
                setLoading(false);
                setIsRedirecting(false);

                setErrorMessage(errorMessage);
                setErrorType(errorType);
                setShowErrorModal(true);
            }
        };

        if (courseId || packageId || packageType || paymentIdFromUrl) {
            processPayment();
        }

        return () => {
            isCancelled = true;
        };
    }, [courseId, packageId, packageType, typeproduct, navigate]);

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setErrorMessage(`Đã sao chép ${label}`);
        setErrorType("success");
        setShowErrorModal(true);
    };

    /*
    const handleOpenCheckout = () => {
        const checkoutUrl = getPayOsValue("checkoutUrl", "CheckoutUrl");
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    };
    */

    return (
        <>
            <MainHeader />
            <div className="payment-container">
                {loading ? (
                    <div className="payment-loading">
                        <div className="spinner"></div>
                        <h2 className="loading-text-primary">Đang khởi tạo thanh toán</h2>
                        <p className="loading-text-secondary">Vui lòng đợi trong giây lát khi chúng tôi thiết lập giao dịch an toàn cho bạn...</p>
                    </div>
                ) : error ? (
                    <div className="payment-card error">
                        <h2 className="payment-title">Có lỗi xảy ra</h2>
                        <p className="payment-error">{error}</p>
                        <button className="btn-back" onClick={() => navigate("/home")}>
                            Về trang chủ
                        </button>
                    </div>
                ) : isRedirecting ? (
                    <div className="payment-loading">
                        <div className="secure-lock-icon redirecting">
                            <FaCheckCircle />
                        </div>
                        <h2 className="loading-text-primary">Thanh toán thành công!</h2>
                        <p className="loading-text-secondary">Hệ thống đã ghi nhận thanh toán của bạn. Đang chuyển hướng...</p>
                        <div className="payment-mini-spinner">
                            <div className="spinner"></div>
                        </div>
                    </div>
                ) : payOsDetails ? (
                    <div className="qr-checkout-card">
                        <div className="qr-checkout-grid">
                            {/* Left Column: QR Code */}
                            <div className="qr-left">
                                <div className="qr-image-container">
                                    {resolveQrImageSrc() ? (
                                        <img
                                            src={resolveQrImageSrc()}
                                            alt="Payment QR code"
                                            className="qr-image"
                                        />
                                    ) : (
                                        <div className="text-muted small text-center p-3">
                                            Không lấy được QR từ cổng thanh toán. Vui lòng bấm "Tiến hành thanh toán" để mở trang PayOS.
                                        </div>
                                    )}
                                </div>
                                <div className="polling-status">
                                    {pollingActive ? (
                                        <>
                                            <div className="pulse-loader"></div>
                                            <span>Đang chờ bạn quét mã...</span>
                                        </>
                                    ) : (
                                        <span className="text-warning">Giao diện chờ đã hết hạn (15p). Vui lòng kiểm tra thủ công.</span>
                                    )}
                                </div>
                                <p className="qr-instruction">
                                    Sử dụng App Ngân hàng hoặc Ví điện tử để quét mã VietQR
                                </p>
                            </div>

                            {/* Right Column: Details */}
                            <div className="qr-right">
                                <h3 className="qr-title">Thông tin chuyển khoản</h3>

                                <div className="qr-details-group">
                                    <div className="qr-detail-item">
                                        <span className="label">SỐ TIỀN</span>
                                        <span className="value price">
                                            {(Number(getPayOsValue("amount", "Amount")) || 0).toLocaleString("vi-VN")} VNĐ
                                        </span>
                                    </div>

                                    <div className="qr-detail-item">
                                        <span className="label">NGÂN HÀNG</span>
                                        <span className="value bold">{getPayOsValue("bankName", "BankName") || "Ngân hàng liên kết"}</span>
                                    </div>

                                    <div className="qr-detail-item">
                                        <span className="label">SỐ TÀI KHOẢN</span>
                                        <div className="value-group">
                                            <span className="value highlight">{getPayOsValue("accountNumber", "AccountNumber") || "Đang cập nhật"}</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() => copyToClipboard(getPayOsValue("accountNumber", "AccountNumber"), "Số tài khoản")}
                                                title="Sao chép"
                                            >
                                                <FaCopy size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="qr-detail-item">
                                        <span className="label">CHỦ TÀI KHOẢN</span>
                                        <span className="value uppercase">{getPayOsValue("accountName", "AccountName") || "PayOS"}</span>
                                    </div>

                                    <div className="qr-detail-item content-item">
                                        <div className="content-box">
                                            <span className="label">NỘI DUNG CHUYỂN KHOẢN</span>
                                            <span className="content-value">{getPayOsValue("description", "Description") || ""}</span>
                                            <button
                                                className="copy-btn-large"
                                                onClick={() => copyToClipboard(getPayOsValue("description", "Description"), "Nội dung chuyển khoản")}
                                            >
                                                <FaCopy size={16} />
                                                Sao chép
                                            </button>
                                            <p className="content-warning">
                                                <FaInfoCircle size={14} />
                                                Vui lòng giữ nguyên nội dung chuyển khoản.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="qr-footer">
                                    <button
                                        className={`btn-check-status ${isCheckingStatus ? 'loading' : ''}`}
                                        onClick={handleManualCheck}
                                        disabled={isCheckingStatus || isCancelling}
                                    >
                                        {isCheckingStatus ? "Đang kiểm tra..." : "Tôi đã chuyển khoản"}
                                    </button>
                                    <button 
                                        className="btn-cancel" 
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                    >
                                        {isCancelling ? "Đang hủy..." : "Hủy giao dịch"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="payment-card">
                        <div className="package-info">
                            <h3 className="product-title">{selectedCourse?.title || selectedPackage?.packageName || "Sản phẩm"}</h3>
                            <p className="package-price">
                                {selectedCourse
                                    ? (selectedCourse.price || 0).toLocaleString("vi-VN")
                                    : (selectedPackage?.price || 0).toLocaleString("vi-VN")
                                } VNĐ
                            </p>
                        </div>

                        <div className="wallet-status-section">
                            <div className="wallet-info-box">
                                <div className="wallet-label">
                                    <FaWallet /> Số dư ví hiện tại:
                                </div>
                                <div className="wallet-balance">
                                    {(user?.balance || 0).toLocaleString("vi-VN")} VNĐ
                                </div>
                            </div>

                            {neededAmount > 0 ? (
                                <div className="insufficient-balance-alert">
                                    <div className="alert-content">
                                        <FaExclamationTriangle className="alert-icon" />
                                        <div className="alert-text">
                                            <strong>Số dư không đủ!</strong>
                                            <p>Bạn cần nạp thêm ít nhất <span>{neededAmount.toLocaleString("vi-VN")} VNĐ</span> để thực hiện giao dịch này.</p>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn-go-topup"
                                        onClick={() => navigate(ROUTE_PATHS.TOPUP)}
                                    >
                                        Nạp tiền ngay <FaArrowRight />
                                    </button>
                                </div>
                            ) : (
                                <div className="payment-methods">
                                    <div className="payment-method active">
                                        <div className="method-title">
                                            <FaCheckCircle className="text-success" /> Thanh toán bằng Ví (Coin)
                                        </div>
                                        <p className="method-description">
                                            Số tiền sẽ được trừ trực tiếp từ ví của bạn. Giao dịch an toàn và nhanh chóng.
                                        </p>
                                        <button
                                            className="btn-checkout wallet-btn mt-3"
                                            onClick={() => handleWalletPayment(selectedCourse?.courseId || selectedPackage?.teacherPackageId, parseInt(typeproduct))}
                                            disabled={loading}
                                        >
                                            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="payment-note">
                            <div className="note-header">
                                <FaInfoCircle /> Lưu ý:
                            </div>
                            <ul>
                                <li>Tất cả giao dịch mua khóa học và gói giáo viên đều thực hiện qua ví điện tử nội bộ.</li>
                                <li>Nếu số dư không đủ, vui lòng nạp tiền vào ví qua cổng PayOS.</li>
                                <li>Liên hệ hỗ trợ nếu bạn gặp bất kỳ vấn đề gì trong quá trình thanh toán.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <NotificationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                type={errorType}
                message={errorMessage}
                autoClose={true}
            />
        </>
    );
}

