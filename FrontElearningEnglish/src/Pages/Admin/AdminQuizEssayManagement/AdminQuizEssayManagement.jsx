import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FaEdit, FaTrash, FaList, FaPlus } from "react-icons/fa";
import { useAuth } from "../../../Context/AuthContext";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { assessmentService } from "../../../Services/assessmentService";
import { courseService } from "../../../Services/courseService";
import { lessonService } from "../../../Services/lessonService";
import { teacherService } from "../../../Services/teacherService";
import { quizService } from "../../../Services/quizService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { essayService } from "../../../Services/essayService";
import { adminService } from "../../../Services/adminService";
import CreateQuizModal from "../../../Components/Teacher/CreateQuizModal/CreateQuizModal";
import CreateEssayModal from "../../../Components/Teacher/CreateEssayModal/CreateEssayModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import EssayDetailModal from "../../../Components/Common/EssayDetailModal/EssayDetailModal";
import { useQuizStatus } from "../../../hooks/useQuizStatus";
import "./AdminQuizEssayManagement.css";

export default function AdminQuizEssayManagement() {
  const { courseId, lessonId, moduleId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { roles, isAuthenticated } = useAuth();
  const { getStatusLabel } = useQuizStatus();
  const [assessment, setAssessment] = useState(null);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
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

  const isAdmin = roles?.some(role => ["SuperAdmin", "ContentAdmin"].includes(role));

  const [selectedEssayId, setSelectedEssayId] = useState(null);
  const [showEssayDetailModal, setShowEssayDetailModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch metadata and content in parallel
      const [assessmentRes, quizzesRes, essaysRes, courseRes, lessonRes, moduleRes] = await Promise.all([
        assessmentService.getAdminAssessmentById(assessmentId),
        quizService.getAdminQuizzesByAssessment(assessmentId),
        essayService.getAdminEssaysByAssessment(assessmentId),
        courseService.getCourseById(courseId),
        lessonService.getLessonById(lessonId),
        adminService.getModuleById(moduleId)
      ]);

      if (assessmentRes.data?.success) setAssessment(assessmentRes.data.data);
      if (quizzesRes.data?.success) setQuizzes(quizzesRes.data.data || []);
      if (essaysRes.data?.success) setEssays(essaysRes.data.data || []);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);
      if (moduleRes.data?.success) setModule(moduleRes.data.data);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, courseId, lessonId, moduleId]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/home");
      return;
    }

    fetchData();
  }, [isAuthenticated, isAdmin, navigate, fetchData]);

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
      const response = await quizService.deleteAdminQuiz(quizId);

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
      const response = await essayService.deleteAdminEssay(essayId);

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

  const handleViewEssay = (essay) => {
    const essayId = essay.essayId || essay.EssayId;
    setSelectedEssayId(essayId);
    setShowEssayDetailModal(true);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <>
      <div className="admin-quiz-essay-management-container">
        <div className="admin-breadcrumb-wrapper">
          <Container fluid>
            <div className="breadcrumb-section pt-0">
              <Breadcrumb
                items={[
                  { label: "Quản lý khóa học", path: ROUTE_PATHS.ADMIN.COURSES },
                  { label: course?.title || course?.Title || "Khóa học", path: `/admin/courses/${courseId}` },
                  { label: lesson?.title || lesson?.Title || "Bài học", path: `/admin/courses/${courseId}/lesson/${lessonId}` },
                  { label: module?.name || module?.Name || "Module", path: `/admin/courses/${courseId}/lesson/${lessonId}?moduleId=${moduleId}` },
                  { label: "Quản lý bài tập", isCurrent: true }
                ]}
                showHomeIcon={false}
              />
            </div>
          </Container>
        </div>

        <Container fluid className="lesson-detail-content px-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger text-center">{error}</div>
          ) : (
            <>
              <div className="mb-4 question-header-section mt-0">
                <div className="text-center mb-4">
                  <h1 className="mb-2 fw-bold premium-gradient-text">Quản lý nội dung bài kiểm tra</h1>
                  {assessment && (
                    <div className="assessment-context-info">
                      <h4 className="text-primary mb-2">{assessment.title || assessment.Title}</h4>
                      <div className="d-flex justify-content-center gap-4 text-muted small flex-wrap">
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

                <div className="d-flex justify-content-center gap-3 mb-4">
                  <div className="header-stats-badge stats-badge-quiz">
                    <FaList />
                    <span>{quizzes.length} Quizzes</span>
                  </div>
                  <div className="header-stats-badge stats-badge-essay">
                    <FaList />
                    <span>{essays.length} Essays</span>
                  </div>
                </div>
              </div>

              {/* Create Buttons */}
              <div className="d-flex justify-content-center gap-4 mb-5 flex-wrap">
                <button
                  className="btn create-quiz-button"
                  onClick={() => setShowCreateQuizModal(true)}
                >
                  <FaPlus /> Tạo Quiz mới
                </button>
                <button
                  className="btn create-essay-button"
                  onClick={() => setShowCreateEssayModal(true)}
                >
                  <FaPlus /> Tạo Essay mới
                </button>
              </div>

              {/* Content Sections */}
              <Row className="g-4">
                {/* Quizzes Section */}
                <Col md={6}>
                  <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
                    <h2 className="h4 fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                      <span className="section-dot quiz"></span>
                      Các bài Quiz đã tạo
                    </h2>
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
                              className="admin-assessment-card"
                              onClick={() => navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/assessment/${assessmentId}/quiz/${quizId}/sections`)}
                            >
                              <div className="card-info">
                                <div className="card-header-row">
                                  <h5 className="card-title">{quizTitle}</h5>
                                  <span className="badge-quiz">QUIZ</span>
                                </div>
                                <div className="card-meta-container">
                                  <div className="card-meta-row status-row">
                                    <strong>Trạng thái:</strong>
                                    <span className={`status-pill status-${statusInfo.label.toLowerCase()}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn-action edit"
                                  title="Sửa Quiz"
                                  onClick={() => handleEditQuiz(quiz)}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn-action delete"
                                  title="Xóa Quiz"
                                  onClick={() => handleDeleteQuizClick(quiz)}
                                >
                                  <FaTrash />
                                </button>
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
                  <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
                    <h2 className="h4 fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                      <span className="section-dot essay"></span>
                      Các bài Essay đã tạo
                    </h2>
                    <div className="d-flex flex-column gap-3">
                      {essays.length > 0 ? (
                        essays.map((essay) => {
                          const essayId = essay.essayId || essay.EssayId;
                          const essayTitle = essay.title || essay.Title || "Untitled Essay";

                          return (
                            <div
                              key={essayId}
                              className="admin-assessment-card"
                              onClick={() => handleViewEssay(essay)}
                            >
                              <div className="card-info">
                                <div className="card-header-row">
                                  <h5 className="card-title">{essayTitle}</h5>
                                  <span className="badge-essay">ESSAY</span>
                                </div>
                                <div className="card-meta-container">
                                  <div className="card-meta-row status-row">
                                    <strong>Trạng thái:</strong>
                                    <span className="status-pill status-active">Hoạt động</span>
                                  </div>
                                </div>
                              </div>
                              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn-action edit"
                                  title="Sửa Essay"
                                  onClick={() => handleEditEssay(essay)}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn-action delete"
                                  title="Xóa Essay"
                                  onClick={() => handleDeleteEssayClick(essay)}
                                >
                                  <FaTrash />
                                </button>
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
            </>
          )}
        </Container>
      </div>

      {/* Create Quiz Modal */}
      {assessmentId && (
        <CreateQuizModal
          show={showCreateQuizModal}
          onClose={() => setShowCreateQuizModal(false)}
          onSuccess={handleCreateQuizSuccess}
          assessmentId={parseInt(assessmentId)}
          isAdmin={true}
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
          isAdmin={true}
        />
      )}

      {/* Delete Quiz Confirmation Modal */}
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
          isAdmin={true}
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
          isAdmin={true}
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
      <EssayDetailModal
        show={showEssayDetailModal}
        onClose={() => {
          setShowEssayDetailModal(false);
          setSelectedEssayId(null);
        }}
        essayId={selectedEssayId}
        isAdmin={true}
      />
    </>
  );
}
