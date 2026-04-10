import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaEdit, FaTrash, FaArrowLeft, FaPlus, FaRegListAlt } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { useAuth } from "../../../Context/AuthContext";
import { teacherService } from "../../../Services/teacherService";
import { assessmentService } from "../../../Services/assessmentService";
import { quizService } from "../../../Services/quizService";
import { essayService } from "../../../Services/essayService";
import CreateQuizModal from "../../../Components/Teacher/CreateQuizModal/CreateQuizModal";
import CreateEssayModal from "../../../Components/Teacher/CreateEssayModal/CreateEssayModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useQuizStatus } from "../../../hooks/useQuizStatus";
import "./TeacherQuizEssayManagement.css";

export default function TeacherQuizEssayManagement() {
  const { courseId, lessonId, moduleId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();
  const { getStatusLabel } = useQuizStatus();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showCreateQuizSuccessModal, setShowCreateQuizSuccessModal] = useState(false);
  const [showUpdateQuizModal, setShowUpdateQuizModal] = useState(false);
  const [showUpdateQuizSuccessModal, setShowUpdateQuizSuccessModal] = useState(false);
  const [quizToUpdate, setQuizToUpdate] = useState(null);
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [showDeleteQuizSuccessModal, setShowDeleteQuizSuccessModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Essay modals
  const [showCreateEssayModal, setShowCreateEssayModal] = useState(false);
  const [showCreateEssaySuccessModal, setShowCreateEssaySuccessModal] = useState(false);
  const [showUpdateEssayModal, setShowUpdateEssayModal] = useState(false);
  const [showUpdateEssaySuccessModal, setShowUpdateEssaySuccessModal] = useState(false);
  const [essayToUpdate, setEssayToUpdate] = useState(null);
  const [showDeleteEssayModal, setShowDeleteEssayModal] = useState(false);
  const [essayToDelete, setEssayToDelete] = useState(null);
  const [showDeleteEssaySuccessModal, setShowDeleteEssaySuccessModal] = useState(false);
  const [deletingEssay, setDeletingEssay] = useState(false);

  const isAdmin = roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin", "Admin"].includes(roleName);
  });

  const isTeacher = (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return roleName === "Teacher";
  })) || 
  user?.teacherSubscription?.isTeacher === true || 
  isAdmin;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch metadata in parallel
      const metadataPromises = [
        teacherService.getCourseDetail(courseId),
        teacherService.getLessonById(lessonId)
      ];

      // Try teacher assessment first, fallback to admin
      let assessmentData = null;
      try {
        const assessmentRes = await assessmentService.getTeacherAssessmentById(assessmentId);
        if (assessmentRes.data?.success) assessmentData = assessmentRes.data.data;
      } catch (e) { console.warn("Teacher assessment fetch failed, trying fallback"); }

      if (!assessmentData && isAdmin) {
        try {
          const adminAssessmentRes = await assessmentService.getAdminAssessmentById(assessmentId);
          if (adminAssessmentRes.data?.success) assessmentData = adminAssessmentRes.data.data;
        } catch (e) { console.error("Admin assessment fallback failed"); }
      }
      setAssessment(assessmentData);

      const [courseRes, lessonRes] = await Promise.all(metadataPromises);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);

      // Fetch Quizzes: try teacher first, fallback to admin
      let quizzesList = [];
      try {
        const quizzesRes = await quizService.getTeacherQuizzesByAssessment(assessmentId);
        if (quizzesRes.data?.success) {
          const data = quizzesRes.data.data;
          quizzesList = Array.isArray(data) ? data : (data?.quizzes || []);
        }
      } catch (e) { console.warn("Teacher quizzes fetch failed"); }

      if (quizzesList.length === 0 && isAdmin) {
        try {
          const adminQuizzesRes = await quizService.getAdminQuizzesByAssessment(assessmentId);
          if (adminQuizzesRes.data?.success) {
            const data = adminQuizzesRes.data.data;
            quizzesList = Array.isArray(data) ? data : (data?.quizzes || []);
          }
        } catch (e) { console.error("Admin quizzes fallback failed"); }
      }
      setQuizzes(quizzesList);

      // Fetch Essays: try teacher first, fallback to admin
      let essaysList = [];
      try {
        const essaysRes = await essayService.getTeacherEssaysByAssessment(assessmentId);
        if (essaysRes.data?.success) {
          const data = essaysRes.data.data;
          essaysList = Array.isArray(data) ? data : (data?.essays || []);
        }
      } catch (e) { console.warn("Teacher essays fetch failed"); }

      if (essaysList.length === 0 && isAdmin) {
        try {
          const adminEssaysRes = await essayService.getAdminEssaysByAssessment(assessmentId);
          if (adminEssaysRes.data?.success) {
            const data = adminEssaysRes.data.data;
            essaysList = Array.isArray(data) ? data : (data?.essays || []);
          }
        } catch (e) { console.error("Admin essays fallback failed"); }
      }
      setEssays(essaysList);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, courseId, lessonId, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) {
      navigate("/home");
      return;
    }

    fetchData();
  }, [isAuthenticated, isTeacher, navigate, fetchData]);

  const handleCreateQuizSuccess = () => {
    setShowCreateQuizModal(false);
    setShowCreateQuizSuccessModal(true);
    fetchData();
  };

  const handleEditQuiz = (quiz) => {
    setQuizToUpdate(quiz);
    setShowUpdateQuizModal(true);
  };

  const handleUpdateQuizSuccess = () => {
    setShowUpdateQuizModal(false);
    setQuizToUpdate(null);
    setShowUpdateQuizSuccessModal(true);
    fetchData();
  };

  const handleDeleteQuizClick = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteQuizModal(true);
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    setDeleting(true);
    try {
      const quizId = quizToDelete.quizId || quizToDelete.QuizId;
      const response = await quizService.deleteQuiz(quizId);

      if (response.data?.success) {
        setShowDeleteQuizModal(false);
        setQuizToDelete(null);
        setShowDeleteQuizSuccessModal(true);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Xóa Quiz thất bại");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa Quiz";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeleting(false);
    }
  };

  // Essay handlers
  const handleCreateEssaySuccess = () => {
    setShowCreateEssayModal(false);
    setShowCreateEssaySuccessModal(true);
    fetchData();
  };

  const handleEditEssay = (essay) => {
    setEssayToUpdate(essay);
    setShowUpdateEssayModal(true);
  };

  const handleUpdateEssaySuccess = () => {
    setShowUpdateEssayModal(false);
    setEssayToUpdate(null);
    setShowUpdateEssaySuccessModal(true);
    fetchData();
  };

  const handleDeleteEssayClick = (essay) => {
    setEssayToDelete(essay);
    setShowDeleteEssayModal(true);
  };

  const handleConfirmDeleteEssay = async () => {
    if (!essayToDelete) return;

    setDeletingEssay(true);
    try {
      const essayId = essayToDelete.essayId || essayToDelete.EssayId;
      const response = await essayService.deleteEssay(essayId);

      if (response.data?.success) {
        setShowDeleteEssayModal(false);
        setEssayToDelete(null);
        setShowDeleteEssaySuccessModal(true);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Xóa Essay thất bại");
      }
    } catch (error) {
      console.error("Error deleting essay:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa Essay";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeletingEssay(false);
    }
  };

  if (!isAuthenticated || !isTeacher) {
    return null;
  }

  if (loading) {
    return (
      <>
        <TeacherHeader />
        <div className="teacher-quiz-essay-management-container">
          <Container>
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          </Container>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TeacherHeader />
        <div className="teacher-quiz-essay-management-container">
          <Container>
            <div className="alert alert-danger text-center">{error}</div>
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <TeacherHeader />
      <div className="teacher-quiz-essay-management-container">
        <Container>
          {/* Premium Header */}
          <div className="quiz-essay-management-header">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div className="d-flex flex-column">
                <Breadcrumb
                  items={[
                    { label: "Quản lý khoá học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                    { label: course?.title || course?.Title || "Khoá học", path: `/teacher/course/${courseId}` },
                    { label: lesson?.title || lesson?.Title || "Bài học", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
                    { label: "Quản lý bài tập", isCurrent: true }
                  ]}
                  showHomeIcon={true}
                />
                <h1 className="premium-gradient-text mt-3 mb-0">Quản lý nội dung bài kiểm tra</h1>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="header-stats-badge">
                  <FaRegListAlt />
                  <span>{quizzes.length} Quizzes</span>
                </div>
                <div className="header-stats-badge" style={{ backgroundColor: "rgba(188, 105, 192, 0.1)", color: "#BC69C0" }}>
                  <FaRegListAlt />
                  <span>{essays.length} Essays</span>
                </div>
              </div>
            </div>

            {assessment && (
              <div className="assessment-info-glass p-3 rounded-4" style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <h4 className="fw-bold mb-2" style={{ color: "#1e293b" }}>{assessment.title || assessment.Title}</h4>
                <div className="d-flex gap-4 text-muted small flex-wrap">
                  {(assessment.openAt || assessment.OpenAt) && (
                    <span><strong>Mở lúc:</strong> {new Date(assessment.openAt || assessment.OpenAt).toLocaleString('vi-VN')}</span>
                  )}
                  {(assessment.dueAt || assessment.DueAt) && (
                    <span><strong>Hạn chót:</strong> {new Date(assessment.dueAt || assessment.DueAt).toLocaleString('vi-VN')}</span>
                  )}
                  {(assessment.timeLimit || assessment.TimeLimit) && (
                    <span><strong>Thời gian:</strong> {assessment.timeLimit || assessment.TimeLimit}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Buttons */}
          <div className="d-flex gap-3 mb-5 flex-wrap">
            <button
              className="premium-btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowCreateQuizModal(true)}
            >
              <FaPlus /> Tạo Quiz mới
            </button>
            <button
              className="premium-btn-outline d-flex align-items-center gap-2"
              onClick={() => setShowCreateEssayModal(true)}
            >
              <FaPlus /> Tạo Essay mới
            </button>
          </div>

          {/* Content Sections */}
          <Row className="g-4">
            {/* Quizzes Section */}
            <Col md={6}>
              <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
                <h2 className="h4 fw-bold text-primary mb-4">Các bài Quiz đã tạo</h2>
                <div className="d-flex flex-column gap-3">
                  {quizzes.length > 0 ? (
                    quizzes.map((quiz) => {
                      const quizId = quiz.quizId || quiz.QuizId;
                      const quizTitle = quiz.title || quiz.Title || "Untitled Quiz";
                      const quizStatus = quiz.status !== undefined ? quiz.status : quiz.Status;
                      const statusInfo = getStatusLabel(quizStatus);

                      return (
                        <div 
                          key={quizId} 
                          className="card border rounded-3 p-3 hover-card"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(ROUTE_PATHS.TEACHER_QUIZ_SECTION_MANAGEMENT(courseId, lessonId, moduleId, assessmentId, quizId))}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h5 className="mb-2 fw-semibold">{quizTitle}</h5>
                              <span
                                className="badge rounded-pill px-3 py-1"
                                style={{
                                  color: statusInfo.color,
                                  backgroundColor: statusInfo.bg,
                                }}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="d-flex gap-2 ms-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="btn btn-edit-quiz d-flex align-items-center justify-content-center"
                                title="Sửa Quiz"
                                onClick={() => handleEditQuiz(quiz)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-delete-quiz d-flex align-items-center justify-content-center"
                                title="Xóa Quiz"
                                onClick={() => handleDeleteQuizClick(quiz)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted py-5">Chưa có Quiz nào</div>
                  )}
                </div>
              </div>
            </Col>

            {/* Essays Section */}
            <Col md={6}>
              <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
                <h2 className="h4 fw-bold text-primary mb-4">Các bài Essay đã tạo</h2>
                <div className="d-flex flex-column gap-3">
                  {essays.length > 0 ? (
                    essays.map((essay) => {
                      const essayId = essay.essayId || essay.EssayId;
                      const essayTitle = essay.title || essay.Title || "Untitled Essay";
                      const essayStatus = essay.status !== undefined ? essay.status : essay.Status;
                      const statusInfo = getStatusLabel(essayStatus);

                      return (
                        <div key={essayId} className="card border rounded-3 p-3 hover-card">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h5 className="mb-2 fw-semibold">{essayTitle}</h5>
                            </div>
                            <div className="d-flex gap-2 ms-3">
                              <button
                                className="btn btn-edit-essay d-flex align-items-center justify-content-center"
                                title="Sửa Essay"
                                onClick={() => handleEditEssay(essay)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-delete-essay d-flex align-items-center justify-content-center"
                                title="Xóa Essay"
                                onClick={() => handleDeleteEssayClick(essay)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted py-5">Chưa có Essay nào</div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Create Quiz Modal */}
      {assessmentId && (
        <CreateQuizModal
          show={showCreateQuizModal}
          onClose={() => setShowCreateQuizModal(false)}
          onSuccess={handleCreateQuizSuccess}
          assessmentId={parseInt(assessmentId)}
          assessment={assessment}
          isAdmin={isAdmin}
        />
      )}

      {/* Update Quiz Modal */}
      {assessmentId && quizToUpdate && (
        <CreateQuizModal
          show={showUpdateQuizModal}
          onClose={() => {
            setShowUpdateQuizModal(false);
            setQuizToUpdate(null);
          }}
          onSuccess={handleUpdateQuizSuccess}
          assessmentId={parseInt(assessmentId)}
          quizToUpdate={quizToUpdate}
          assessment={assessment}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteQuizModal}
        onClose={() => {
          if (!deleting) {
            setShowDeleteQuizModal(false);
            setQuizToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteQuiz}
        title="Bạn chắc chắn muốn xóa quiz này chứ?"
        message="Hành động này không thể hoàn tác."
        confirmText={deleting ? "Đang xóa..." : "Xác nhận"}
        cancelText="Hủy"
        type="danger"
        disabled={deleting}
      />

      {/* Success Modals */}
      <SuccessModal
        isOpen={showCreateQuizSuccessModal}
        onClose={() => setShowCreateQuizSuccessModal(false)}
        title="Tạo Quiz thành công"
        message="Quiz của bạn đã được tạo thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showUpdateQuizSuccessModal}
        onClose={() => setShowUpdateQuizSuccessModal(false)}
        title="Cập nhật Quiz thành công"
        message="Quiz của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showDeleteQuizSuccessModal}
        onClose={() => setShowDeleteQuizSuccessModal(false)}
        title="Xóa Quiz thành công"
        message="Quiz đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Create Essay Modal */}
      {assessmentId && (
        <CreateEssayModal
          show={showCreateEssayModal}
          onClose={() => setShowCreateEssayModal(false)}
          onSuccess={handleCreateEssaySuccess}
          assessmentId={parseInt(assessmentId)}
          assessment={assessment}
          isAdmin={isAdmin}
        />
      )}

      {/* Update Essay Modal */}
      {assessmentId && essayToUpdate && (
        <CreateEssayModal
          show={showUpdateEssayModal}
          onClose={() => {
            setShowUpdateEssayModal(false);
            setEssayToUpdate(null);
          }}
          onSuccess={handleUpdateEssaySuccess}
          assessmentId={parseInt(assessmentId)}
          essayToUpdate={essayToUpdate}
          assessment={assessment}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Essay Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteEssayModal}
        onClose={() => {
          if (!deletingEssay) {
            setShowDeleteEssayModal(false);
            setEssayToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteEssay}
        title="Bạn chắc chắn muốn xóa essay này chứ?"
        message="Hành động này không thể hoàn tác."
        confirmText={deletingEssay ? "Đang xóa..." : "Xác nhận"}
        cancelText="Hủy"
        type="danger"
        disabled={deletingEssay}
      />

      {/* Essay Success Modals */}
      <SuccessModal
        isOpen={showCreateEssaySuccessModal}
        onClose={() => setShowCreateEssaySuccessModal(false)}
        title="Tạo Essay thành công"
        message="Essay của bạn đã được tạo thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showUpdateEssaySuccessModal}
        onClose={() => setShowUpdateEssaySuccessModal(false)}
        title="Cập nhật Essay thành công"
        message="Essay của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showDeleteEssaySuccessModal}
        onClose={() => setShowDeleteEssaySuccessModal(false)}
        title="Xóa Essay thành công"
        message="Essay đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        message={notification.message}
      />
    </>
  );
}

