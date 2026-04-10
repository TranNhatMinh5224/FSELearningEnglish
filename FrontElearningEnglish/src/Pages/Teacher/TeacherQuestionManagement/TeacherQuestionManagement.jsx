import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Card, Badge } from "react-bootstrap";
import { FaPlus, FaArrowLeft, FaEdit, FaTrash, FaLayerGroup, FaRegListAlt } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import CreateQuestionModal from "../../../Components/Teacher/CreateQuestionModal/CreateQuestionModal";
import CreateQuizGroupModal from "../../../Components/Teacher/CreateQuizGroupModal/CreateQuizGroupModal"; // Import Group Modal
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
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
  
  // Auto-detect admin role from AuthContext
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
  
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]); // Store groups list
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [contextData, setContextData] = useState({ title: "", subtitle: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
  


  // Question Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionToUpdate, setQuestionToUpdate] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null); // Which group adding question to?

  // Question Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  // Group Modals (Edit/Delete)
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [groupToUpdate, setGroupToUpdate] = useState(null);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Success Modal states
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let questionsRes;
      let title = "";
      let subtitle = "";

      // 1. Fetch contextual info (Group or Section)
      if (groupId) {
        let gData = null;
        try {
          const groupRes = await quizService.getQuizGroupById(groupId);
          if (groupRes.data?.success) gData = groupRes.data.data;
        } catch (e) { console.warn("Teacher group fetch failed"); }

        if (!gData && isAdmin) {
          try {
            const adminGroupRes = await quizService.getAdminQuizGroupById(groupId);
            if (adminGroupRes.data?.success) gData = adminGroupRes.data.data;
          } catch (e) { console.error("Admin group fallback failed"); }
        }
        
        if (gData) {
          title = `Group: ${gData.name || gData.Name || "Untitled Group"}`;
          subtitle = gData.title || gData.Title;
        }

        // Fetch questions for group
        try {
          questionsRes = await questionService.getQuestionsByGroup(groupId);
        } catch (e) { console.error("Questions by group fetch failed"); }

      } else if (sectionId) {
        let sData = null;
        try {
          const sectionRes = await quizService.getQuizSectionById(sectionId);
          if (sectionRes.data?.success) sData = sectionRes.data.data;
        } catch (e) { console.warn("Teacher section fetch failed"); }

        if (!sData && isAdmin) {
          try {
            const adminSectionRes = await quizService.getAdminQuizSectionById(sectionId);
            if (adminSectionRes.data?.success) sData = adminSectionRes.data.data;
          } catch (e) { console.error("Admin section fallback failed"); }
        }

        if (sData) {
          title = `Section: ${sData.title || sData.Title || "Untitled Section"}`;
        }
        
        // Parallel fetch for questions and groups in section
        const fetchSectionContent = async () => {
          let qList = [];
          let gList = [];
          
          try {
            const qRes = await questionService.getQuestionsBySection(sectionId);
            if (qRes.data?.success) qList = Array.isArray(qRes.data.data) ? qRes.data.data : (qRes.data.data?.questions || []);
          } catch (e) { console.warn("Questions fetch failed"); }

          try {
            const gRes = await quizService.getQuizGroupsBySection(sectionId);
            if (gRes.data?.success) {
              const data = gRes.data.data;
              gList = Array.isArray(data) ? data : (data?.groups || []);
            }
          } catch (e) { console.warn("Teacher groups fetch failed"); }

          if (gList.length === 0 && isAdmin) {
            try {
              const adminGRes = await quizService.getAdminQuizGroupsBySection(sectionId);
              if (adminGRes.data?.success) {
                const data = adminGRes.data.data;
                gList = Array.isArray(data) ? data : (data?.groups || []);
              }
            } catch (e) { console.error("Admin groups fallback failed"); }
          }
          
          return { qList, gList };
        };

        const { qList, gList } = await fetchSectionContent();
        setQuestions(qList);
        setGroups(gList);
      }

      setContextData({ title, subtitle });

      // Fetch metadata for breadcrumbs (Robust)
      const metadataPromises = [
        teacherService.getCourseDetail(courseId),
        teacherService.getLessonById(lessonId)
      ];

      const [courseRes, lessonRes] = await Promise.all(metadataPromises);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);

      // Assessment metadata
      let assessmentData = null;
      try {
        const assessmentRes = await assessmentService.getTeacherAssessmentById(assessmentId);
        if (assessmentRes.data?.success) assessmentData = assessmentRes.data.data;
      } catch (e) { console.warn("Teacher assessment fetch failed"); }

      if (!assessmentData && isAdmin) {
        try {
          const adminAssessmentRes = await assessmentService.getAdminAssessmentById(assessmentId);
          if (adminAssessmentRes.data?.success) assessmentData = adminAssessmentRes.data.data;
        } catch (e) { console.error("Admin assessment fallback failed"); }
      }
      setAssessment(assessmentData);

      // Quiz metadata
      let quizData = null;
      try {
        const quizRes = await quizService.getTeacherQuizById(quizId);
        if (quizRes.data?.success) quizData = quizRes.data.data;
      } catch (e) { console.warn("Teacher quiz fetch failed"); }

      if (!quizData && isAdmin) {
        try {
          const adminQuizRes = await quizService.getAdminQuizById(quizId);
          if (adminQuizRes.data?.success) quizData = adminQuizRes.data.data;
        } catch (e) { console.error("Admin quiz fallback failed"); }
      }
      setQuiz(quizData);

    } catch (err) {
      console.error("Fetch Data Error:", err);
      setError("Không thể tải dữ liệu đầy đủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [sectionId, groupId, assessmentId, courseId, lessonId, quizId, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) {
      navigate("/home");
      return;
    }
    fetchData();
  }, [isAuthenticated, isTeacher, navigate, fetchData]);

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

  // --- Group Handlers ---
  const handleGroupEditSuccess = () => {
      setSuccessMessage("Cập nhật Group thành công!");
      setShowSuccessModal(true);
      fetchData();
  };

  const confirmDeleteGroup = async () => {
      if (!groupToDelete) return;
      try {
          const res = isAdmin
            ? await quizService.deleteAdminQuizGroup(groupToDelete.quizGroupId)
            : await quizService.deleteQuizGroup(groupToDelete.quizGroupId);
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


  // --- Common Handlers ---
  const handleAddQuestion = (targetGroup = null) => {
      setTargetGroupId(targetGroup ? targetGroup.quizGroupId : null); // If null, it's standalone (or new group creation context)
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
      const res = await questionService.deleteQuestion(questionToDelete.questionId);
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

  // --- Helpers for Display ---
  const standaloneQuestions = questions.filter(q => !q.quizGroupId);
  const questionsByGroup = {};
  questions.forEach(q => {
      if (q.quizGroupId) {
          if (!questionsByGroup[q.quizGroupId]) questionsByGroup[q.quizGroupId] = [];
          questionsByGroup[q.quizGroupId].push(q);
      }
  });

  const renderQuestionCard = (q, index, isGrouped = false) => {
      // Helper to render body content based on type
      const renderQuestionBody = () => {
          if (q.type === 5) { // Matching
              let pairs = [];
              try {
                  if (q.matchingPairs) pairs = q.matchingPairs; // from draft
                  else if (q.correctAnswersJson) pairs = JSON.parse(q.correctAnswersJson);
              } catch (e) { console.error("Error parsing matching pairs", e); }

              if (pairs.length > 0) {
                  return (
                      <div className="mt-2 bg-light p-2 rounded small">
                          {pairs.map((p, i) => (
                              <div key={i} className="d-flex align-items-center gap-2 mb-1">
                                  <span className="fw-bold text-dark">{p.key}</span>
                                  <span className="text-muted">➡</span>
                                  <span className="text-dark">{p.value}</span>
                              </div>
                          ))}
                      </div>
                  );
              }
          }
          
          if (q.type === 6) { // Ordering
              return (
                  <ol className="mt-2 ps-3 mb-0 small">
                      {q.options?.map((opt, idx) => (
                          <li key={idx} className="mb-1 text-dark">
                              {opt.text}
                          </li>
                      ))}
                  </ol>
              );
          }

          // Default (MCQ, FillBlank, etc.)
          return (
            <ul className="list-unstyled options-preview mb-0 small text-muted mt-2">
                {q.options?.map((opt, idx) => (
                    <li key={idx} className={`mb-1 ${opt.isCorrect ? "text-success fw-bold" : ""}`}>
                        {opt.isCorrect && "✓ "} {opt.text}
                    </li>
                ))}
            </ul>
          );
      };

      return (
        <Card key={q.questionId || q.tempId} className="mb-3 border-0 shadow-sm question-card">
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between">
                <div className="d-flex gap-3 w-100">
                    <div className="question-index text-center pt-1">
                        <span className="badge rounded-pill bg-secondary">#{index + 1}</span>
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Badge bg="info">{getQuestionTypeLabel(q.type)}</Badge>
                            <span className="text-muted small">Points: {q.points}</span>
                        </div>
                        <h6 className="question-stem mb-1 fw-bold text-break">{q.stemText}</h6>
                        {renderQuestionBody()}
                    </div>
                </div>

                <div className="action-buttons d-flex flex-column gap-2 justify-content-start ms-2">
                    <Button variant="light" size="sm" onClick={() => handleEditQuestion(q)} title="Sửa">
                    <FaEdit className="text-primary" />
                    </Button>
                    <Button variant="light" size="sm" onClick={() => handleDeleteQuestion(q)} title="Xóa">
                    <FaTrash className="text-danger" />
                    </Button>
                </div>
                </div>
            </Card.Body>
        </Card>
      );
  };

  return (
    <>
      <TeacherHeader />
      <div className="teacher-question-management-container">
        <Container>
          {/* Premium Header */}
          <div className="question-header-section">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div className="d-flex flex-column">
                <Breadcrumb
                  items={[
                    { label: "Quản lý khoá học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                    { label: course?.title || course?.Title || "Khoá học", path: `/teacher/course/${courseId}` },
                    { label: lesson?.title || lesson?.Title || "Bài học", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
                    { label: assessment?.title || assessment?.Title || "Quản lý bài tập", path: ROUTE_PATHS.TEACHER_QUIZ_ESSAY_MANAGEMENT(courseId, lessonId, moduleId, assessmentId) },
                    { label: quiz?.title || quiz?.Title || "Quản lý Quiz", path: ROUTE_PATHS.TEACHER_QUIZ_SECTION_MANAGEMENT(courseId, lessonId, moduleId, assessmentId, quizId) },
                    { label: "Quản lý câu hỏi", isCurrent: true }
                  ]}
                  showHomeIcon={true}
                />
                <h1 className="premium-gradient-text mt-3 mb-0">Quản lý kho câu hỏi</h1>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                {contextData.title && (
                   <div className="section-pill">
                     {contextData.title}
                   </div>
                )}
                <div className="header-stats-badge">
                  <FaRegListAlt />
                  <span>{questions.length} Câu hỏi</span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <Button variant="primary" className="premium-btn shadow-sm px-4 py-2" onClick={() => handleAddQuestion(null)}>
                  <FaPlus className="me-2" /> Thêm câu hỏi mới
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
             <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="question-content-area">
                
                {/* 1. Standalone Questions */}
                {standaloneQuestions.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-muted border-bottom pb-2 mb-3">Câu hỏi lẻ ({standaloneQuestions.length})</h5>
                        {standaloneQuestions.map((q, idx) => renderQuestionCard(q, idx))}
                    </div>
                )}

                {/* 2. Groups Display */}
                {groups.map((group) => {
                    const groupQuestions = questionsByGroup[group.quizGroupId] || [];
                    return (
                        <div key={group.quizGroupId} className="mb-5 group-container">
                            {/* Group Header Bar */}
                            <div className="group-header-bar bg-light border rounded p-3 mb-3 d-flex justify-content-between align-items-center shadow-sm" style={{borderLeft: '5px solid #0d6efd'}}>
                                <div className="flex-grow-1 me-3">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <FaLayerGroup className="text-primary"/>
                                        <Badge bg="secondary">Total: {group.sumScore} pts</Badge>
                                    </div>
                                    <div className="text-primary fw-bold" style={{
                                        fontSize: '0.95rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '2',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        lineHeight: '1.4'
                                    }} title={group.name}>
                                        {group.name}
                                    </div>
                                    {group.title && (
                                        <div className="text-muted small mt-1" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: '1',
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }} title={group.title}>
                                            {group.title}
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" size="sm" onClick={() => handleAddQuestion(group)}>
                                        <FaPlus className="me-1"/> Thêm câu hỏi vào nhóm
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={() => { setGroupToUpdate(group); setShowGroupEditModal(true); }}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => { setGroupToDelete(group); setShowGroupDeleteModal(true); }}>
                                        <FaTrash />
                                    </Button>
                                </div>
                            </div>

                            {/* Group Questions List (Indented) */}
                            <div className="group-questions-list ps-4 ms-2 border-start border-3 border-light">
                                {groupQuestions.length === 0 ? (
                                    <div className="text-muted fst-italic py-2 ps-3">Chưa có câu hỏi nào trong nhóm này.</div>
                                ) : (
                                    groupQuestions.map((q, idx) => renderQuestionCard(q, idx, true))
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Bulk Drafts */}
                {questions.length === 0 && groups.length === 0 && (
                    <div className="text-center py-5 text-muted bg-light rounded">
                        <p className="mb-3">Chưa có nội dung nào.</p>
                        <Button variant="primary" onClick={() => handleAddQuestion(null)}>Tạo nội dung đầu tiên</Button>
                    </div>
                )}
            </div>
          )}
        </Container>
      </div>

      {/* Question Modal */}
      <CreateQuestionModal 
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setQuestionToUpdate(null);
          setTargetGroupId(null);
        }}
        onSuccess={questionToUpdate ? handleUpdateSuccess : handleCreateSuccess}
        sectionId={sectionId ? parseInt(sectionId) : null}
        groupId={targetGroupId || (groupId ? parseInt(groupId) : null)}
        questionToUpdate={questionToUpdate}
        isAdmin={isAdmin}
      />
      
      {/* Group Modals */}
      <CreateQuizGroupModal
          show={showGroupEditModal}
          onClose={() => setShowGroupEditModal(false)}
          onSuccess={handleGroupEditSuccess}
          quizSectionId={sectionId}
          groupToUpdate={groupToUpdate}
          isAdmin={isAdmin}
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

      {/* Question Delete */}
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
    </>
  );
}
