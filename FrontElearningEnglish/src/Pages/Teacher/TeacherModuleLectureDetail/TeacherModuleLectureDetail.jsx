import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Badge } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import TeacherHeader from "../../../Components/Header/TeacherHeader";
import Breadcrumb from "../../../Components/Common/Breadcrumb/Breadcrumb";
import { teacherService } from "../../../Services/teacherService";
import { lectureService } from "../../../Services/lectureService";
import { ROUTE_PATHS } from "../../../Routes/Paths";
import { useAuth } from "../../../Context/AuthContext";
import CreateLectureModal from "../../../Components/Teacher/CreateLectureModal/CreateLectureModal";
import LectureTreeView from "../../../Components/Teacher/LectureTreeView/LectureTreeView";
import LectureDetailModal from "../../../Components/Teacher/LectureDetailModal/LectureDetailModal";
import ConfirmModal from "../../../Components/Common/ConfirmModal/ConfirmModal";
import SuccessModal from "../../../Components/Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Components/Common/NotificationModal/NotificationModal";
import "./TeacherModuleLectureDetail.css";

export default function TeacherModuleLectureDetail() {
  const { courseId, lessonId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, roles, isAuthenticated } = useAuth();

  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lectureToUpdate, setLectureToUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(null);

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

      // Try fetching teacher tree first
      let lecturesList = [];
      try {
        const lecturesRes = await lectureService.getTeacherLectureTree(moduleId);
        if (lecturesRes.data?.success) {
          const data = lecturesRes.data.data;
          // Handle both direct array or { lectures: [] } structure
          lecturesList = Array.isArray(data) ? data : (data?.lectures || []);
        }
      } catch (teacherErr) {
        console.warn("Teacher lecture tree fetch failed, trying admin fallback if applicable", teacherErr);
      }

      // Fallback to Admin endpoint IF empty AND user is Admin
      if (lecturesList.length === 0 && isAdmin) {
        try {
          const adminLecturesRes = await lectureService.getAdminLectureTree(moduleId);
          if (adminLecturesRes.data?.success) {
            const data = adminLecturesRes.data.data;
            lecturesList = Array.isArray(data) ? data : (data?.lectures || []);
          }
        } catch (adminErr) {
          console.error("Admin lecture tree fallback failed:", adminErr);
        }
      }

      setLectures(lecturesList);
    } catch (err) {
      console.error("Error fetching data:", err);
      setNotification({ isOpen: true, type: "error", message: "Không thể tải dữ liệu bài giảng. Vui lòng thử lại sau." });
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
    setSuccessMessage("Tạo lecture thành công!");
    setShowSuccessModal(true);
    fetchData();
  };

  const handleAddChild = (parentLecture) => {
    const parentId = parentLecture.lectureId || parentLecture.LectureId;
    const parentTitle = parentLecture.title || parentLecture.Title;
    setLectureToUpdate({
      parentLectureId: parentId,
      parentTitle: parentTitle,
      _isChildCreation: true
    });
    setShowCreateModal(true);
  };

  const handleViewLecture = (lecture) => {
    const lectureId = lecture.lectureId || lecture.LectureId;
    setSelectedLectureId(lectureId);
    setShowDetailModal(true);
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage("Cập nhật lecture thành công!");
    setShowSuccessModal(true);
    fetchData();
  };

  const handleDeleteClick = (lecture) => {
    setLectureToDelete(lecture);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!lectureToDelete) return;
    try {
      const lectureId = lectureToDelete.lectureId || lectureToDelete.LectureId;
      const res = await lectureService.deleteLecture(lectureId);
      if (res.data?.success) {
        setSuccessMessage("Xóa lecture thành công!");
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: "Xóa thất bại: " + res.data?.message });
      }
    } catch (err) {
      console.error(err);
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi xóa lecture" });
    }
  };

  // Handle reorder lectures via drag & drop
  const handleReorder = async (reorderList) => {
    if (!reorderList || reorderList.length === 0) return;

    try {
      const res = await lectureService.reorderLectures(reorderList);
      if (res.data?.success) {
        // Refresh data to get updated order
        fetchData();
      } else {
        setNotification({ isOpen: true, type: "error", message: "Reorder thất bại: " + res.data?.message });
      }
    } catch (err) {
      console.error("Reorder error:", err);
      setNotification({ isOpen: true, type: "error", message: "Lỗi khi sắp xếp lại lectures" });
    }
  };

  return (
    <>
      <TeacherHeader />
      <div className="teacher-module-lecture-detail-container">
        <Container>
          <div className="breadcrumb-section mt-3">
            <Breadcrumb
              items={[
                { label: "Quản lý khoá học", path: ROUTE_PATHS.TEACHER_COURSE_MANAGEMENT },
                { label: course?.title || course?.Title || "Khóa học", path: `/teacher/course/${courseId}` },
                { label: lesson?.title || lesson?.Title || "Bài học", path: `/teacher/course/${courseId}/lesson/${lessonId}` },
                { label: "Quản lý bài giảng", isCurrent: true }
              ]}
              showHomeIcon={false}
            />
          </div>

          <div className="lecture-management-header mb-4 mt-4">
            <div className="d-flex align-items-center justify-content-between">
              <div className="header-content">
                <h2 className="mb-1 fw-bold text-primary">Quản lý bài giảng</h2>
                <div className="d-flex align-items-center gap-3">
                  <span className="module-name text-muted">
                    {module?.name || module?.Name || "Module"}
                  </span>
                  {lectures.length > 0 && (
                    <Badge bg="primary" className="lecture-count-badge">
                      {lectures.length} bài giảng
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="primary"
                className="create-lecture-btn d-flex align-items-center gap-2"
                onClick={() => { setLectureToUpdate(null); setShowCreateModal(true); }}
              >
                <FaPlus /> <span>Tạo bài giảng gốc</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-5 bg-light rounded text-muted">
              <p>Chưa có bài giảng nào trong module này.</p>
              <Button variant="primary" onClick={() => { setLectureToUpdate(null); setShowCreateModal(true); }}>Tạo bài giảng đầu tiên</Button>
            </div>
          ) : (
            <LectureTreeView
              lectures={lectures}
              moduleId={moduleId}
              onAddChild={handleAddChild}
              onEdit={(lec) => { setLectureToUpdate(lec); setShowCreateModal(true); }}
              onDelete={handleDeleteClick}
              onView={handleViewLecture}
              onReorder={handleReorder}
            />
          )}
        </Container>
      </div>

      <CreateLectureModal
        show={showCreateModal}
        onClose={() => { setShowCreateModal(false); setLectureToUpdate(null); }}
        onSuccess={lectureToUpdate && !lectureToUpdate._isChildCreation ? handleUpdateSuccess : handleCreateSuccess}
        moduleId={moduleId}
        moduleName={module?.name || module?.Name}
        lectureToUpdate={lectureToUpdate}
        isAdmin={isAdmin}
      />

      <LectureDetailModal
        show={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedLectureId(null); }}
        lectureId={selectedLectureId}
        isAdmin={isAdmin}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Xóa Lecture?"
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