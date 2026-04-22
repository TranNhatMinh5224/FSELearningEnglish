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
import { FaWallet } from "react-icons/fa";

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
    const { user, refreshUser } = useAuth();
    const [selectedGateway, setSelectedGateway] = useState(0); // 0: PayOS, 1: InternalWallet

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

    const handleWalletPayment = async (productId, productType) => {
        try {
            setLoading(true);
            const idempotencyKey = `wallet-${user.userId}-${Date.now()}`;

            const response = await paymentService.processPayment({
                ProductId: productId,
                typeproduct: productType,
                IdempotencyKey: idempotencyKey,
                Gateway: 2 // InternalWallet
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

                let productId = null;
                let productType = null;

                // CASE 1: Payment already created (e.g. from TopUp)
                if (paymentIdFromUrl) {
                    setLoading(false);
                    const payOsResponse = await paymentService.createPayOsLink(paymentIdFromUrl);
                    if (isCancelled) return;

                    if (!payOsResponse.data?.success || !payOsResponse.data?.data) {
                        throw new Error(payOsResponse.data?.message || "Không thể lấy thông tin thanh toán");
                    }

                    setPayOsDetails(payOsResponse.data.data);
                    return;
                }

                // CASE 2: New payment creation
                if (courseId && typeproduct === "1") {
                    const courseResponse = await courseService.getCourseById(courseId);
                    if (isCancelled) return;
                    if (courseResponse.data?.success && courseResponse.data?.data) {
                        setSelectedCourse(courseResponse.data.data);
                        productId = parseInt(courseId);
                        productType = 1;
                    }
                } else if (packageId || packageType) {
                    // (Giữ nguyên logic lấy package như cũ...)
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
                        productType = 2;
                    }
                }

                if (!productId) {
                    setError("Không tìm thấy sản phẩm cần thanh toán");
                    setLoading(false);
                    return;
                }

                // Create payment record (PayOS default)
                const idempotencyKey = `${Date.now()}-${productId}-${productType}`;
                const paymentResponse = await paymentService.processPayment({
                    ProductId: productId,
                    typeproduct: productType,
                    IdempotencyKey: idempotencyKey,
                    Gateway: 0 // PayOS
                });

                if (isCancelled) return;

                if (!paymentResponse.data?.success || !paymentResponse.data?.data?.paymentId) {
                    throw new Error(paymentResponse.data?.message || "Không thể tạo thanh toán");
                }

                const createdPaymentId = paymentResponse.data.data.paymentId;

                if (paymentResponse.data?.data?.amount === 0) {
                    setIsRedirecting(true);
                    setTimeout(() => {
                        navigate(`/payment-success?paymentId=${createdPaymentId}&status=success&type=free`);
                    }, 1000);
                    return;
                }

                const payOsResponse = await paymentService.createPayOsLink(createdPaymentId);
                if (isCancelled) return;
                if (!payOsResponse.data?.success || !payOsResponse.data?.data) {
                    throw new Error(payOsResponse.data?.message || "Không thể tạo link thanh toán");
                }

                setPayOsDetails(payOsResponse.data.data);
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

        if (courseId || packageId || packageType) {
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

    const handleOpenCheckout = () => {
        const checkoutUrl = getPayOsValue("checkoutUrl", "CheckoutUrl");
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    };

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
                                        disabled={isCheckingStatus}
                                    >
                                        {isCheckingStatus ? "Đang kiểm tra..." : "Tôi đã chuyển khoản"}
                                    </button>
                                    <button className="btn-cancel" onClick={() => navigate("/home")}>
                                        Hủy giao dịch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="payment-card">
                        <div className="package-info">
                            <h3>{selectedCourse?.title || selectedPackage?.packageName || "Sản phẩm"}</h3>
                            <p className="package-price">
                                {selectedCourse
                                    ? (selectedCourse.price || 0).toLocaleString("vi-VN")
                                    : (selectedPackage?.price || 0).toLocaleString("vi-VN")
                                } VNĐ
                            </p>
                        </div>

                        <div className="payment-methods">
                            {/* Option 1: PayOS */}
                            <div className={`payment-method ${selectedGateway === 0 ? "active" : ""}`} onClick={() => setSelectedGateway(0)}>
                                <div className="method-title">
                                    <FaLock /> Thanh toán an toàn qua PayOS
                                </div>
                                <p className="method-description">
                                    Hỗ trợ VietQR và chuyển khoản ngân hàng 24/7.
                                </p>
                                {selectedGateway === 0 && (
                                    <button className="btn-checkout mt-2" onClick={handleOpenCheckout}>
                                        Tiến hành thanh toán PayOS
                                    </button>
                                )}
                            </div>

                            {/* Option 2: Internal Wallet (Only if not topup) */}
                            {typeproduct !== "3" && (
                                <div className={`payment-method ${selectedGateway === 1 ? "active" : ""}`} onClick={() => setSelectedGateway(1)}>
                                    <div className="method-title">
                                        <FaWallet /> Thanh toán bằng Ví (Coin)
                                    </div>
                                    <p className="method-description">
                                        Số dư hiện tại: <strong className={user?.balance >= (selectedCourse?.price || selectedPackage?.price) ? "text-success" : "text-danger"}>
                                            {(user?.balance || 0).toLocaleString("vi-VN")} VNĐ
                                        </strong>
                                    </p>
                                    {selectedGateway === 1 && (
                                        <button
                                            className="btn-checkout wallet-btn mt-2"
                                            onClick={() => handleWalletPayment(selectedCourse?.courseId || selectedPackage?.teacherPackageId, parseInt(typeproduct))}
                                            disabled={loading || (user?.balance < (selectedCourse?.price || selectedPackage?.price))}
                                        >
                                            {user?.balance >= (selectedCourse?.price || selectedPackage?.price)
                                                ? "Xác nhận thanh toán bằng ví"
                                                : "Số dư không đủ"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="payment-note">
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Giao dịch sẽ được xử lý tự động ngay khi tiền vào tài khoản.</li>
                                <li>Vui lòng không tắt trình duyệt trong quá trình thanh toán.</li>
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

