import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "./TeacherLessonDetail.css";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { useAuth } from "../../../Context/AuthContext";
import { useModuleTypes } from "../../../hooks/useModuleTypes";
import { teacherService } from "../../../Services/teacherService";
import { assessmentService } from "../../../Services/assessmentService";
import { quizService } from "../../../Services/quizService";
import { essayService } from "../../../Services/essayService";
import { useAssets } from "../../../Context/AssetContext";
import CreateLessonModal from "../../../Components/Teacher/CreateLessonModal/CreateLessonModal";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import { LessonDetailSkeleton, AssessmentCardSkeleton } from "../../../Components/Common/Skeleton/LectureDetailSkeleton";
import CreateModuleModal from "../../../Components/Teacher/CreateModuleModal/CreateModuleModal";
import CreateAssessmentModal from "../../../Components/Teacher/CreateAssessmentModal/CreateAssessmentModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import ActionButtons from "../../../Components/Common/ActionButtons";
import { FaPlus, FaEdit } from "react-icons/fa";
import ImageWithIconFallback from "../../../Components/Common/ImageWithIconFallback/ImageWithIconFallback";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { PiBookOpenDuotone, PiLayoutDuotone, PiCardsDuotone, PiExamDuotone } from "react-icons/pi";

export default function TeacherLessonDetail() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles, isAuthenticated } = useAuth();
  const { isLecture, isFlashCard, isAssessment, isClickable } = useModuleTypes();
  const { getDefaultLessonImage } = useAssets();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [showUpdateModuleModal, setShowUpdateModuleModal] = useState(false);
  const [moduleToUpdate, setModuleToUpdate] = useState(null);
  const [loadingModuleDetail, setLoadingModuleDetail] = useState(false);
  const [showModuleSuccessModal, setShowModuleSuccessModal] = useState(false);
  const [showUpdateModuleSuccessModal, setShowUpdateModuleSuccessModal] = useState(false);
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [showCreateAssessmentSuccessModal, setShowCreateAssessmentSuccessModal] = useState(false);
  const [showUpdateAssessmentModal, setShowUpdateAssessmentModal] = useState(false);
  const [showUpdateAssessmentSuccessModal, setShowUpdateAssessmentSuccessModal] = useState(false);
  const [assessmentToUpdate, setAssessmentToUpdate] = useState(null);
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [deletingModule, setDeletingModule] = useState(false);
  const [showDeleteModuleSuccessModal, setShowDeleteModuleSuccessModal] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleContent, setModuleContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [assessmentTypes, setAssessmentTypes] = useState({});

  const isAdmin = roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin", "Admin"].includes(roleName);
  });

  const isTeacher = (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return roleName === "Teacher";
  })) || user?.teacherSubscription?.isTeacher === true || isAdmin;

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setShowSuccessModal(true);
    fetchLessonDetail();
  };

  const handleCreateModuleSuccess = () => {
    setShowCreateModuleModal(false);
    setShowModuleSuccessModal(true);
    fetchModules();
  };

  const fetchCourseDetail = useCallback(async () => {
    try {
      const response = await teacherService.getCourseDetail(courseId);
      if (response.data?.success && response.data?.data) {
        setCourse(response.data.data);
      }
    } catch (err) { console.error(err); }
  }, [courseId]);

  const fetchLessonDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teacherService.getLessonById(lessonId);
      if (response.data?.success && response.data?.data) {
        setLesson(response.data.data);
      } else { setError("Không thể tải thông tin chương học"); }
    } catch (err) { setError("Không thể tải thông tin chương học"); }
    finally { setLoading(false); }
  }, [lessonId]);

  const fetchModules = useCallback(async () => {
    try {
      const response = await teacherService.getModulesByLesson(lessonId);
      if (response.data?.success && response.data?.data) {
        const modulesList = response.data.data || [];
        const modulesWithImages = await Promise.all(
          modulesList.map(async (m) => {
            try {
              const res = await teacherService.getModuleById(m.moduleId || m.ModuleId);
              return { ...m, imageUrl: res.data?.data?.imageUrl || m.imageUrl };
            } catch { return m; }
          })
        );
        setModules(modulesWithImages.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      }
    } catch { setModules([]); }
  }, [lessonId]);

  const handleModuleClick = useCallback((module) => {
    const typeNum = parseInt(module.contentType || module.ContentType);
    const moduleId = module.moduleId || module.ModuleId;

    if (isLecture(typeNum)) {
      navigate(ROUTE_PATHS.TEACHER_CREATE_LECTURE(courseId, lessonId, moduleId));
    } else if (isFlashCard(typeNum)) {
      navigate(ROUTE_PATHS.TEACHER_CREATE_FLASHCARD(courseId, lessonId, moduleId));
    } else if (isAssessment(typeNum)) {
      setSelectedModule(module);
      setLoadingContent(true);
      assessmentService.getTeacherAssessmentsByModule(moduleId)
        .then(res => {
          const assessments = res.data?.data || [];
          setModuleContent(assessments);
          const typePromises = assessments.map(async (a) => {
            const aid = a.assessmentId || a.AssessmentId;
            const [q, e] = await Promise.all([
              quizService.getTeacherQuizzesByAssessment(aid),
              essayService.getTeacherEssaysByAssessment(aid)
            ]);
            return { aid, hasQuiz: q.data?.data?.length > 0, hasEssay: e.data?.data?.length > 0 };
          });
          Promise.all(typePromises).then(types => {
            const map = {};
            types.forEach(t => map[t.aid] = t);
            setAssessmentTypes(map);
          });
        })
        .finally(() => setLoadingContent(false));
    }
  }, [courseId, lessonId, isLecture, isFlashCard, isAssessment, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !isTeacher) { navigate("/home"); return; }
    fetchCourseDetail(); fetchLessonDetail(); fetchModules();
  }, [isAuthenticated, isTeacher, navigate, fetchCourseDetail, fetchLessonDetail, fetchModules]);

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      setDeletingModule(true);
      await teacherService.deleteModule(moduleToDelete.moduleId || moduleToDelete.ModuleId);
      setShowDeleteModuleModal(false);
      setShowDeleteModuleSuccessModal(true);
      fetchModules();
    } catch (err) { setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa module" }); }
    finally { setDeletingModule(false); }
  };

  const handleDeleteModuleClick = (module) => { setModuleToDelete(module); setShowDeleteModuleModal(true); };

  if (!isAuthenticated || !isTeacher) return null;

  const lessonTitle = lesson?.title || lesson?.Title || "Bài học";
  const lessonDescription = lesson?.description || lesson?.Description || "";

  return (
    <>
      <TeacherHeader />
      <div className="teacher-lesson-detail-container">
        <Container fluid className="p-0 content-wrapper">
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: "Quản lý khóa học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                { label: course?.title || course?.Title || courseId, path: `/teacher/course/${courseId}` },
                {
                  label: lessonTitle,
                  path: !selectedModule ? undefined : `/teacher/course/${courseId}/lesson/${lessonId}`,
                  onClick: selectedModule ? () => { setSelectedModule(null); setModuleContent([]); navigate(`/teacher/course/${courseId}/lesson/${lessonId}`, { replace: true }); } : undefined,
                  isCurrent: !selectedModule
                },
                ...(selectedModule ? [{ label: selectedModule.name || selectedModule.Name || "Module", isCurrent: true }] : [])
              ]}
              showHomeIcon={true}
              className="breadcrumb-compact"
            />
          </div>

          <div className="teacher-main-page-content">
            {loading ? (
              <LessonDetailSkeleton />
            ) : error || !lesson ? (
              <div className="error-message text-center py-5">{error || "Không tìm thấy chương học"}</div>
            ) : (
              <Row>
                <Col md={4} className="lesson-info-column">
                  <div className="lesson-info-card">
                    <div className="lesson-image-wrapper">
                      <ImageWithIconFallback imageUrl={lesson.imageUrl || lesson.ImageUrl} fallbackImageUrl={getDefaultLessonImage()} icon={<PiBookOpenDuotone size={64} />} alt={lessonTitle} className="lesson-image-main" />
                    </div>
                    <div className="lesson-info-content">
                      <h2 className="lesson-title">{lessonTitle}</h2>
                      <p className="lesson-description">{lessonDescription}</p>
                      <button className="update-lesson-btn" onClick={() => setShowUpdateModal(true)}>
                        <FaEdit className="btn-icon" /> Cập nhật chương học
                      </button>
                    </div>
                  </div>
                </Col>

                <Col md={8} className="modules-column">
                  {selectedModule ? (
                    <div className="modules-section">
                      <div className="module-content-header">
                        <h3 className="module-content-title">{selectedModule.name || selectedModule.Name || "Bài học"}</h3>
                      </div>
                      {loadingContent ? (
                        <div className="module-content-list">
                          {[...Array(3)].map((_, i) => <AssessmentCardSkeleton key={i} />)}
                        </div>
                      ) : (
                        <>
                          <div className="module-content-list">
                            {moduleContent.map((item, index) => {
                              const aid = item.assessmentId || item.AssessmentId;
                              const typeInfo = assessmentTypes[aid] || {};

                              // Bổ sung các trường thông tin bị thiếu
                              const description = item.description || item.Description || "";
                              const isPublished = item.isPublished ?? item.IsPublished ?? true;
                              const openAt = item.openAt || item.OpenAt;
                              const dueAt = item.dueAt || item.DueAt;

                              const formatDateTime = (dateStr) => {
                                if (!dateStr) return null;
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) return null;
                                return date.toLocaleString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                });
                              };

                              return (
                                <div key={aid || index} className="content-item" onClick={() => navigate(ROUTE_PATHS.TEACHER_QUIZ_ESSAY_MANAGEMENT(courseId, lessonId, selectedModule.moduleId || selectedModule.ModuleId, aid))}>
                                  <div className="content-item-info">
                                    <div className="item-header">
                                      <h4 className="content-item-title">{item.title || item.Title}</h4>
                                      {description && <p className="content-item-description" style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>{description}</p>}
                                      <div className="item-badges">
                                        {typeInfo.hasQuiz && <span className="badge-quiz">QUIZ</span>}
                                        {typeInfo.hasEssay && <span className="badge-essay">ESSAY</span>}
                                        {!typeInfo.hasQuiz && !typeInfo.hasEssay && <span className="no-content-badge">Chưa có nội dung</span>}
                                      </div>
                                    </div>
                                    <div className="item-meta-container">
                                      <div className="item-meta-row main-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '0.85rem' }}>
                                        {item.timeLimit && <span><strong>Thời gian:</strong> {item.timeLimit}</span>}
                                        {openAt && <span><strong>Bắt đầu:</strong> {formatDateTime(openAt)}</span>}
                                        {dueAt && <span><strong>Kết thúc:</strong> {formatDateTime(dueAt)}</span>}
                                      </div>
                                      <div className="item-meta-row status-row" style={{ marginTop: '5px', fontSize: '0.85rem' }}>
                                        <span>
                                          <strong>Trạng thái: </strong>
                                          <span className={`status-tag ${isPublished ? 'published' : 'draft'}`} style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            backgroundColor: isPublished ? '#ecfdf5' : '#f3f4f6',
                                            color: isPublished ? '#10b981' : '#6b7280',
                                            border: `1px solid ${isPublished ? '#10b981' : '#d1d5db'}`
                                          }}>
                                            {isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <ActionButtons
                                    onUpdate={(e) => { e.stopPropagation(); setAssessmentToUpdate(item); setShowUpdateAssessmentModal(true); }}
                                    onDelete={(e) => e.stopPropagation()}
                                    updateText="Sửa" showUpdateText={true}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <button className="module-create-btn assessment-btn" onClick={() => setShowCreateAssessmentModal(true)}>
                            <FaPlus className="add-icon" /> Thêm bài tập
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="modules-section">
                      <div className="modules-header"><h3>Danh sách bài học</h3></div>
                      <div className="modules-list">
                        {modules.map((m, i) => (
                          <div key={m.moduleId || m.ModuleId || i} className="module-item" onClick={() => isClickable(m.contentType || m.ContentType) && handleModuleClick(m)}>
                            <div className="module-item-content">
                              <ImageWithIconFallback imageUrl={m.imageUrl || m.ImageUrl} icon={<PiLayoutDuotone size={24} />} alt={m.name || m.Name} className="module-image" />
                              <div className="module-info">
                                <span className="module-name">{m.name || m.Name}</span>
                                <span className="module-type">{m.contentTypeName || m.ContentTypeName}</span>
                              </div>
                            </div>
                            <div className="module-actions" onClick={(e) => e.stopPropagation()}>
                              <ActionButtons
                                onUpdate={async (e) => {
                                  e.stopPropagation();
                                  setLoadingModuleDetail(true);
                                  try {
                                    const res = await teacherService.getModuleById(m.moduleId || m.ModuleId);
                                    setModuleToUpdate(res.data?.data || m);
                                    setShowUpdateModuleModal(true);
                                  } catch { setModuleToUpdate(m); setShowUpdateModuleModal(true); }
                                  finally { setLoadingModuleDetail(false); }
                                }}
                                onDelete={(e) => { e.stopPropagation(); handleDeleteModuleClick(m); }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="add-module-btn-main" onClick={() => setShowCreateModuleModal(true)}><FaPlus className="add-icon" /> Thêm bài giảng</button>
                    </div>
                  )}
                </Col>
              </Row>
            )}
          </div>
        </Container>
      </div>

      <CreateLessonModal show={showUpdateModal} onClose={() => setShowUpdateModal(false)} onSuccess={handleUpdateSuccess} courseId={courseId} lessonData={lesson} isUpdateMode={true} />
      <CreateModuleModal show={showCreateModuleModal} onClose={() => setShowCreateModuleModal(false)} onSuccess={handleCreateModuleSuccess} lessonId={lessonId} />
      <CreateModuleModal show={showUpdateModuleModal} onClose={() => { setShowUpdateModuleModal(false); setModuleToUpdate(null); }} onSuccess={() => { setShowUpdateModuleModal(false); setShowUpdateModuleSuccessModal(true); fetchModules(); }} lessonId={lessonId} moduleData={moduleToUpdate} isUpdateMode={true} />
      <CreateAssessmentModal show={showCreateAssessmentModal} onClose={() => setShowCreateAssessmentModal(false)} onSuccess={() => { setShowCreateAssessmentModal(false); setShowCreateAssessmentSuccessModal(true); if (selectedModule) handleModuleClick(selectedModule); }} moduleId={selectedModule?.moduleId || selectedModule?.ModuleId} />
      <CreateAssessmentModal show={showUpdateAssessmentModal} onClose={() => { setShowUpdateAssessmentModal(false); setAssessmentToUpdate(null); }} onSuccess={() => { setShowUpdateAssessmentModal(false); setShowUpdateAssessmentSuccessModal(true); if (selectedModule) handleModuleClick(selectedModule); }} moduleId={selectedModule?.moduleId || selectedModule?.ModuleId} assessmentData={assessmentToUpdate} isUpdateMode={true} />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Thành công" message="Cập nhật thành công!" autoClose={true} autoCloseDelay={2000} />
      <SuccessModal isOpen={showModuleSuccessModal} onClose={() => setShowModuleSuccessModal(false)} title="Thành công" message="Tạo bài học thành công!" autoClose={true} autoCloseDelay={2000} />
      <SuccessModal isOpen={showUpdateModuleSuccessModal} onClose={() => setShowUpdateModuleSuccessModal(false)} title="Thành công" message="Cập nhật thành công!" autoClose={true} autoCloseDelay={2000} />
      <SuccessModal isOpen={showCreateAssessmentSuccessModal} onClose={() => setShowCreateAssessmentSuccessModal(false)} title="Thành công" message="Tạo bài tập thành công!" autoClose={true} autoCloseDelay={2000} />
      <SuccessModal isOpen={showUpdateAssessmentSuccessModal} onClose={() => setShowUpdateAssessmentSuccessModal(false)} title="Thành công" message="Cập nhật thành công!" autoClose={true} autoCloseDelay={2000} />
      <SuccessModal isOpen={showDeleteModuleSuccessModal} onClose={() => setShowDeleteModuleSuccessModal(false)} title="Thành công" message="Xóa thành công!" autoClose={true} autoCloseDelay={2000} />

      <ConfirmModal isOpen={showDeleteModuleModal} onClose={() => { setShowDeleteModuleModal(false); setModuleToDelete(null); }} onConfirm={confirmDeleteModule} title="Xác nhận xóa" message="Bạn có chắc chắn muốn xóa bài học này không?" itemName={moduleToDelete ? (moduleToDelete.name || moduleToDelete.Name) : ""} type="delete" confirmText="Xác nhận xóa" loading={deletingModule} />
      <NotificationModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} type={notification.type} message={notification.message} />
    </>
  );
}
