import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "./AdminLessonDetail.css";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { useAuth } from "../../../Context/AuthContext";
import { useModuleTypes } from "../../../hooks/useModuleTypes";
import { adminService } from "../../../Services/adminService";
import { assessmentService } from "../../../Services/assessmentService";
import { quizService } from "../../../Services/quizService";
import { essayService } from "../../../Services/essayService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useAssets } from "../../../Context/AssetContext";
import CreateLessonModal from "../../../Components/Teacher/CreateLessonModal/CreateLessonModal";
import CreateModuleModal from "../../../Components/Teacher/CreateModuleModal/CreateModuleModal";
import CreateAssessmentModal from "../../../Components/Teacher/CreateAssessmentModal/CreateAssessmentModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import ActionButtons from "../../../Components/Common/ActionButtons";
import { FaPlus, FaEdit } from "react-icons/fa";
import { PiBookOpenFill, PiLayoutDuotone, PiCardsDuotone, PiExamDuotone, PiBookOpenDuotone, PiTrayDuotone } from "react-icons/pi";
import ImageWithIconFallback from "../../../Components/Common/ImageWithIconFallback/ImageWithIconFallback";

export default function AdminLessonDetail() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roles, isAuthenticated } = useAuth();
  const { isLecture, isFlashCard, isAssessment, isClickable, getModuleTypePath } = useModuleTypes();
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

  // Module content state
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleContent, setModuleContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");

  const isAdmin = roles.some(role => ["SuperAdmin", "ContentAdmin"].includes(role));

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setShowSuccessModal(true);
    fetchLessonDetail(); // Refresh lesson data
  };

  const handleModuleNotificationClose = () => {
    setNotification({ ...notification, isOpen: false });
  };

  const handleCreateModuleSuccess = () => {
    setShowCreateModuleModal(false);
    setShowModuleSuccessModal(true);
    fetchModules(); // Refresh modules list
  };

  const fetchCourseDetail = useCallback(async () => {
    try {
      const response = await adminService.getCourseContent(courseId);
      if (response.data?.success && response.data?.data) {
        setCourse(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching course detail:", err);
    }
  }, [courseId]);

  const fetchLessonDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getLessonDetail(lessonId);

      if (response.data?.success && response.data?.data) {
        setLesson(response.data.data);
      } else {
        setError("Không thể tải thông tin chương học");
      }
    } catch (err) {
      console.error("Error fetching lesson detail:", err);
      setError("Không thể tải thông tin chương học");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const fetchModules = useCallback(async () => {
    try {
      const response = await adminService.getModulesByLesson(lessonId);
      if (response.data?.success && response.data?.data) {
        const modulesData = response.data.data;
        const modulesList = Array.isArray(modulesData) ? modulesData : [];

        // Fetch imageUrl cho từng module từ API chi tiết
        const modulesWithImages = await Promise.all(
          modulesList.map(async (module) => {
            try {
              const moduleId = module.moduleId || module.ModuleId;
              const detailResponse = await adminService.getModuleById(moduleId);

              if (detailResponse.data?.success && detailResponse.data?.data) {
                const detailData = detailResponse.data.data;
                // Merge imageUrl từ detail vào module
                return {
                  ...module,
                  imageUrl: detailData.imageUrl || detailData.ImageUrl || module.imageUrl || module.ImageUrl,
                  ImageUrl: detailData.imageUrl || detailData.ImageUrl || module.imageUrl || module.ImageUrl,
                };
              }
              return module;
            } catch (err) {
              console.error(`Error fetching module ${module.moduleId || module.ModuleId} detail:`, err);
              return module;
            }
          })
        );

        // Sort by contentType then orderIndex
        const sortedModules = modulesWithImages.sort((a, b) => {
          const typeA = a.contentType || a.ContentType || 0;
          const typeB = b.contentType || b.ContentType || 0;
          if (typeA !== typeB) return typeA - typeB;

          const orderA = a.orderIndex || a.OrderIndex || 0;
          const orderB = b.orderIndex || b.OrderIndex || 0;
          return orderA - orderB;
        });

        setModules(sortedModules);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
      setModules([]);
    }
  }, [lessonId]);

  // Handle module click - navigate to dedicated management page
  const handleModuleClick = useCallback((module) => {
    const contentTypeValue = module.contentType || module.ContentType;
    const contentTypeNum = typeof contentTypeValue === 'number' ? contentTypeValue : parseInt(contentTypeValue);
    const moduleId = module.moduleId || module.ModuleId;

    if (isLecture(contentTypeNum)) {
      navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/lecture/manage`);
    } else if (isFlashCard(contentTypeNum)) {
      navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/flashcard/manage`);
    } else if (isAssessment(contentTypeNum)) {
      setSelectedModule(module);
      setLoadingContent(true);
      setContentError("");

      assessmentService.getAdminAssessmentsByModule(moduleId)
        .then(response => {
          if (response.data?.success && response.data?.data) {
            setModuleContent(response.data.data || []);
          } else {
            setContentError("Không thể tải danh sách assessments");
            setModuleContent([]);
          }
        })
        .catch(error => {
          console.error("Error fetching content:", error);
          setContentError("Có lỗi xảy ra khi tải danh sách");
          setModuleContent([]);
        })
        .finally(() => {
          setLoadingContent(false);
        });
    }
  }, [courseId, lessonId, isLecture, isFlashCard, isAssessment, navigate, getModuleTypePath]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/home");
      return;
    }

    fetchCourseDetail();
    fetchLessonDetail();
    fetchModules();
  }, [isAuthenticated, isAdmin, navigate, fetchCourseDetail, fetchLessonDetail, fetchModules]);

  // Handle auto-selecting module from query param (Only for Assessment since others navigate away)
  useEffect(() => {
    const moduleIdParam = searchParams.get("moduleId");
    
    // Check if we need to sync state with URL
    const currentSelectedId = selectedModule ? (selectedModule.moduleId || selectedModule.ModuleId).toString() : null;
    
    if (moduleIdParam) {
      // If URL has moduleId but state doesn't match, sync it
      if (currentSelectedId !== moduleIdParam && modules.length > 0) {
        const targetModule = modules.find(
          (m) => (m.moduleId || m.ModuleId).toString() === moduleIdParam
        );
        if (targetModule) {
          const type = targetModule.contentType || targetModule.ContentType;
          if (isAssessment(type)) {
            handleModuleClick(targetModule);
          }
        }
      }
    }
  }, [searchParams, modules, selectedModule, handleModuleClick, isAssessment]);


  const handleDeleteModuleClick = (module) => {
    setModuleToDelete(module);
    setShowDeleteModuleModal(true);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;

    try {
      setDeletingModule(true);
      const moduleId = moduleToDelete.moduleId || moduleToDelete.ModuleId;
      const response = await adminService.deleteModule(moduleId);

      if (response.status === 204 || response.data?.success) {
        setShowDeleteModuleModal(false);
        setShowDeleteModuleSuccessModal(true);
        setModuleToDelete(null);
        fetchModules();
        fetchLessonDetail();
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa module";
      setNotification({ isOpen: true, type: "error", message: errorMessage });
    } finally {
      setDeletingModule(false);
    }
  };


  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-lesson-detail-container">
        <div className="loading-message">Đang tải thông tin chương học...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="admin-lesson-detail-container">
        <div className="error-message">{error || "Không tìm thấy chương học"}</div>
      </div>
    );
  }

  const lessonTitle = lesson.title || lesson.Title || "Chương học";
  const lessonDescription = lesson.description || lesson.Description || "";
  const lessonImage = lesson.imageUrl || lesson.ImageUrl || getDefaultLessonImage();

  return (
    <>
      <div className="admin-lesson-detail-container">
        <div className="admin-breadcrumb-wrapper">
          <Container fluid>
            <div className="breadcrumb-section pt-0">
              <Breadcrumb
                items={[
                  { label: "Quản lý khóa học", path: ROUTE_PATHS.ADMIN.COURSES },
                  { label: course?.title || course?.Title || courseId, path: `/admin/courses/${courseId}` },
                  {
                    label: lessonTitle,
                    path: !selectedModule ? undefined : `/admin/courses/${courseId}/lesson/${lessonId}`,
                    onClick: selectedModule
                      ? () => {
                          setSelectedModule(null);
                          setModuleContent([]);
                          setLoadingContent(false);
                          navigate(`/admin/courses/${courseId}/lesson/${lessonId}`, { replace: true });
                        }
                      : undefined,
                    isCurrent: !selectedModule
                  },
                  ...(selectedModule ? [{ label: selectedModule.name || selectedModule.Name || "Bài học", isCurrent: true }] : [])
                ]}
                showHomeIcon={false}
              />
            </div>
          </Container>
        </div>
        <Container fluid className="lesson-detail-content p-0">
          <Row>
            {/* Left Column - Lesson Info */}
            <Col md={4} className="lesson-info-column">
              <div className="lesson-info-card">
                <div className="lesson-image-wrapper">
                  <ImageWithIconFallback
                    imageUrl={lesson.imageUrl || lesson.ImageUrl}
                    fallbackImageUrl={getDefaultLessonImage()}
                    icon={<PiBookOpenDuotone size={64} />}
                    alt={lessonTitle}
                    className="lesson-image-main"
                  />
                </div>
                <div className="lesson-info-content">
                  <h2 className="lesson-title">{lessonTitle}</h2>
                  <p className="lesson-description">{lessonDescription}</p>

                  <button
                    className="update-lesson-btn"
                    onClick={() => setShowUpdateModal(true)}
                  >
                    <FaEdit className="btn-icon" />
                    Cập nhật Chương học
                  </button>
                </div>
              </div>
            </Col>

            {/* Right Column - Modules List or Module Content */}
            <Col md={8} className="modules-column">
              {selectedModule ? (
                // Module Content View (Lectures/Flashcards List)
                <div className="modules-section">
                  <div className="module-content-header">
                    <h3 className="module-content-title">
                      {selectedModule.name || selectedModule.Name || "Bài học"}
                    </h3>
                  </div>

                  {loadingContent ? (
                    <div className="loading-message">
                      Đang tải danh sách {(() => {
                        const contentTypeValue = selectedModule.contentType || selectedModule.ContentType;
                        const contentTypeNum = typeof contentTypeValue === 'number' ? contentTypeValue : parseInt(contentTypeValue);
                        return getModuleTypePath(contentTypeNum);
                      })()}...
                    </div>
                  ) : contentError ? (
                    <div className="error-message">{contentError}</div>
                  ) : (
                    <>
                      <div className="module-content-list">
                        {moduleContent.length > 0 ? (
                          moduleContent.map((item, index) => {
                            // Since Lecture/Flashcard navigate away, only Assessment logic remains here
                            // Extract assessment details
                            const assessmentId = item.assessmentId || item.AssessmentId;
                            const title = item.title || item.Title || "Assessment";
                            const description = item.description || item.Description || "";
                            const timeLimit = item.timeLimit || item.TimeLimit;
                            const totalPoints = item.totalPoints || item.TotalPoints || 0;
                            const passingScore = item.passingScore || item.PassingScore || 0;
                            const isPublished = item.isPublished ?? item.IsPublished ?? true;
                            const openAt = item.openAt || item.OpenAt;
                            const dueAt = item.dueAt || item.DueAt;
                            const moduleId = selectedModule.moduleId || selectedModule.ModuleId;

                            // Format date helper
                            const formatDateTime = (dateStr) => {
                              if (!dateStr) return null;
                              const date = new Date(dateStr);
                              if (isNaN(date.getTime())) return null;
                              return date.toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            };

                            // Content type indicators
                            const typeInfo = {
                              hasQuiz: Array.isArray(item.quizzes) && item.quizzes.length > 0,
                              hasEssay: Array.isArray(item.essays) && item.essays.length > 0
                            };

                             return (
                               <div
                                 key={assessmentId || index}
                                 className="content-item"
                                 style={{ cursor: 'pointer' }}
                                 onClick={() => {
                                   navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/assessment/${assessmentId}`);
                                 }}
                               >
                                 <div className="content-item-info">
                                   <div className="item-header">
                                     <h4 className="content-item-title">{title}</h4>
                                     <div className="item-badges">
                                       {typeInfo.hasQuiz || typeInfo.hasEssay ? (
                                         <>
                                           {typeInfo.hasQuiz && <span className="badge-quiz">QUIZ</span>}
                                           {typeInfo.hasEssay && <span className="badge-essay">ESSAY</span>}
                                         </>
                                       ) : (
                                         <span className="no-content-badge">Chưa có nội dung</span>
                                       )}
                                     </div>
                                   </div>
                                   <div className="item-meta-container">
                                     <div className="item-meta-row main-meta">
                                       {timeLimit && (
                                         <span><strong>Thời gian:</strong> {timeLimit}</span>
                                       )}
                                       {openAt && (
                                         <span><strong>Bắt đầu:</strong> {formatDateTime(openAt)}</span>
                                       )}
                                       {dueAt && (
                                         <span><strong>Kết thúc:</strong> {formatDateTime(dueAt)}</span>
                                       )}
                                     </div>
                                     <div className="item-meta-row status-row">
                                       <span>
                                         <strong>Trạng thái:</strong>
                                         <span className={`status-tag ${isPublished ? 'published' : 'draft'}`}>
                                           {isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                                         </span>
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                                 <ActionButtons
                                   onUpdate={(e) => {
                                     e.stopPropagation();
                                     setAssessmentToUpdate(item);
                                     setShowUpdateAssessmentModal(true);
                                   }}
                                   onDelete={(e) => {
                                     e.stopPropagation();
                                   }}
                                   updateText="Cập nhật"
                                   showUpdateText={true}
                                   updateTitle="Sửa Assessment"
                                 />
                               </div>
                             );
                          })
                        ) : (
                          <div className="no-content-message">
                            {(() => {
                              const contentTypeValue = selectedModule.contentType || selectedModule.ContentType;
                              const contentTypeNum = typeof contentTypeValue === 'number' ? contentTypeValue : parseInt(contentTypeValue);
                              if (isLecture(contentTypeNum)) {
                                return "Chưa có lecture nào trong module này";
                              } else if (isFlashCard(contentTypeNum)) {
                                return "Chưa có flashcard nào trong module này";
                              } else if (isAssessment(contentTypeNum)) {
                                return "Chưa có assessment nào trong bài học này";
                              }
                              return "Chưa có nội dung nào trong bài học này";
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Create Button */}
                      {(() => {
                        const contentTypeValue = selectedModule.contentType || selectedModule.ContentType;
                        const contentTypeNum = typeof contentTypeValue === 'number' ? contentTypeValue : parseInt(contentTypeValue);
                        const moduleId = selectedModule.moduleId || selectedModule.ModuleId;

                        if (isLecture(contentTypeNum)) {
                          return (
                            <button
                              className="module-create-btn lecture-btn"
                              onClick={() => {
                                navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/lecture/manage`);
                              }}
                            >
                              <FaPlus className="add-icon" />
                              Quản lý Lecture
                            </button>
                          );
                        } else if (isFlashCard(contentTypeNum)) {
                          return (
                            <button
                              className="module-create-btn flashcard-btn"
                              onClick={() => {
                                navigate(`/admin/courses/${courseId}/lesson/${lessonId}/module/${moduleId}/flashcard/manage`);
                              }}
                            >
                              <FaPlus className="add-icon" />
                              Quản lý Flashcard
                            </button>
                          );
                        } else if (isAssessment(contentTypeNum)) {
                          return (
                            <button
                              className="module-create-btn assessment-btn"
                              onClick={() => {
                                setShowCreateAssessmentModal(true);
                              }}
                            >
                              <FaPlus className="add-icon" />
                              Thêm Assessment
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              ) : (
                // Modules List View
                <div className="modules-section">
                  <div className="modules-header">
                    <h3>Danh sách Bài học</h3>
                  </div>
                  <div className="modules-list">
                  {modules.length > 0 ? (
                    modules.map((module, index) => {
                      const moduleId = module.moduleId || module.ModuleId;
                      const moduleName = module.name || module.Name || `Module ${index + 1}`;
                      const moduleImage = module.imageUrl || module.ImageUrl || null; // Module dùng React icon, không cần default image

                      // Get contentType - could be number (enum) or string (ContentTypeName)
                      const contentTypeValue = module.contentType || module.ContentType;
                      const contentTypeName = module.contentTypeName || module.ContentTypeName;

                      // Map enum number to name if needed (matching backend ModuleType enum)
                      const contentTypeMap = {
                        1: "Lecture",
                        2: "FlashCard",
                        3: "Assessment"
                      };

                      const displayContentType = contentTypeName || contentTypeMap[contentTypeValue] || contentTypeValue || "Unknown";

                      const contentTypeNum = typeof contentTypeValue === 'number' ? contentTypeValue : parseInt(contentTypeValue);

                      // Handle module click - navigate to corresponding screen based on module type
                      const handleModuleItemClick = () => {
                        if (!isClickable(contentTypeNum)) return;
                        handleModuleClick(module);
                      };

                      return (
                        <div
                          key={moduleId || index}
                          className="module-item"
                          onClick={handleModuleItemClick}
                          style={{ cursor: isClickable(contentTypeNum) ? 'pointer' : 'default' }}
                        >
                          <div className="module-item-content">
                            <ImageWithIconFallback
                              imageUrl={module.imageUrl || module.ImageUrl}
                              icon={(() => {
                                if (isLecture(contentTypeNum)) return <PiLayoutDuotone size={24} />;
                                if (isFlashCard(contentTypeNum)) return <PiCardsDuotone size={24} />;
                                if (isAssessment(contentTypeNum)) return <PiExamDuotone size={24} />;
                                return <PiLayoutDuotone size={24} />;
                              })()}
                              alt={moduleName}
                              className="module-image"
                              iconClassName={`module-icon-wrapper ${isLecture(contentTypeNum) ? 'lecture' : isFlashCard(contentTypeNum) ? 'flashcard' : isAssessment(contentTypeNum) ? 'assessment' : ''}`}
                            />
                            <div className="module-info">
                              <span className="module-name">{moduleName}</span>
                              <span className="module-type">{displayContentType}</span>
                            </div>
                          </div>
                          <div className="module-actions" onClick={(e) => e.stopPropagation()}>
                            <ActionButtons
                              onUpdate={async (e) => {
                                e.stopPropagation();
                                try {
                                  setLoadingModuleDetail(true);
                                  const moduleId = module.moduleId || module.ModuleId;
                                  const response = await adminService.getModuleById(moduleId);

                                  if (response.data?.success && response.data?.data) {
                                    setModuleToUpdate(response.data.data);
                                    setShowUpdateModuleModal(true);
                                  } else {
                                    console.warn("Failed to fetch module detail, using list data");
                                    setModuleToUpdate(module);
                                    setShowUpdateModuleModal(true);
                                  }
                                } catch (error) {
                                  console.error("Error fetching module detail:", error);
                                  setModuleToUpdate(module);
                                  setShowUpdateModuleModal(true);
                                } finally {
                                  setLoadingModuleDetail(false);
                                }
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                handleDeleteModuleClick(module);
                              }}
                              updateTitle="Cập nhật bài học"
                              deleteTitle="Xóa bài học"
                              updateText={loadingModuleDetail ? "Đang tải..." : "Cập nhật"}
                              updateDisabled={loadingModuleDetail}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-modules-message">
                      <div className="empty-icon-wrapper">
                        <PiTrayDuotone />
                      </div>
                      <h4>Chưa có bài học nào</h4>
                      <p>Chương học này chưa có nội dung bài học. Vui lòng khởi tạo các bài học liên quan.</p>
                    </div>
                  )}
                  </div>

                  <button
                    className="add-module-btn-main"
                    onClick={() => setShowCreateModuleModal(true)}
                  >
                    <FaPlus className="add-icon" />
                    Thêm Bài học
                  </button>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Update Lesson Modal */}
      <CreateLessonModal
        show={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={handleUpdateSuccess}
        courseId={courseId}
        lessonData={{
          ...lesson,
          lessonId: lesson.lessonId || lesson.LessonId || parseInt(lessonId)
        }}
        isUpdateMode={true}
        isAdmin={true}
      />

      {/* Success Modal for Lesson Update */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Cập nhật chương học thành công"
        message="Chương học của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Create Module Modal */}
      <CreateModuleModal
        show={showCreateModuleModal}
        onClose={() => setShowCreateModuleModal(false)}
        onSuccess={handleCreateModuleSuccess}
        lessonId={lessonId}
        isAdmin={true}
      />

      {/* Update Module Modal */}
      <CreateModuleModal
        show={showUpdateModuleModal}
        onClose={() => {
          setShowUpdateModuleModal(false);
          setModuleToUpdate(null);
        }}
        onSuccess={() => {
          setShowUpdateModuleModal(false);
          setModuleToUpdate(null);
          setShowUpdateModuleSuccessModal(true);
          fetchModules();
        }}
        lessonId={lessonId}
        moduleData={moduleToUpdate}
        isUpdateMode={true}
        isAdmin={true}
      />

      {/* Success Modal for Module Update */}
      <SuccessModal
        isOpen={showUpdateModuleSuccessModal}
        onClose={() => setShowUpdateModuleSuccessModal(false)}
        title="Cập nhật bài học thành công"
        message="Bài học của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Create Assessment Modal */}
      {selectedModule && (
        <CreateAssessmentModal
          show={showCreateAssessmentModal}
          onClose={() => setShowCreateAssessmentModal(false)}
          onSuccess={() => {
            setShowCreateAssessmentModal(false);
            setShowCreateAssessmentSuccessModal(true);
            // Reload assessments list
            if (selectedModule) {
              handleModuleClick(selectedModule);
            }
          }}
          moduleId={selectedModule.moduleId || selectedModule.ModuleId}
          isAdmin={true}
        />
      )}

      {/* Success Modal for Assessment Creation */}
      <SuccessModal
        isOpen={showCreateAssessmentSuccessModal}
        onClose={() => setShowCreateAssessmentSuccessModal(false)}
        title="Tạo Assessment thành công"
        message="Assessment của bạn đã được tạo thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Update Assessment Modal */}
      {selectedModule && assessmentToUpdate && (
        <CreateAssessmentModal
          show={showUpdateAssessmentModal}
          onClose={() => {
            setShowUpdateAssessmentModal(false);
            setAssessmentToUpdate(null);
          }}
          onSuccess={() => {
            setShowUpdateAssessmentModal(false);
            setAssessmentToUpdate(null);
            setShowUpdateAssessmentSuccessModal(true);
            // Reload assessments list
            if (selectedModule) {
              handleModuleClick(selectedModule);
            }
          }}
          moduleId={selectedModule.moduleId || selectedModule.ModuleId}
          assessmentData={assessmentToUpdate}
          isUpdateMode={true}
          isAdmin={true}
        />
      )}

      {/* Success Modal for Assessment Update */}
      <SuccessModal
        isOpen={showUpdateAssessmentSuccessModal}
        onClose={() => setShowUpdateAssessmentSuccessModal(false)}
        title="Cập nhật Assessment thành công"
        message="Assessment của bạn đã được cập nhật thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Success Modal for Module Creation */}
      <SuccessModal
        isOpen={showModuleSuccessModal}
        onClose={() => setShowModuleSuccessModal(false)}
        title="Thêm bài học thành công"
        message="Bài học của bạn đã được thêm thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      {/* Confirm Delete Module Modal */}
      <ConfirmModal
        isOpen={showDeleteModuleModal}
        onClose={() => {
          setShowDeleteModuleModal(false);
          setModuleToDelete(null);
        }}
        onConfirm={confirmDeleteModule}
        title="Xác nhận xóa bài học"
        message="Bạn có chắc chắn muốn xóa bài học này không?"
        itemName={moduleToDelete ? (moduleToDelete.name || moduleToDelete.Name) : ""}
        type="delete"
        confirmText="Xác nhận xóa"
        loading={deletingModule}
      />

      {/* Success Modal for Delete Module */}
      <SuccessModal
        isOpen={showDeleteModuleSuccessModal}
        onClose={() => setShowDeleteModuleSuccessModal(false)}
        title="Xóa module thành công"
        message="Module đã được xóa thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={handleModuleNotificationClose}
        type={notification.type}
        message={notification.message}
      />
    </>
  );
}
