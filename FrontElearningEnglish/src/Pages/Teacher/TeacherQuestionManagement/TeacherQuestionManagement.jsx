import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Card, Badge } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import CreateQuestionModal from "../../../Components/Teacher/CreateQuestionModal/CreateQuestionModal";
import CreateQuizGroupModal from "../../../Components/Teacher/CreateQuizGroupModal/CreateQuizGroupModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import { PiFilesDuotone } from "react-icons/pi";
import { questionService } from "../../../Services/questionService";
import { quizService } from "../../../Services/quizService";
import { teacherService } from "../../../Services/teacherService";
import { assessmentService } from "../../../Services/assessmentService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useQuestionTypes } from "../../../hooks/useQuestionTypes";
import { useAuth } from "../../../Context/AuthContext";
import "./TeacherQuestionManagement.css";

export default function TeacherQuestionManagement() {
  const { getQuestionTypeLabel } = useQuestionTypes();
  const { courseId, lessonId, moduleId, assessmentId, quizId, sectionId, groupId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();

  const isAdmin = roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin", "Admin"].includes(roleName);
  });

  const isTeacher = (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return roleName === "Teacher";
  })) || user?.teacherSubscription?.isTeacher === true || isAdmin;

  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [contextData, setContextData] = useState({ title: "", subtitle: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionToUpdate, setQuestionToUpdate] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [groupToUpdate, setGroupToUpdate] = useState(null);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let qList = [];
      let gList = [];
      let title = "";
      let subtitle = "";

      if (groupId) {
        const groupRes = isAdmin 
          ? await quizService.getAdminQuizGroupById(groupId)
          : await quizService.getQuizGroupById(groupId);

        if (groupRes.data?.success) {
          const groupData = groupRes.data.data;
          title = `Group: ${groupData.title || groupData.Title || groupData.name || groupData.Name}`;
          subtitle = groupData.description || groupData.Description;
          qList = groupData.questions || groupData.Questions || [];
          setGroups([groupData]);
        }
      } else if (sectionId) {
        const sectionRes = isAdmin
          ? await quizService.getAdminQuizSectionById(sectionId)
          : await quizService.getQuizSectionById(sectionId);

        if (sectionRes.data?.success) {
          title = `Section: ${sectionRes.data.data.title || sectionRes.data.data.Title}`;
        }

        const qRes = await questionService.getQuestionsBySection(sectionId);
        if (qRes.data?.success) qList = qRes.data.data || [];

        const gRes = await quizService.getQuizGroupsBySection(sectionId);
        if (gRes.data?.success) gList = gRes.data.data || [];
        
        setGroups(gList);
      }

      setQuestions(qList);
      setContextData({ title, subtitle });

      const courseRes = await teacherService.getCourseDetail(courseId);
      if (courseRes.data?.success) setCourse(courseRes.data.data);

      const lessonRes = await teacherService.getLessonById(lessonId);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);

      const assessmentRes = isAdmin 
        ? await assessmentService.getAdminAssessmentById(assessmentId)
        : await assessmentService.getTeacherAssessmentById(assessmentId);
      if (assessmentRes.data?.success) setAssessment(assessmentRes.data.data);

    } catch (err) {
      console.error("Fetch Data Error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [sectionId, groupId, assessmentId, courseId, lessonId, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) {
      navigate("/home");
      return;
    }
    fetchData();
  }, [isAuthenticated, isTeacher, navigate, fetchData]);

  const handleAddQuestion = (targetGroup = null) => {
    setTargetGroupId(targetGroup ? (targetGroup.quizGroupId || targetGroup.QuizGroupId) : null);
    setQuestionToUpdate(null);
    setShowCreateModal(true);
  };

  const handleEditQuestion = (question) => {
    setQuestionToUpdate(question);
    setTargetGroupId(question.quizGroupId || question.QuizGroupId);
    setShowCreateModal(true);
  };

  const handleDeleteQuestion = (question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      const res = await questionService.deleteQuestion(questionToDelete.questionId || questionToDelete.QuestionId);
      if (res.data?.success) {
        setSuccessMessage("Xóa câu hỏi thành công!");
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: res.data?.message || "Xóa thất bại" });
      }
    } catch (err) {
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa câu hỏi" });
    }
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      const gId = groupToDelete.quizGroupId || groupToDelete.QuizGroupId;
      const res = isAdmin ? await quizService.deleteAdminQuizGroup(gId) : await quizService.deleteQuizGroup(gId);
      if (res.data?.success) {
        setSuccessMessage("Xóa nhóm thành công!");
        setShowSuccessModal(true);
        setShowGroupDeleteModal(false);
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: res.data?.message || "Xóa thất bại" });
      }
    } catch (err) {
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa nhóm" });
    }
  };

  const renderQuestionCard = (q, index) => {
    const renderQuestionBody = () => {
      if (q.type === 5 || q.Type === 5) { // Matching
        let pairs = [];
        try {
          const json = q.correctAnswersJson || q.CorrectAnswersJson;
          const parsed = typeof json === 'string' ? JSON.parse(json) : json;
          if (Array.isArray(parsed)) {
            pairs = parsed.map(p => ({ key: p.leftSide || p.key, value: p.rightSide || p.value }));
          } else if (typeof parsed === 'object' && parsed !== null) {
            pairs = Object.entries(parsed).map(([k, v]) => ({ key: k, value: v }));
          }
        } catch (e) { console.error("Matching parse error", e); }

        return pairs.length > 0 && (
          <div className="mt-2 bg-light p-2 rounded small border">
            {pairs.map((p, i) => (
              <div key={i} className="d-flex align-items-center gap-2 mb-1">
                <Badge bg="primary">{p.key}</Badge> <span>➡</span> <Badge bg="success">{p.value}</Badge>
              </div>
            ))}
          </div>
        );
      }

      const options = q.options || q.Options || [];
      return (
        <ul className="list-unstyled mb-0 mt-2 small">
          {options.map((opt, i) => (
            <li key={i} className={opt.isCorrect || opt.IsCorrect ? "text-success fw-bold" : "text-muted"}>
              {(opt.isCorrect || opt.IsCorrect) && "✓ "} {opt.text || opt.Text}
            </li>
          ))}
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
                <div className="ms-auto fw-bold text-primary">{(q.points || q.Points || 0).toFixed(1)} pts</div>
              </div>
              <h6 className="fw-bold mb-2">{q.questionText || q.QuestionText || q.stemText || q.StemText}</h6>
              
              {mediaUrl && (
                <div className="media-preview mb-3 rounded overflow-hidden border bg-light text-center" style={{ maxHeight: '250px' }}>
                  {mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={mediaUrl} controls className="mw-100" style={{ maxHeight: '250px' }} />
                  ) : mediaUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                    <audio src={mediaUrl} controls className="w-100 mt-2 p-2" />
                  ) : (
                    <img src={mediaUrl} alt="Question" className="img-fluid" style={{ maxHeight: '250px', cursor: 'zoom-in' }} onClick={() => window.open(mediaUrl, '_blank')} />
                  )}
                </div>
              )}
              {renderQuestionBody()}
            </div>
            <div className="d-flex flex-column gap-2">
              <Button variant="light" size="sm" onClick={() => handleEditQuestion(q)}><FaEdit className="text-primary" /></Button>
              <Button variant="light" size="sm" onClick={() => handleDeleteQuestion(q)}><FaTrash className="text-danger" /></Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const standaloneQuestions = questions.filter(q => !(q.quizGroupId || q.QuizGroupId));
  const questionsByGroup = {};
  questions.forEach(q => {
    const gId = q.quizGroupId || q.QuizGroupId;
    if (gId) {
      if (!questionsByGroup[gId]) questionsByGroup[gId] = [];
      questionsByGroup[gId].push(q);
    }
  });

  return (
    <>
      <TeacherHeader />
      <div className="teacher-question-management-container">
        <Container fluid className="p-4 content-wrapper">
          <Breadcrumb
            items={[
              { label: "Courses", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
              { label: course?.title || "Course", path: `/teacher/course/${courseId}` },
              { label: lesson?.title || "Lesson", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
              { label: assessment?.title || "Assessment", path: ROUTE_PATHS.TEACHER_QUIZ_ESSAY_MANAGEMENT(courseId, lessonId, moduleId, assessmentId) },
              { label: "Questions", isCurrent: true }
            ]}
          />

          <div className="d-flex justify-content-between align-items-center my-4">
            <div>
              <h2 className="premium-gradient-text fw-bold mb-1">{contextData.title}</h2>
              <p className="text-muted mb-0">{contextData.subtitle}</p>
            </div>
            <div className="d-flex gap-3">
              <div className="header-stats-badge bg-white shadow-sm px-3 py-2 rounded d-flex align-items-center gap-2">
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
            <div className="content-area">
              {standaloneQuestions.length > 0 && (
                <div className="mb-5">
                  <h5 className="text-muted border-bottom pb-2 mb-3">Standalone Questions</h5>
                  {standaloneQuestions.map((q, i) => renderQuestionCard(q, i))}
                </div>
              )}

              {groups.map((group) => {
                const gId = group.quizGroupId || group.QuizGroupId;
                const gQuestions = questionsByGroup[gId] || group.questions || group.Questions || [];
                const imgUrl = group.imgKey || group.ImgKey;
                const videoUrl = group.videoKey || group.VideoKey;
                const audioUrl = group.audioKey || group.AudioKey;

                return (
                  <div key={gId} className="mb-5 group-card-v2 shadow-sm rounded border overflow-hidden bg-white">
                    <div className="group-header p-4 bg-light border-bottom d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <FaLayerGroup className="text-primary" size={24} />
                          <h4 className="fw-bold mb-0">{group.title || group.Title || group.name || group.Name}</h4>
                          <Badge bg="secondary" className="px-3 py-2">Total: {group.sumScore || group.SumScore} pts</Badge>
                        </div>
                        {(group.description || group.Description) && <p className="text-muted mb-3">{group.description || group.Description}</p>}
                        
                        {(imgUrl || videoUrl || audioUrl) && (
                          <div className="group-media-preview d-flex gap-3 flex-wrap mt-3">
                            {imgUrl && <img src={imgUrl} alt="Group" className="img-thumbnail" style={{ maxWidth: '200px' }} />}
                            {videoUrl && <video src={videoUrl} controls className="img-thumbnail" style={{ maxWidth: '300px' }} />}
                            {audioUrl && <audio src={audioUrl} controls className="mt-auto" />}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleAddQuestion(group)}><FaPlus className="me-1" /> Add Question</Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => { setGroupToUpdate(group); setShowGroupEditModal(true); }}><FaEdit /></Button>
                        <Button variant="outline-danger" size="sm" onClick={() => { setGroupToDelete(group); setShowGroupDeleteModal(true); }}><FaTrash /></Button>
                      </div>
                    </div>
                    <div className="group-body p-4 bg-white">
                      {gQuestions.length === 0 ? (
                        <div className="text-center py-4 text-muted border rounded bg-light-subtle fst-italic">
                          No questions in this group yet.
                        </div>
                      ) : (
                        gQuestions.map((q, i) => renderQuestionCard(q, i))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      <CreateQuestionModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        sectionId={parseInt(sectionId)}
        groupId={targetGroupId}
        questionToUpdate={questionToUpdate}
        isAdmin={isAdmin}
      />

      <CreateQuizGroupModal
        show={showGroupEditModal}
        onClose={() => setShowGroupEditModal(false)}
        onSuccess={fetchData}
        quizSectionId={sectionId}
        groupToUpdate={groupToUpdate}
        isAdmin={isAdmin}
      />

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteQuestion} title="Delete Question?" message="This action cannot be undone." type="danger" />
      <ConfirmModal isOpen={showGroupDeleteModal} onClose={() => setShowGroupDeleteModal(false)} onConfirm={confirmDeleteGroup} title="Delete Group?" message="All questions in this group will also be deleted." type="danger" />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Success" message={successMessage} autoClose={true} />
      <NotificationModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} type={notification.type} message={notification.message} />
    </>
  );
}
