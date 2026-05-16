import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaUsers, FaExpand } from "react-icons/fa";
import { PiGraduationCapDuotone, PiBookOpenDuotone, PiCurrencyCircleDollarDuotone } from "react-icons/pi";
import { Container, Row, Col } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CourseDetailSkeleton from "../../../Components/Common/Skeleton/CourseDetailSkeleton";
import "./TeacherCourseDetail.css";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { useAuth } from "../../../Context/AuthContext";
import { teacherService } from "../../../Services/teacherService";
import { teacherPackageService } from "../../../Services/teacherPackageService";
import { useAssets } from "../../../Context/AssetContext";
import CreateCourseModal from "../../../Components/Teacher/CreateCourseModal/CreateCourseModal";
import CreateLessonModal from "../../../Components/Teacher/CreateLessonModal/CreateLessonModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import LessonLimitModal from "../../../Components/Common/LessonLimitModal/LessonLimitModal";
import ClassCodeModal from "../../../Components/Teacher/ClassCodeModal/ClassCodeModal";
import ImageWithIconFallback from "../../../Components/Common/ImageWithIconFallback/ImageWithIconFallback";
import AdminLessonCard from "../../../Components/Admin/CourseManagement/AdminLessonCard/AdminLessonCard";
import CourseDescription from "../../../Components/Courses/CourseDescription/CourseDescription";
import { ROUTE_PATHS } from "../../../Routes/Paths";

export default function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [lessonToUpdate, setLessonToUpdate] = useState(null);
  const [showLessonSuccessModal, setShowLessonSuccessModal] = useState(false);
  const [showLessonLimitModal, setShowLessonLimitModal] = useState(false);
  const [maxLessonsLimit, setMaxLessonsLimit] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showClassCodeModal, setShowClassCodeModal] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  const isTeacher = (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return roleName === "Teacher";
  })) || user?.teacherSubscription?.isTeacher === true;
  const { getDefaultCourseImage, getDefaultLessonImage } = useAssets();

  const fetchCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch both course detail and lessons
      const [courseRes, lessonsRes] = await Promise.all([
        teacherService.getCourseDetail(courseId),
        teacherService.getLessonsByCourse(courseId)
      ]);

      if (courseRes.data?.success && courseRes.data?.data) {
        setCourse(courseRes.data.data);
      } else {
        setError("Không thể tải thông tin khóa học");
      }

      if (lessonsRes.data?.success && lessonsRes.data?.data) {
        setLessons(Array.isArray(lessonsRes.data.data) ? lessonsRes.data.data : []);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error("Error fetching course detail:", err);
      setError("Không thể tải thông tin khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchLessons = useCallback(async () => {
    try {
      const response = await teacherService.getLessonsByCourse(courseId);
      if (response.data?.success && response.data?.data) {
        const lessonsData = response.data.data;
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setLessons([]);
    }
  }, [courseId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) {
      navigate("/home");
      return;
    }

    fetchCourseDetail();
    fetchLessons();
  }, [isAuthenticated, isTeacher, navigate, fetchCourseDetail, fetchLessons]);

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setShowSuccessModal(true);
    fetchCourseDetail(); // Refresh course data
  };

  const handleCreateLesson = async () => {
    // Check lesson limit before opening modal
    try {
      // Get package info
      const packageResponse = await teacherPackageService.getAll();
      const userPackageLevel = user?.teacherSubscription?.packageLevel;

      if (packageResponse.data?.success && packageResponse.data?.data && userPackageLevel) {
        const packages = packageResponse.data.data;
        const levelMap = {
          "Basic": 0,
          "Standard": 1,
          "Premium": 2,
          "Professional": 3
        };
        const expectedLevel = levelMap[userPackageLevel];

        const matchedPackage = packages.find(
          (pkg) => {
            const pkgLevel = pkg.level !== undefined ? pkg.level : (pkg.Level !== undefined ? pkg.Level : null);
            return (
              pkgLevel === expectedLevel ||
              pkgLevel?.toString() === userPackageLevel ||
              (typeof pkgLevel === "string" && pkgLevel === userPackageLevel)
            );
          }
        );

        if (matchedPackage) {
          const maxLessons = matchedPackage.maxLessons || 0;

          // Get current lesson count in this course
          const currentLessonCount = lessons.length || 0;

          if (currentLessonCount >= maxLessons) {
            // Show limit modal
            setMaxLessonsLimit(maxLessons);
            setShowLessonLimitModal(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error checking lesson limit:", error);
    }

    setShowCreateLessonModal(true);
  };

  const handleCreateLessonSuccess = () => {
    setShowCreateLessonModal(false);
    setLessonToUpdate(null);
    setShowLessonSuccessModal(true);
    fetchLessons(); // Refresh lessons list
    fetchCourseDetail(); // Refresh course data to update totalLessons
  };

  const handleUpdateLesson = (lesson, e) => {
    e.stopPropagation();
    setLessonToUpdate(lesson);
    setShowCreateLessonModal(true);
  };

  const handleDeleteClick = (lesson, e) => {
    e.stopPropagation();
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;

    try {
      setDeletingLesson(true);
      const lessonId = lessonToDelete.lessonId || lessonToDelete.LessonId;
      const response = await teacherService.deleteLesson(lessonId);

      if (response.status === 204 || response.data?.success) {
        setShowDeleteModal(false);
        setShowDeleteSuccessModal(true);
        setLessonToDelete(null);
        fetchLessons();
        fetchCourseDetail();
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa bài học";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeletingLesson(false);
    }
  };

  if (!isAuthenticated || !isTeacher) {
    return null;
  }

  if (loading) {
    return (
      <>
        <TeacherHeader />
        <CourseDetailSkeleton />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <TeacherHeader />
        <div className="teacher-course-detail-container">
          <div className="error-message">{error || "Không tìm thấy khóa học"}</div>
        </div>
      </>
    );
  }

  const courseTitle = course.title || course.Title || "Khóa học";
  const courseDescription = course.description || course.Description || "";
  const classCode = course.classCode || course.ClassCode || "";
  const totalLessons = course.totalLessons || course.TotalLessons || 0;
  const totalStudents = course.totalStudents || course.TotalStudents || 0;
  const price = course.price || course.Price || 0;

  return (
    <>
      <TeacherHeader />
      <div className="teacher-course-detail-container">
        <Container fluid className="p-0 content-wrapper">
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: "Quản lý khóa học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                { label: courseTitle, isCurrent: true }
              ]}
              showHomeIcon={true}
              className="breadcrumb-compact"
            />
          </div>
          <Row>
            {/* Left Column - Course Info */}
            <Col md={4} className="course-info-column">
              <div className="course-info-card">
                <div className="course-image-wrapper">
                  <ImageWithIconFallback
                    imageUrl={course.imageUrl || course.ImageUrl}
                    fallbackImageUrl={getDefaultCourseImage()}
                    icon={<PiGraduationCapDuotone size={64} />}
                    alt={courseTitle}
                    className="course-image"
                  />
                </div>
                <div className="course-info-content">
                  <h2 className="course-title">{courseTitle}</h2>
                  <div className="course-info-subsection">
                    <CourseDescription description={courseDescription} />
                  </div>

                  <div className="course-details">
                    <div className="course-detail-item code-item">
                      <label>Mã khóa học:</label>
                      <div className="course-code-display-group">
                        <div className="code-value">{classCode}</div>
                        <div className="code-actions">
                          <button
                            className="code-action-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(classCode);
                              setNotification({ isOpen: true, type: "success", message: "Đã sao chép mã khóa học!" });
                            }}
                            title="Sao chép"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="code-action-btn expand"
                            onClick={() => setShowClassCodeModal(true)}
                            title="Mở rộng"
                          >
                            <FaExpand size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="course-detail-item">
                      <label>
                        <PiCurrencyCircleDollarDuotone className="detail-icon" />
                        Giá:
                      </label>
                      <span className={`course-stat-value ${price > 0 ? 'paid' : 'free'}`}>
                        {price > 0 ? `${price.toLocaleString()} đ` : "Miễn phí"}
                      </span>
                    </div>

                    <div className="course-detail-item">
                      <label>
                        <PiBookOpenDuotone className="detail-icon" />
                        Chương học:
                      </label>
                      <span className="stat-number-pill">{totalLessons}</span>
                    </div>

                    <div className="course-detail-item">
                      <label>
                        <FaUsers className="detail-icon" />
                        Tổng số học sinh:
                      </label>
                      <span className="stat-number-pill">{totalStudents}</span>
                    </div>
                  </div>

                  <button
                    className="update-course-btn"
                    onClick={() => setShowUpdateModal(true)}
                  >
                    <FaEdit className="btn-icon" />
                    Cập nhật khóa học
                  </button>

                  <button
                    className="manage-students-btn"
                    onClick={() => navigate(`/teacher/course/${courseId}/students`)}
                  >
                    <FaUsers className="btn-icon" />
                    Quản lý học viên
                  </button>
                </div>
              </div>
            </Col>

            {/* Right Column - Lessons List */}
            <Col md={8} className="lessons-column">
              <div className="lessons-section">
                <div className="lessons-header">
                  <h3>Danh sách chương học</h3>
                </div>

                {lessons.length > 0 ? (
                  <div className="admin-lessons-list">
                    {lessons.map((lesson, index) => (
                      <AdminLessonCard
                        key={lesson.lessonId || lesson.LessonId || index}
                        lesson={lesson}
                        onClick={() => navigate(`/teacher/course/${courseId}/lesson/${lesson.lessonId || lesson.LessonId}`)}
                        onUpdate={(e) => handleUpdateLesson(lesson, e)}
                        onDelete={(e) => handleDeleteClick(lesson, e)}
                        getDefaultLessonImage={getDefaultLessonImage}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-lessons-message">
                    <div className="empty-icon-wrapper">
                      <PiBookOpenDuotone />
                    </div>
                    <h4>Chưa có chương học nào</h4>
                    <p>Bắt đầu xây dựng lộ trình học tập bằng cách thêm chương học đầu tiên của bạn.</p>
                  </div>
                )}

                <button
                  className="add-lesson-btn"
                  onClick={() => {
                    setLessonToUpdate(null);
                    handleCreateLesson();
                  }}
                >
                  <FaPlus className="add-icon" />
                  Thêm chương học
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Update Course Modal */}
      <CreateCourseModal
        show={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={handleUpdateSuccess}
        courseData={{
          ...course,
          courseId: course.courseId || course.CourseId || parseInt(courseId)
        }}
        isUpdateMode={true}
      />

      {/* Success Modal for Course Update */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Cập nhật khóa học thành công"
        message="Khóa học của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        message={notification.message}
      />

      {/* Create/Update Lesson Modal */}
      <CreateLessonModal
        show={showCreateLessonModal}
        onClose={() => {
          setShowCreateLessonModal(false);
          setLessonToUpdate(null);
        }}
        onSuccess={handleCreateLessonSuccess}
        courseId={courseId}
        lessonData={lessonToUpdate}
        isUpdateMode={!!lessonToUpdate}
      />

      {/* Success Modal for Lesson Creation */}
      <SuccessModal
        isOpen={showLessonSuccessModal}
        onClose={() => setShowLessonSuccessModal(false)}
        title="Thêm chương học thành công"
        message="Chương học của bạn đã được thêm thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Lesson Limit Modal */}
      <LessonLimitModal
        isOpen={showLessonLimitModal}
        onClose={() => setShowLessonLimitModal(false)}
        maxLessons={maxLessonsLimit}
        onUpgrade={() => {
          setShowLessonLimitModal(false);
          navigate("/home");
        }}
      />

      {/* Confirm Delete Lesson Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLessonToDelete(null);
        }}
        onConfirm={confirmDeleteLesson}
        title="Xác nhận xóa chương học"
        message="Bạn có chắc chắn muốn xóa chương học này không?"
        itemName={lessonToDelete ? (lessonToDelete.title || lessonToDelete.Title) : ""}
        type="delete"
        confirmText="Xác nhận xóa"
        loading={deletingLesson}
      />

      {/* Success Modal for Delete Lesson */}
      <SuccessModal
        isOpen={showDeleteSuccessModal}
        onClose={() => setShowDeleteSuccessModal(false)}
        title="Xóa chương học thành công"
        message="Chương học đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />
      {/* Class Code Modal */}

      {/* Class Code Modal */}
      <ClassCodeModal
        isOpen={showClassCodeModal}
        onClose={() => setShowClassCodeModal(false)}
        classCode={classCode}
        courseTitle={courseTitle}
      />
    </>
  );
}

