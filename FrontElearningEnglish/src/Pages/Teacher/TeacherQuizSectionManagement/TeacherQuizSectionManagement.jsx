import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaList, FaArrowLeft, FaRegListAlt } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { useAuth } from "../../../Context/AuthContext";
import { quizService } from "../../../Services/quizService";
import { teacherService } from "../../../Services/teacherService";
import { assessmentService } from "../../../Services/assessmentService";
import CreateQuizSectionModal from "../../../Components/Teacher/CreateQuizSectionModal/CreateQuizSectionModal";
import CreateQuizGroupModal from "../../../Components/Teacher/CreateQuizGroupModal/CreateQuizGroupModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import "./TeacherQuizSectionManagement.css";

export default function TeacherQuizSectionManagement() {
  const { courseId, lessonId, moduleId, assessmentId, quizId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sections, setSections] = useState([]);
  const [, setSectionGroups] = useState({}); // { sectionId: [groups] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  // Section modals
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const [showCreateSectionSuccessModal, setShowCreateSectionSuccessModal] = useState(false);
  const [showUpdateSectionModal, setShowUpdateSectionModal] = useState(false);
  const [showUpdateSectionSuccessModal, setShowUpdateSectionSuccessModal] = useState(false);
  const [sectionToUpdate, setSectionToUpdate] = useState(null);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [showDeleteSectionSuccessModal, setShowDeleteSectionSuccessModal] = useState(false);
  const [deletingSection, setDeletingSection] = useState(false);

  // Group modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedSectionForGroup, setSelectedSectionForGroup] = useState(null);
  const [showCreateGroupSuccessModal, setShowCreateGroupSuccessModal] = useState(false);
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
  const [showUpdateGroupSuccessModal, setShowUpdateGroupSuccessModal] = useState(false);
  const [groupToUpdate, setGroupToUpdate] = useState(null);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showDeleteGroupSuccessModal, setShowDeleteGroupSuccessModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

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
      } catch (e) { console.warn("Teacher assessment fetch failed"); }

      if (!assessmentData && isAdmin) {
        try {
          const adminAssessmentRes = await assessmentService.getAdminAssessmentById(assessmentId);
          if (adminAssessmentRes.data?.success) assessmentData = adminAssessmentRes.data.data;
        } catch (e) { console.error("Admin assessment fallback failed"); }
      }
      setAssessment(assessmentData);

      // Try teacher quiz first, fallback to admin
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

      const [courseRes, lessonRes] = await Promise.all(metadataPromises);
      if (courseRes.data?.success) setCourse(courseRes.data.data);
      if (lessonRes.data?.success) setLesson(lessonRes.data.data);

      // Fetch sections (Robust)
      let sectionsData = [];
      try {
        const sectionsRes = await quizService.getQuizSectionsByQuiz(quizId);
        if (sectionsRes.data?.success) {
          const data = sectionsRes.data.data;
          sectionsData = Array.isArray(data) ? data : (data?.sections || []);
        }
      } catch (e) { console.warn("Teacher sections fetch failed"); }

      if (sectionsData.length === 0 && isAdmin) {
        try {
          const adminSectionsRes = await quizService.getAdminQuizSectionsByQuiz(quizId);
          if (adminSectionsRes.data?.success) {
            const data = adminSectionsRes.data.data;
            sectionsData = Array.isArray(data) ? data : (data?.sections || []);
          }
        } catch (e) { console.error("Admin sections fallback failed"); }
      }
      setSections(sectionsData);

      // Fetch groups for each section (Robust)
      const groupsMap = {};
      await Promise.all(sectionsData.map(async (section) => {
        const sectionId = section.quizSectionId || section.QuizSectionId;
        let groups = [];
        try {
          const groupsRes = await quizService.getQuizGroupsBySection(sectionId);
          if (groupsRes.data?.success) {
            const data = groupsRes.data.data;
            groups = Array.isArray(data) ? data : (data?.groups || []);
          }
        } catch (e) { console.warn(`Teacher groups fetch failed for section ${sectionId}`); }

        if (groups.length === 0 && isAdmin) {
          try {
            const adminGroupsRes = await quizService.getAdminQuizGroupsBySection(sectionId);
            if (adminGroupsRes.data?.success) {
              const data = adminGroupsRes.data.data;
              groups = Array.isArray(data) ? data : (data?.groups || []);
            }
          } catch (e) { console.error(`Admin groups fallback failed for section ${sectionId}`); }
        }
        groupsMap[sectionId] = groups;
      }));
      setSectionGroups(groupsMap);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [quizId, assessmentId, courseId, lessonId, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || (!isTeacher && !isAdmin)) {
      navigate("/home");
      return;
    }

    fetchData();
  }, [isAuthenticated, isTeacher, isAdmin, navigate, fetchData]);

  // Navigation handlers
  const handleManageQuestionsSection = (sectionId) => {
    navigate(ROUTE_PATHS.TEACHER_QUESTION_MANAGEMENT_SECTION(courseId, lessonId, moduleId, assessmentId, quizId, sectionId));
  };

  // Section handlers
  const handleCreateSectionSuccess = () => {
    setShowCreateSectionModal(false);
    setShowCreateSectionSuccessModal(true);
    fetchData();
  };

  const handleEditSection = (section) => {
    setSectionToUpdate(section);
    setShowUpdateSectionModal(true);
  };

  const handleUpdateSectionSuccess = () => {
    setShowUpdateSectionModal(false);
    setSectionToUpdate(null);
    setShowUpdateSectionSuccessModal(true);
    fetchData();
  };

  const handleDeleteSectionClick = (section) => {
    setSectionToDelete(section);
    setShowDeleteSectionModal(true);
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    setDeletingSection(true);
    try {
      const sectionId = sectionToDelete.quizSectionId || sectionToDelete.QuizSectionId;
      const response = isAdmin
        ? await quizService.deleteAdminQuizSection(sectionId)
        : await quizService.deleteQuizSection(sectionId);

      if (response.data?.success) {
        setShowDeleteSectionModal(false);
        setSectionToDelete(null);
        setShowDeleteSectionSuccessModal(true);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Xóa Section thất bại");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa Section";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeletingSection(false);
    }
  };

  // Group handlers
  const handleCreateGroupSuccess = () => {
    setShowCreateGroupModal(false);
    setSelectedSectionForGroup(null);
    setShowCreateGroupSuccessModal(true);
    fetchData();
  };

  const handleUpdateGroupSuccess = () => {
    setShowUpdateGroupModal(false);
    setGroupToUpdate(null);
    setShowUpdateGroupSuccessModal(true);
    fetchData();
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    setDeletingGroup(true);
    try {
      const groupId = groupToDelete.quizGroupId || groupToDelete.QuizGroupId;
      const response = isAdmin
        ? await quizService.deleteAdminQuizGroup(groupId)
        : await quizService.deleteQuizGroup(groupId);

      if (response.data?.success) {
        setShowDeleteGroupModal(false);
        setGroupToDelete(null);
        setShowDeleteGroupSuccessModal(true);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Xóa Group thất bại");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa Group";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeletingGroup(false);
    }
  };

  if (!isAuthenticated || (!isTeacher && !isAdmin)) {
    return null;
  }

  if (loading) {
    return (
      <>
        <TeacherHeader />
        <div className="teacher-quiz-section-management-container">
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
        <div className="teacher-quiz-section-management-container">
          <Container>
            <div className="alert alert-danger text-center">{error}</div>
          </Container>
        </div>
      </>
    );
  }

  const quizTitle = quiz?.title || quiz?.Title || "Quiz";

  return (
    <>
      <TeacherHeader />
      <div className="teacher-quiz-section-management-container">
        <Container>
          {/* Premium Header */}
          <div className="quiz-section-management-header">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div className="d-flex flex-column">
                <Breadcrumb
                  items={[
                    { label: "Quản lý khoá học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                    { label: course?.title || course?.Title || "Khoá học", path: `/teacher/course/${courseId}` },
                    { label: lesson?.title || lesson?.Title || "Bài học", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
                    { label: assessment?.title || assessment?.Title || "Quản lý bài tập", path: ROUTE_PATHS.TEACHER_QUIZ_ESSAY_MANAGEMENT(courseId, lessonId, moduleId, assessmentId) },
                    { label: "Quản lý Quiz", isCurrent: true }
                  ]}
                  showHomeIcon={true}
                />
                <h1 className="premium-gradient-text mt-3 mb-0">Thiết lập cấu trúc Quiz: {quizTitle}</h1>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="header-stats-badge">
                  <FaRegListAlt />
                  <span>{sections.length} Sections</span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <button
                className="premium-btn-primary d-flex align-items-center gap-2"
                onClick={() => setShowCreateSectionModal(true)}
              >
                <FaPlus /> Thêm Section mới
              </button>
            </div>
          </div>

          {/* Sections List */}
          {sections.length === 0 ? (
            <div className="text-center text-muted py-5">
              <p>Chưa có Section nào. Hãy tạo Section đầu tiên!</p>
            </div>
          ) : (
            <div className="sections-list">
              {sections.map((section) => {
                const sectionId = section.quizSectionId || section.QuizSectionId;
                const sectionTitle = section.title || section.Title || "Untitled Section";
                const sectionDescription = section.description || section.Description;

                return (
                  <div key={sectionId} className="section-card mb-4">
                    <div className="section-header">
                      <div className="section-info">
                        <h3 
                            className="section-title text-primary cursor-pointer" 
                            onClick={() => handleManageQuestionsSection(sectionId)}
                            style={{cursor: 'pointer'}}
                        >
                            {sectionTitle}
                        </h3>
                        {sectionDescription && (
                          <p className="section-description text-muted">{sectionDescription}</p>
                        )}
                      </div>
                      <div className="section-actions">
                        <button
                          className="btn btn-primary text-white me-2"
                          onClick={() => handleManageQuestionsSection(sectionId)}
                          title="Quản lý nội dung (Câu hỏi & Nhóm)"
                        >
                          <FaList className="me-1" /> Quản lý nội dung
                        </button>
                        <button
                          className="btn btn-edit-section"
                          onClick={() => handleEditSection(section)}
                          title="Sửa Section"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-delete-section"
                          onClick={() => handleDeleteSectionClick(section)}
                          title="Xóa Section"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      {/* Create Section Modal */}
      {quizId && (
        <CreateQuizSectionModal
          show={showCreateSectionModal}
          onClose={() => setShowCreateSectionModal(false)}
          onSuccess={handleCreateSectionSuccess}
          quizId={parseInt(quizId)}
          isAdmin={isAdmin}
        />
      )}

      {/* Update Section Modal */}
      {quizId && sectionToUpdate && (
        <CreateQuizSectionModal
          show={showUpdateSectionModal}
          onClose={() => {
            setShowUpdateSectionModal(false);
            setSectionToUpdate(null);
          }}
          onSuccess={handleUpdateSectionSuccess}
          quizId={parseInt(quizId)}
          sectionToUpdate={sectionToUpdate}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Section Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteSectionModal}
        onClose={() => {
          if (!deletingSection) {
            setShowDeleteSectionModal(false);
            setSectionToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteSection}
        title="Bạn chắc chắn muốn xóa section này chứ?"
        message="Hành động này sẽ xóa tất cả groups và questions trong section này. Hành động này không thể hoàn tác."
        confirmText={deletingSection ? "Đang xóa..." : "Xác nhận"}
        cancelText="Hủy"
        type="danger"
        disabled={deletingSection}
      />

      {/* Create Group Modal */}
      {selectedSectionForGroup && (
        <CreateQuizGroupModal
          show={showCreateGroupModal}
          onClose={() => {
            setShowCreateGroupModal(false);
            setSelectedSectionForGroup(null);
          }}
          onSuccess={handleCreateGroupSuccess}
          quizSectionId={selectedSectionForGroup.quizSectionId || selectedSectionForGroup.QuizSectionId}
          isAdmin={isAdmin}
        />
      )}

      {/* Update Group Modal */}
      {groupToUpdate && (
        <CreateQuizGroupModal
          show={showUpdateGroupModal}
          onClose={() => {
            setShowUpdateGroupModal(false);
            setGroupToUpdate(null);
          }}
          onSuccess={handleUpdateGroupSuccess}
          quizSectionId={groupToUpdate.quizSectionId || groupToUpdate.QuizSectionId}
          groupToUpdate={groupToUpdate}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteGroupModal}
        onClose={() => {
          if (!deletingGroup) {
            setShowDeleteGroupModal(false);
            setGroupToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteGroup}
        title="Bạn chắc chắn muốn xóa group này chứ?"
        message="Hành động này sẽ xóa tất cả questions trong group này. Hành động này không thể hoàn tác."
        confirmText={deletingGroup ? "Đang xóa..." : "Xác nhận"}
        cancelText="Hủy"
        type="danger"
        disabled={deletingGroup}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        message={notification.message}
      />

      {/* Success Modals */}
      <SuccessModal
        isOpen={showCreateSectionSuccessModal}
        onClose={() => setShowCreateSectionSuccessModal(false)}
        title="Tạo Section thành công"
        message="Section đã được tạo thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showUpdateSectionSuccessModal}
        onClose={() => setShowUpdateSectionSuccessModal(false)}
        title="Cập nhật Section thành công"
        message="Section đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showDeleteSectionSuccessModal}
        onClose={() => setShowDeleteSectionSuccessModal(false)}
        title="Xóa Section thành công"
        message="Section đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showCreateGroupSuccessModal}
        onClose={() => setShowCreateGroupSuccessModal(false)}
        title="Tạo Group thành công"
        message="Group đã được tạo thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showUpdateGroupSuccessModal}
        onClose={() => setShowUpdateGroupSuccessModal(false)}
        title="Cập nhật Group thành công"
        message="Group đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <SuccessModal
        isOpen={showDeleteGroupSuccessModal}
        onClose={() => setShowDeleteGroupSuccessModal(false)}
        title="Xóa Group thành công"
        message="Group đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />
    </>
  );
}

