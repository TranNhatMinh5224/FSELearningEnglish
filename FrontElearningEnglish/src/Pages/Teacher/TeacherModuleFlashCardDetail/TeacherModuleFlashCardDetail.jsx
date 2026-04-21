import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaVolumeUp, FaRegListAlt } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { teacherService } from "../../../Services/teacherService";
import { flashcardService } from "../../../Services/flashcardService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useAuth } from "../../../Context/AuthContext";
import CreateFlashCardModal from "../../../Components/Teacher/CreateFlashCardModal/CreateFlashCardModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import "./TeacherModuleFlashCardDetail.css";

export default function TeacherModuleFlashCardDetail() {
  const { courseId, lessonId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();
  
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [flashcardToUpdate, setFlashcardToUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

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
    setLoading(true);
    try {
      // Fetch core data
      const [moduleRes, courseRes, lessonRes] = await Promise.all([
        teacherService.getModuleById(moduleId),
        teacherService.getCourseDetail(courseId),
        teacherService.getLessonById(lessonId)
      ]);

      if (moduleRes.data?.success) setModule(moduleRes.data.data);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);

      // Try fetching teacher flashcards first
      let flashcardsList = [];
      try {
        const flashcardsRes = await flashcardService.getTeacherFlashcardsByModule(moduleId);
        if (flashcardsRes.data?.success) {
          const data = flashcardsRes.data.data;
          // Handle both direct array or { flashcards: [] } structure
          flashcardsList = Array.isArray(data) ? data : (data?.flashcards || []);
        }
      } catch (teacherErr) {
        console.warn("Teacher flashcards fetch failed, trying admin fallback if applicable", teacherErr);
      }

      // Fallback to Admin endpoint IF empty AND user is Admin
      if (flashcardsList.length === 0 && isAdmin) {
        try {
          const adminFlashcardsRes = await flashcardService.getAdminFlashcardsByModule(moduleId);
          if (adminFlashcardsRes.data?.success) {
            const data = adminFlashcardsRes.data.data;
            flashcardsList = Array.isArray(data) ? data : (data?.flashcards || []);
          }
        } catch (adminErr) {
          console.error("Admin flashcards fallback failed:", adminErr);
        }
      }

      setFlashcards(flashcardsList);
    } catch (err) {
      console.error("Error fetching data:", err);
      setNotification({ isOpen: true, type: "error", message: "Không thể tải dữ liệu từ vựng. Vui lòng thử lại sau." });
    } finally {
      setLoading(false);
    }
  }, [moduleId, courseId, lessonId, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) {
      navigate("/home");
      return;
    }
    fetchData();
  }, [isAuthenticated, isTeacher, navigate, fetchData]);

  const handleCreateSuccess = () => {
    setSuccessMessage("Tạo flashcard thành công!");
    setShowSuccessModal(true);
    fetchData();
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage("Cập nhật flashcard thành công!");
    setShowSuccessModal(true);
    fetchData();
  };

  const handleDeleteClick = (card) => {
    setFlashcardToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!flashcardToDelete) return;
    try {
      // Backend returns FlashCardId (capital C)
      const cardId = flashcardToDelete.flashCardId || 
                     flashcardToDelete.FlashCardId || 
                     flashcardToDelete.flashcardId || 
                     flashcardToDelete.FlashcardId;
      
      if (!cardId) {
        console.error("Flashcard ID not found. Available keys:", Object.keys(flashcardToDelete));
        setNotification({ isOpen: true, type: "error", message: "Không tìm thấy ID của flashcard. Vui lòng thử lại." });
        return;
      }
      
      const res = await flashcardService.deleteFlashcard(cardId);
      if (res.data?.success) {
        setSuccessMessage("Xóa flashcard thành công!");
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: "Xóa thất bại: " + res.data?.message });
      }
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa flashcard: " + (err.response?.data?.message || err.message) });
    }
  };

  const playAudio = (url) => {
      if(!url) return;
      new Audio(url).play();
  };

  return (
    <>
      <TeacherHeader />
      <div className="teacher-module-flashcard-detail-container">
        <Container>
          <div className="breadcrumb-section mt-3">
            <Breadcrumb
              items={[
                { label: "Quản lý khoá học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                { label: course?.title || course?.Title || "Khóa học", path: `/teacher/course/${courseId}` },
                { label: lesson?.title || lesson?.Title || "Bài học", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
                { label: "Quản lý từ vựng", isCurrent: true }
              ]}
              showHomeIcon={false}
            />
          </div>

          <div className="flashcard-management-header mb-4 mt-4">
            <div className="d-flex align-items-center justify-content-between">
              <div className="header-content">
                <h2 className="mb-1 fw-bold text-primary">Quản lý từ vựng</h2>
                <div className="d-flex align-items-center gap-3">
                  <span className="module-name text-muted">
                    {module?.name || module?.Name || "Module"}
                  </span>
                  <Badge bg="primary" className="flashcard-count-badge">
                    {flashcards.length} từ vựng
                  </Badge>
                </div>
              </div>
              <Button
                variant="primary"
                className="create-flashcard-btn d-flex align-items-center gap-2"
                onClick={() => { setFlashcardToUpdate(null); setShowCreateModal(true); }}
              >
                <FaPlus /> <span>Thêm Flashcard</span>
              </Button>
            </div>
          </div>

          {loading ? (
             <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : flashcards.length === 0 ? (
             <div className="text-center py-5 bg-light rounded text-muted">
                 <p>Chưa có từ vựng nào trong bộ này.</p>
                 <Button variant="primary" onClick={() => { setFlashcardToUpdate(null); setShowCreateModal(true); }}>Tạo từ vựng đầu tiên</Button>
             </div>
          ) : (
             <Row xs={1} md={2} lg={3} className="g-4">
                 {flashcards.map((card, idx) => (
                     <Col key={card.flashCardId || card.FlashCardId || card.flashcardId || card.FlashcardId || idx}>
                        <Card className="h-100 border-0 shadow-sm flashcard-item">
                            <div className="position-relative">
                                <Card.Img 
                                    variant="top" 
                                    src={card.imageUrl || card.ImageUrl || "https://via.placeholder.com/300x200?text=No+Image"} 
                                    style={{height: '200px', objectFit: 'cover'}}
                                />
                                {(card.audioUrl || card.AudioUrl) && (
                                    <Button 
                                        variant="light" 
                                        className="position-absolute bottom-0 end-0 m-2 rounded-circle p-2 shadow-sm"
                                        onClick={() => playAudio(card.audioUrl || card.AudioUrl)}
                                    >
                                        <FaVolumeUp />
                                    </Button>
                                )}
                            </div>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h5 className="fw-bold mb-0 text-primary">{card.word}</h5>
                                    <span className="badge bg-secondary">{card.partOfSpeech}</span>
                                </div>
                                <div className="text-muted fst-italic mb-2">{card.pronunciation}</div>
                                <p className="card-text border-top pt-2 mt-2">{card.meaning}</p>
                                
                                <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                                    <Button variant="outline-primary" size="sm" onClick={() => { setFlashcardToUpdate(card); setShowCreateModal(true); }}>
                                        <FaEdit /> Sửa
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(card)}>
                                        <FaTrash /> Xóa
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                     </Col>
                 ))}
             </Row>
          )}
        </Container>
      </div>

      <CreateFlashCardModal 
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={flashcardToUpdate ? handleUpdateSuccess : handleCreateSuccess}
        moduleId={moduleId}
        flashcardToUpdate={flashcardToUpdate}
        isAdmin={isAdmin}
      />

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Xóa Flashcard?"
        message="Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Thành công"
        message={successMessage}
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