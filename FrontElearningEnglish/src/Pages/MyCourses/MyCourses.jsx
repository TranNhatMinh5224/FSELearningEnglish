import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import CustomPagination from "../../Components/Common/Pagination/CustomPagination";
import "./MyCourses.css";
import "../../Components/Home/WelcomeSection/WelcomeSection.css"; // Import WelcomeSection CSS
import MainHeader from "../../Components/Header/MainHeader";
import JoinClassModal from "../../Components/Common/JoinClassModal/JoinClassModal";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";
import SuggestedCourseCard from "../../Components/Home/SuggestedCourseCard/SuggestedCourseCard";
import AccountUpgradeSection from "../../Components/Home/AccountUpgradeSection/AccountUpgradeSection";
import EnrollmentSuccessModal from "../../Components/Common/EnrollmentSuccessModal/EnrollmentSuccessModal";
import { FaPlus } from "react-icons/fa";
import { enrollmentService } from "../../Services/enrollmentService";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../Context/AuthContext";
import { useAssets } from "../../Context/AssetContext";
import LoginRequiredModal from "../../Components/Common/LoginRequiredModal/LoginRequiredModal";
import SEO from "../../Components/SEO/SEO";

export default function MyCourses() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();
    const { getDefaultCourseImage } = useAssets();
    const [selectedPackage, setSelectedPackage] = useState(null);
    
    // Enrolled courses state với pagination
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20); // Hiển thị 20 courses mỗi trang (4 columns x 5 rows)
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger để refresh danh sách
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Notification states
    const [showEnrollmentSuccessModal, setShowEnrollmentSuccessModal] = useState(false);
    const [enrolledCourseInfo, setEnrolledCourseInfo] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch enrolled courses với pagination
    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                setLoading(true);
                setError("");

                // Lấy danh sách khóa học đã đăng ký với phân trang
                const registeredRes = await enrollmentService.getMyCourses(currentPage, pageSize);
                
                // Handle both camelCase and PascalCase responses
                const isSuccess = registeredRes.data?.Success !== false && registeredRes.data?.success !== false;
                const data = registeredRes.data?.data ?? registeredRes.data?.Data;
                
                if (isSuccess && data) {
                    // Handle paginated response
                    if (data.items || data.Items) {
                        const items = data.items || data.Items || [];
                        const total = data.totalCount || data.TotalCount || 0;
                        const pages = data.totalPages || data.TotalPages || 1;
                        
                        const mappedCourses = items.map((course) => ({
                            id: course.courseId || course.CourseId,
                            courseId: course.courseId || course.CourseId,
                            title: course.title || course.Title,
                            imageUrl: (course.imageUrl || course.ImageUrl) && (course.imageUrl || course.ImageUrl).trim() !== ""
                                ? (course.imageUrl || course.ImageUrl)
                                : getDefaultCourseImage(),
                            price: course.price || course.Price || 0,
                        }));
                        
                        setEnrolledCourses(mappedCourses);
                        setTotalCount(total);
                        setTotalPages(pages);
                    } else {
                        // Fallback: assume it's a direct array (backward compatibility)
                        const registeredData = Array.isArray(data) ? data : [];
                        const mappedCourses = registeredData.map((course) => ({
                            id: course.courseId || course.CourseId,
                            courseId: course.courseId || course.CourseId,
                            title: course.title || course.Title,
                            imageUrl: (course.imageUrl || course.ImageUrl) && (course.imageUrl || course.ImageUrl).trim() !== ""
                                ? (course.imageUrl || course.ImageUrl)
                                : getDefaultCourseImage(),
                            price: course.price || course.Price || 0,
                        }));
                        
                        setEnrolledCourses(mappedCourses);
                        setTotalCount(mappedCourses.length);
                        setTotalPages(1);
                    }
                } else {
                    setError(
                        registeredRes.data?.Message || registeredRes.data?.message || "Không thể tải danh sách khóa học"
                    );
                }
            } catch (err) {
                console.error("Error fetching enrolled courses:", err);
                setError("Không thể tải danh sách khóa học");
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchEnrolledCourses();
        } else {
            setEnrolledCourses([]);
            setLoading(false);
        }
    }, [currentPage, pageSize, isAuthenticated, refreshTrigger, getDefaultCourseImage]); // Thêm refreshTrigger vào dependencies

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJoinClass = async (classCode) => {
        try {
            const response = await enrollmentService.joinByClassCode({ classCode });

            if (response.data?.success) {
                // Join thành công
                setIsModalOpen(false);
                
                // Refresh courses list ngay lập tức
                setRefreshTrigger(prev => prev + 1);

                // Also refresh cached home course list (React Query)
                queryClient.invalidateQueries({ queryKey: ["system-courses"] });
                
                // Reset về page 1 để thấy khóa học mới
                if (currentPage !== 1) {
                    setCurrentPage(1);
                }

                // Hiển thị EnrollmentSuccessModal với thông tin khóa học từ Backend
                if (response.data?.data) {
                    setEnrolledCourseInfo({
                        courseId: response.data.data.courseId || response.data.data.CourseId,
                        title: response.data.data.title || response.data.data.Title,
                        imageUrl: response.data.data.imageUrl || response.data.data.ImageUrl
                    });
                    
                    setTimeout(() => {
                        setShowEnrollmentSuccessModal(true);
                    }, 300);
                }
            } else {
                // Join thất bại - kiểm tra xem có phải "đã đăng ký rồi" không
                const errorMessage = response.data?.message || "";
                const isAlreadyEnrolled = errorMessage.includes("đã đăng ký") || errorMessage.includes("đã tham gia");

                if (isAlreadyEnrolled) {
                    // Nếu đã đăng ký rồi, chỉ thông báo
                    setIsModalOpen(false);
                    setInfoMessage("Bạn đã tham gia khóa học này rồi! Kiểm tra trong danh sách bên dưới.");
                    setShowInfoModal(true);
                } else {
                    // Các lỗi khác - đóng modal nhập mã trước
                    setIsModalOpen(false);
                    setErrorMessage(errorMessage || "Không thể tham gia lớp học. Vui lòng kiểm tra lại mã lớp.");
                    setShowErrorModal(true);
                }
            }
        } catch (error) {
            console.error("Error joining class:", error);
            const errorMessage = error.response?.data?.message || "Không thể tham gia lớp học. Vui lòng kiểm tra lại mã lớp.";

            // Kiểm tra xem có phải "đã đăng ký rồi" không
            const isAlreadyEnrolled = errorMessage.includes("đã đăng ký") || errorMessage.includes("đã tham gia");

            if (isAlreadyEnrolled) {
                setIsModalOpen(false);
                setInfoMessage("Bạn đã tham gia khóa học này rồi! Kiểm tra trong danh sách bên dưới.");
                setShowInfoModal(true);
            } else {
                // Đóng modal nhập mã trước khi hiển thị lỗi
                setIsModalOpen(false);
                setErrorMessage(errorMessage);
                setShowErrorModal(true);
            }
        }
    };


    // Account upgrade handlers
    const handlePackageHover = (teacherPackageId) => {
        setSelectedPackage(teacherPackageId);
    };

    const handlePackageLeave = () => {
        setSelectedPackage(null);
    };

    const handleUpgradeClick = (e, teacherPackageId, packageType) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        // Kiểm tra nếu user đã là giáo viên
        const teacherSubscription = user?.teacherSubscription || user?.TeacherSubscription;
        const isTeacher = teacherSubscription?.isTeacher || teacherSubscription?.IsTeacher;
        
        if (isTeacher === true) {
            setInfoMessage("Gói giáo viên hiện tại của bạn đang hoạt động, vui lòng chờ đến khi hết hạn để kích hoạt gói giáo viên mới!");
            setShowInfoModal(true);
            return;
        }

        navigate(`/payment?packageId=${teacherPackageId}&package=${packageType}`);
    };

    const displayName = user?.fullName || "bạn";

    return (
        <>
            <SEO 
                title="Khóa học của tôi - Catalunya English"
                description="Quản lý và tiếp tục hành trình học tập các khóa học tiếng Anh của bạn tại Catalunya English."
                keywords="khóa học của tôi, học tiếng anh online, lộ trình học tập, Catalunya English"
            />
            <MainHeader />
            <div className="my-courses-container">
                <Container>

                    {/* SEO Helper: Hidden H1 for Search Engines */}
                    <h1 className="visually-hidden">Khóa học của tôi - Kho tàng tri thức của {displayName}</h1>

                    {/* Welcome Section giống trang chủ */}
                    <Row className="welcome-section g-3 g-md-4 align-items-center mb-4">
                        <Col xs={12} lg={7} className="welcome-section__left d-flex flex-column justify-content-center align-items-start">
                            <h2 className="welcome-title">Chào mừng trở lại, {displayName}</h2>
                            <p>Hãy tiếp tục hành trình học tiếng Anh nào.</p>
                        </Col>
                        <Col xs={12} lg={5} className="welcome-section__right d-flex align-items-center justify-content-end">
                            <button
                                className="join-class-btn d-flex align-items-center"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <FaPlus />
                                Nhập mã lớp học
                            </button>
                        </Col>
                    </Row>

                    {/* Main Content: 2 columns layout - Bootstrap Grid */}
                    <Row className="g-4 mt-3">
                        {/* Left: Enrolled Courses Section */}
                        <Col xs={12} lg={8} className="suggested-courses-section">
                            {loading ? (
                                <div className="loading-message">Đang tải khóa học...</div>
                            ) : error ? (
                                <div className="error-message">{error}</div>
                            ) : enrolledCourses.length > 0 ? (
                                <>
                                    <h2>Khóa học của tôi</h2>
                                    <Row className="g-3 g-md-4">
                                        {enrolledCourses.map((course, index) => (
                                            <Col key={course.id || index} xs={12} sm={6} lg={4} xl={3}>
                                                <SuggestedCourseCard
                                                    course={course}
                                                    isEnrolled={true} // Tất cả đều đã đăng ký
                                                    showEnrolledBadge={true} // Hiển thị badge "Đã tham gia"
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                    
                                    {/* Pagination */}
                                    <CustomPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalCount={totalCount}
                                        pageSize={pageSize}
                                        onPageChange={handlePageChange}
                                    />
                                </>
                            ) : (
                                <div className="no-courses-message">Chưa có khóa học đã đăng ký</div>
                            )}
                        </Col>

                        {/* Right: Account Upgrade Section */}
                        <Col xs={12} lg={4}>
                            <AccountUpgradeSection
                                selectedPackage={selectedPackage}
                                onPackageHover={handlePackageHover}
                                onPackageLeave={handlePackageLeave}
                                onUpgradeClick={handleUpgradeClick}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modals */}
            <JoinClassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJoin={handleJoinClass}
            />

            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />

            {/* Success Modal mới - đẹp hơn */}
            <EnrollmentSuccessModal
                isOpen={showEnrollmentSuccessModal}
                onClose={() => setShowEnrollmentSuccessModal(false)}
                onGoToCourse={() => {
                    setShowEnrollmentSuccessModal(false);
                    if (enrolledCourseInfo?.courseId) {
                        navigate(`/course/${enrolledCourseInfo.courseId}/learn`);
                    }
                }}
                course={enrolledCourseInfo}
            />

            <NotificationModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                type="info"
                message={infoMessage}
                autoClose={true}
                autoCloseDelay={3000}
            />

            <NotificationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                type="error"
                message={errorMessage}
                autoClose={true}
                autoCloseDelay={3000}
            />
        </>
    );
}

