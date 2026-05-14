import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Card, Badge } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from "react-icons/fa";
import { PiFilesDuotone } from "react-icons/pi";
import CreateQuestionModal from "../../../Components/Teacher/CreateQuestionModal/CreateQuestionModal";
import CreateQuizGroupModal from "../../../Components/Teacher/CreateQuizGroupModal/CreateQuizGroupModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { questionService } from "../../../Services/questionService";
import { quizService } from "../../../Services/quizService";
import { courseService } from "../../../Services/courseService";
import { lessonService } from "../../../Services/lessonService";
import { assessmentService } from "../../../Services/assessmentService";
import { adminService } from "../../../Services/adminService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useAuth } from "../../../Context/AuthContext";
import { useQuestionTypes } from "../../../hooks/useQuestionTypes";
import "./AdminQuestionManagement.css";

export default function AdminQuestionManagement() {
  const { getQuestionTypeLabel } = useQuestionTypes();
  const { courseId, lessonId, moduleId, assessmentId, quizId, sectionId } = useParams();
  const navigate = useNavigate();
  const { roles, isAuthenticated } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [section, setSection] = useState(null);
  const [module, setModule] = useState(null);
  const [contextData, setContextData] = useState({ title: "", subtitle: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  // Question Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionToUpdate, setQuestionToUpdate] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null);

  // Question Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  // Group Modals
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [groupToUpdate, setGroupToUpdate] = useState(null);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Success Modal states
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isAdmin = roles?.some(role => ["SuperAdmin", "ContentAdmin"].includes(role));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [qRes, gRes, sectionRes, quizRes, assessRes, courseRes, lessonRes, moduleRes] = await Promise.all([
        questionService.getAdminQuestionsBySection(sectionId),
        quizService.getAdminQuizGroupsBySection(sectionId),
        quizService.getAdminQuizSectionById(sectionId),
        quizService.getAdminQuizById(quizId),
        assessmentService.getAdminAssessmentById(assessmentId),
        courseService.getCourseById(courseId),
        lessonService.getLessonById(lessonId),
        adminService.getModuleById(moduleId)
      ]);

      if (qRes.data?.success) setQuestions(qRes.data.data || []);
      if (gRes.data?.success) setGroups(gRes.data.data || []);
      
      const title = sectionRes.data?.success ? `Section: ${sectionRes.data.data.title || "Untitled Section"}` : "";
      setContextData({ title });

      if (sectionRes.data?.success) setSection(sectionRes.data.data);
      if (quizRes.data?.success) setQuiz(quizRes.data.data);
      if (assessRes.data?.success) setAssessment(assessRes.data.data);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);
      if (moduleRes.data?.success) setModule(moduleRes.data.data);

    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [sectionId, quizId, assessmentId, courseId, lessonId]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/home");
      return;
    }
    fetchData();
  }, [isAuthenticated, isAdmin, navigate, fetchData]);

  const handleCreateSuccess = (newQuestion) => {
    setSuccessMessage("Tạo câu hỏi thành công!");
    setShowSuccessModal(true);
    fetchData(); 
  };

  const handleUpdateSuccess = (updatedQuestion) => {
    setSuccessMessage("Cập nhật câu hỏi thành công!");
    setShowSuccessModal(true);
    fetchData();
  };

  const handleGroupEditSuccess = () => {
      setSuccessMessage("Cập nhật Group thành công!");
      setShowSuccessModal(true);
      fetchData();
  };

  const confirmDeleteGroup = async () => {
      if (!groupToDelete) return;
      try {
          const res = await quizService.deleteAdminQuizGroup(groupToDelete.quizGroupId);
          if (res.data?.success) {
              setSuccessMessage("Xóa Group thành công!");
              setShowSuccessModal(true);
              setShowGroupDeleteModal(false);
              fetchData();
          } else {
              setNotification({ isOpen: true, type: "error", message: res.data?.message || "Xóa thất bại" });
          }
      } catch (err) {
          console.error(err);
          setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa Group" });
      }
  };

  const handleAddQuestion = (targetGroup = null) => {
      setTargetGroupId(targetGroup ? targetGroup.quizGroupId : null);
      setQuestionToUpdate(null);
      setShowCreateModal(true);
  };

  const handleEditQuestion = (question) => {
    setQuestionToUpdate(question);
    setTargetGroupId(question.quizGroupId); 
    setShowCreateModal(true);
  };

  const handleDeleteQuestion = (question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      const res = await questionService.deleteAdminQuestion(questionToDelete.questionId);
      if (res.data?.success) {
        setSuccessMessage("Xóa câu hỏi thành công!");
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        setQuestionToDelete(null);
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: res.data?.message || "Xóa thất bại" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa câu hỏi" });
    }
  };

  const standaloneQuestions = questions.filter(q => !q.quizGroupId);
  const questionsByGroup = {};
  questions.forEach(q => {
      if (q.quizGroupId) {
          if (!questionsByGroup[q.quizGroupId]) questionsByGroup[q.quizGroupId] = [];
          questionsByGroup[q.quizGroupId].push(q);
      }
  });

  const renderQuestionCard = (q, index, isGrouped = false) => {
    const renderQuestionBody = () => {
      if (q.type === 5 || q.Type === 5) {
        let pairs = [];
        try {
          if (q.matchingPairs) pairs = q.matchingPairs;
          else if (q.correctAnswersJson) pairs = JSON.parse(q.correctAnswersJson);
          else if (q.CorrectAnswersJson) pairs = JSON.parse(q.CorrectAnswersJson);
        } catch (e) { console.error("Error parsing matching pairs", e); }

        if (pairs.length > 0) {
          return (
            <div className="mt-2 bg-light p-3 rounded border shadow-sm">
              {pairs.map((p, i) => (
                <div key={i} className="d-flex align-items-center gap-3 mb-2 border-bottom pb-1 last-mb-0">
                  <span className="fw-bold text-primary">{p.key}</span>
                  <span className="text-muted">➡</span>
                  <span className="text-dark">{p.value}</span>
                </div>
              ))}
            </div>
          );
        }
      }

      if (q.type === 6 || q.Type === 6) {
        const options = q.options || q.Options || [];
        return (
          <ol className="mt-2 ps-3 mb-0">
            {options.map((opt, idx) => (
              <li key={idx} className="mb-1 text-dark fw-medium">{opt.text || opt.Text}</li>
            ))}
          </ol>
        );
      }

      const options = q.options || q.Options || [];
      return (
        <ul className="list-unstyled options-preview mb-0">
          {options.map((opt, idx) => {
            const isCorrect = opt.isCorrect || opt.IsCorrect;
            const text = opt.text || opt.Text;
            return (
              <li key={idx} className={isCorrect ? "text-success fw-bold" : ""}>
                {isCorrect && "✓ "} {text}
              </li>
            );
          })}
        </ul>
      );
    };

    const mediaUrl = q.mediaUrl || q.MediaUrl;

    return (
      <Card key={q.questionId || q.QuestionId || index} className="mb-3 border-0 shadow-sm question-card">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between gap-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="question-number-badge">#{index + 1}</div>
                <Badge bg="info">{getQuestionTypeLabel(q.type || q.Type)}</Badge>
                <div className="ms-auto fw-bold text-danger">{(q.points || q.Points || 0).toFixed(1)} pts</div>
              </div>
              <h6 className="fw-bold mb-2">{q.questionText || q.QuestionText || q.stemText || q.StemText}</h6>
              
              {mediaUrl && (
                <div className="question-media-preview">
                  {mediaUrl.match(/\.(mp4|webm|mov|m4v)$/i) ? (
                    <div className="premium-video-container">
                      <video src={mediaUrl} controls className="premium-video-element" />
                    </div>
                  ) : mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                    <div className="premium-audio-container">
                      <audio src={mediaUrl} controls className="premium-audio-element" />
                    </div>
                  ) : (
                    <div className="premium-image-container" onClick={() => window.open(mediaUrl, '_blank')}>
                      <img src={mediaUrl} alt="Question" className="premium-image-element" />
                    </div>
                  )}
                </div>
              )}
              <div className="question-content-body">
                {renderQuestionBody()}
              </div>
            </div>
            <div className="action-buttons d-flex flex-column gap-2">
              <Button variant="light" size="sm" onClick={() => handleEditQuestion(q)} title="Sửa"><FaEdit className="text-primary" /></Button>
              <Button variant="light" size="sm" onClick={() => handleDeleteQuestion(q)} title="Xóa"><FaTrash className="text-danger" /></Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="admin-lesson-detail-container">
      <div className="admin-breadcrumb-wrapper">
        <Container fluid>
          <div className="breadcrumb-section pt-0">
            <Breadcrumb
              items={[
                { label: "Courses", path: ROUTE_PATHS.ADMIN.COURSES },
                { label: course?.title || course?.Title || "Course", path: `/admin/courses/${courseId}` },
                { label: lesson?.title || lesson?.Title || "Lesson", path: `/admin/courses/${courseId}/lesson/${lessonId}` },
                { label: module?.name || module?.Name || "Module", path: `/admin/courses/${courseId}/lesson/${lessonId}?moduleId=${moduleId}` },
                { label: assessment?.title || assessment?.Title || "Assessment", path: `/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/assessment/${assessmentId}` },
                { label: quiz?.title || quiz?.Title || "Quiz", path: `/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/assessment/${assessmentId}/quiz/${quizId}/sections` },
                { label: "Questions", isCurrent: true }
              ]}
              showHomeIcon={false}
            />
          </div>
        </Container>
      </div>

      <Container fluid className="lesson-detail-content px-4 py-5">
        <div className="question-header-section d-flex justify-content-between align-items-center mb-5">
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-3">
              <h1 className="premium-gradient-text mb-0">{contextData.title}</h1>
            </div>
            {contextData.subtitle && <p className="text-muted mb-0 fw-medium">{contextData.subtitle}</p>}
          </div>

          <div className="d-flex gap-3 align-items-center">
            <div className="header-stats-badge d-flex align-items-center gap-2">
              <PiFilesDuotone size={24} className="text-primary" />
              <span className="fw-bold">{questions.length} Items</span>
            </div>
            <Button className="premium-btn" onClick={() => handleAddQuestion(null)}>
              <FaPlus className="me-2" /> New Question
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="question-content-area">
            {standaloneQuestions.length > 0 && (
              <div className="mb-5">
                <h5 className="text-muted border-bottom pb-2 mb-3">Standalone Questions ({standaloneQuestions.length})</h5>
                {standaloneQuestions.map((q, i) => renderQuestionCard(q, i))}
              </div>
            )}

            {groups.map((group) => {
              const gId = group.quizGroupId || group.QuizGroupId;
              const gQuestions = questionsByGroup[gId] || group.questions || group.Questions || [];
              const imgUrl = group.imgKey || group.ImgKey || group.imgUrl;
              const videoUrl = group.videoKey || group.VideoKey || group.videoUrl;
              const audioUrl = group.audioKey || group.AudioKey || group.audioUrl;

              return (
                <div key={gId} className="mb-5 group-container">
                  <div className="group-header-bar d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <FaLayerGroup className="text-primary" size={24} />
                        <h4 className="text-primary fw-bold mb-0">{group.title || group.Title || group.name || group.Name}</h4>
                        <span className="points-badge-premium">Total: {(group.sumScore || group.SumScore || 0).toFixed(1)} pts</span>
                      </div>
                      
                      {(group.description || group.Description) && (
                        <div className="text-muted lh-lg mb-3" style={{ whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                          {group.description || group.Description}
                        </div>
                      )}

                      {(imgUrl || videoUrl || audioUrl) && (
                        <div className="group-media-grid d-flex flex-column gap-4">
                          {imgUrl && (
                            <div className="premium-image-container" onClick={() => window.open(imgUrl, '_blank')}>
                              <img src={imgUrl} alt="Group context" className="premium-image-element" />
                            </div>
                          )}
                          {videoUrl && (
                            <div className="premium-video-container">
                              <video src={videoUrl} controls className="premium-video-element" />
                            </div>
                          )}
                          {audioUrl && (
                            <div className="premium-audio-container">
                              <audio src={audioUrl} controls className="premium-audio-element" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="d-flex gap-2 align-self-start">
                      <Button variant="outline-primary" size="sm" onClick={() => handleAddQuestion(group)}><FaPlus className="me-1" /> Add Question</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => { setGroupToUpdate(group); setShowGroupEditModal(true); }}><FaEdit /></Button>
                      <Button variant="outline-danger" size="sm" onClick={() => { setGroupToDelete(group); setShowGroupDeleteModal(true); }}><FaTrash /></Button>
                    </div>
                  </div>

                  <div className="group-questions-list ps-4 ms-2 border-start border-3 border-light">
                    {gQuestions.length === 0 ? (
                      <div className="text-muted fst-italic py-2 ps-3">No questions in this group yet.</div>
                    ) : (
                      gQuestions.map((q, i) => renderQuestionCard(q, i, true))
                    )}
                  </div>
                </div>
              );
            })}

            {questions.length === 0 && groups.length === 0 && (
              <div className="text-center py-5 text-muted bg-light rounded">
                <p className="mb-3">No content available yet.</p>
                <Button variant="primary" onClick={() => handleAddQuestion(null)}>Create First Content</Button>
              </div>
            )}
          </div>
        )}
      </Container>

      <CreateQuestionModal 
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setQuestionToUpdate(null);
          setTargetGroupId(null);
        }}
        onSuccess={questionToUpdate ? handleUpdateSuccess : handleCreateSuccess}
        sectionId={sectionId ? parseInt(sectionId) : null}
        groupId={targetGroupId}
        questionToUpdate={questionToUpdate}
        isAdmin={true}
      />
      
      <CreateQuizGroupModal
          show={showGroupEditModal}
          onClose={() => setShowGroupEditModal(false)}
          onSuccess={handleGroupEditSuccess}
          quizSectionId={sectionId}
          groupToUpdate={groupToUpdate}
          isAdmin={true}
      />

      <ConfirmModal 
        isOpen={showGroupDeleteModal}
        onClose={() => setShowGroupDeleteModal(false)}
        onConfirm={confirmDeleteGroup}
        title="Xóa Group?"
        message="Bạn có chắc chắn muốn xóa Group này? Tất cả câu hỏi trong Group cũng sẽ bị xóa."
        confirmText="Xóa Group"
        cancelText="Hủy"
        type="danger"
      />

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuestion}
        title="Xóa câu hỏi?"
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
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        message={notification.message}
      />
    </div>
  );
}
