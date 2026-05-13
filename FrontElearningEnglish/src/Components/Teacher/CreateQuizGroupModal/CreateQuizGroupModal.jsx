import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { quizService } from "../../../Services/quizService";
import { useAuth } from "../../../Context/AuthContext";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import "./CreateQuizGroupModal.css";

const QUIZ_GROUP_BUCKET = "quizgroups";

export default function CreateQuizGroupModal({ show, onClose, onSuccess, quizSectionId, groupToUpdate = null, isAdmin: propIsAdmin = false }) {
  const { roles } = useAuth();
  const isUpdateMode = !!groupToUpdate;

  const isAdmin = propIsAdmin || (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin", "Admin"].includes(roleName);
  }));

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [sumScore, setSumScore] = useState("0");

  // Media states
  const [imageUrl, setImageUrl] = useState(null);
  const [imageTempKey, setImageTempKey] = useState(null);
  
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTempKey, setVideoTempKey] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioTempKey, setAudioTempKey] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [touched, setTouched] = useState({});
  const [originalData, setOriginalData] = useState(null);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    if (show && isUpdateMode && groupToUpdate) {
      loadGroupData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isUpdateMode, groupToUpdate]);

  const loadGroupData = async () => {
    if (!groupToUpdate) return;
    setLoadingGroup(true);
    try {
      const groupId = groupToUpdate.quizGroupId || groupToUpdate.QuizGroupId;
      const response = isAdmin
        ? await quizService.getAdminQuizGroupById(groupId)
        : await quizService.getQuizGroupById(groupId);

      if (response.data?.success && response.data?.data) {
        const group = response.data.data;
        const data = {
          name: group.name || group.Name || "",
          description: group.description || group.Description || "",
          title: group.title || group.Title || "",
          sumScore: (group.sumScore || group.SumScore || 0).toString(),
          imageUrl: group.imgUrl || group.ImgUrl || null,
          videoUrl: group.videoUrl || group.VideoUrl || null,
          audioUrl: group.audioUrl || group.AudioUrl || null,
          videoDuration: group.videoDuration || group.VideoDuration || null
        };

        setName(data.name);
        setDescription(data.description);
        setTitle(data.title);
        setSumScore(data.sumScore);
        setImageUrl(data.imageUrl);
        setVideoUrl(data.videoUrl);
        setAudioUrl(data.audioUrl);
        setVideoDuration(data.videoDuration);
        setOriginalData(data);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: "Không thể tải dữ liệu nhóm" }));
    } finally {
      setLoadingGroup(false);
    }
  };

  useEffect(() => {
    if (!show) {
      setName("");
      setDescription("");
      setTitle("");
      setSumScore("0");
      setImageUrl(null);
      setImageTempKey(null);
      setVideoUrl(null);
      setVideoTempKey(null);
      setVideoDuration(null);
      setAudioUrl(null);
      setAudioTempKey(null);
      setOriginalData(null);
      setErrors({});
      setShowConfirmClose(false);
      setTouched({});
    }
  }, [show]);

  const hasFormData = () => {
    if (isUpdateMode && originalData) {
      return (
        name !== originalData.name ||
        title !== originalData.title ||
        description !== originalData.description ||
        String(sumScore) !== String(originalData.sumScore) ||
        imageTempKey !== null ||
        videoTempKey !== null ||
        audioTempKey !== null ||
        imageUrl !== originalData.imageUrl ||
        videoUrl !== originalData.videoUrl ||
        audioUrl !== originalData.audioUrl
      );
    }
    return (
      name.trim() !== "" ||
      title.trim() !== "" ||
      (sumScore && parseFloat(sumScore) !== 0) ||
      imageTempKey !== null ||
      videoTempKey !== null ||
      audioTempKey !== null
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Tên nhóm là bắt buộc";
    if (!title.trim()) newErrors.title = "Tiêu đề là bắt buộc";
    if (!sumScore || isNaN(parseFloat(sumScore))) newErrors.sumScore = "Điểm số không hợp lệ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setTouched({ name: true, title: true, sumScore: true });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quizSectionId: parseInt(quizSectionId),
        name: name.trim(),
        description: description.trim() || null,
        title: title.trim(),
        sumScore: parseFloat(sumScore),
        imageTempKey: imageTempKey,
        videoTempKey: videoTempKey,
        audioTempKey: audioTempKey,
        videoDuration: videoDuration
      };

      let response;
      if (isUpdateMode && groupToUpdate) {
        const groupId = groupToUpdate.quizGroupId || groupToUpdate.QuizGroupId;
        response = isAdmin
          ? await quizService.updateAdminQuizGroup(groupId, payload)
          : await quizService.updateQuizGroup(groupId, payload);
      } else {
        response = isAdmin
          ? await quizService.createAdminQuizGroup(payload)
          : await quizService.createQuizGroup(payload);
      }

      if (response.data?.success) {
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || "Lỗi thao tác");
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting || loadingGroup) return;
    if (hasFormData()) setShowConfirmClose(true);
    else onClose();
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        centered
        className={`create-question-modal ${isAdmin ? "admin-modal" : "teacher-modal"}`}
        dialogClassName="create-question-modal-xl"
      >
        <Modal.Header>
          <Modal.Title className="fw-bold">{isUpdateMode ? "Cập nhật Nhóm" : "Tạo Nhóm mới"}</Modal.Title>
          <PremiumCloseButton onClick={handleClose} />
        </Modal.Header>
        <Modal.Body>
          {loadingGroup ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-7">
                  <div className="form-section-card mb-4">
                    <div className="form-section-title">Thông tin cơ bản</div>
                    <div className="mb-3">
                      <label className="form-label required">Tên định danh</label>
                      <input type="text" className={`form-control ${touched.name && errors.name ? "is-invalid" : ""}`} value={name} onChange={e => setName(e.target.value)} onBlur={() => handleBlur("name")} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label required">Tiêu đề hiển thị</label>
                      <input type="text" className={`form-control ${touched.title && errors.title ? "is-invalid" : ""}`} value={title} onChange={e => setTitle(e.target.value)} onBlur={() => handleBlur("title")} />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Mô tả / Ngữ cảnh</label>
                      <textarea className="form-control" rows={5} value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                  </div>
                </div>
                
                <div className="col-md-5">
                   <div className="form-section-card mb-4">
                    <div className="form-section-title">Cài đặt</div>
                    <div className="mb-0">
                      <label className="form-label required">Tổng điểm nhóm</label>
                      <input type="text" inputMode="decimal" className={`form-control fw-bold ${touched.sumScore && errors.sumScore ? "is-invalid" : ""}`} value={sumScore} onChange={e => setSumScore(e.target.value.replace(/[^\d.]/g, ''))} onBlur={() => handleBlur("sumScore")} />
                    </div>
                  </div>

                  <div className="form-section-card">
                    <div className="form-section-title">Media đa phương tiện</div>
                    <div className="mb-3">
                        <small className="text-muted d-block mb-1">Hình ảnh</small>
                        <FileUpload bucket={QUIZ_GROUP_BUCKET} accept="image/*" existingUrl={imageUrl} onUploadSuccess={(key) => setImageTempKey(key)} onRemove={() => {setImageUrl(null); setImageTempKey(null);}} />
                    </div>
                    <div className="mb-3">
                        <small className="text-muted d-block mb-1">Video</small>
                        <FileUpload bucket={QUIZ_GROUP_BUCKET} accept="video/*" existingUrl={videoUrl} onUploadSuccess={(key, type, url, size, dur) => {setVideoTempKey(key); setVideoDuration(dur);}} onRemove={() => {setVideoUrl(null); setVideoTempKey(null);}} />
                    </div>
                    <div className="mb-0">
                        <small className="text-muted d-block mb-1">Âm thanh</small>
                        <FileUpload bucket={QUIZ_GROUP_BUCKET} accept="audio/*" existingUrl={audioUrl} onUploadSuccess={(key) => setAudioTempKey(key)} onRemove={() => {setAudioUrl(null); setAudioTempKey(null);}} />
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
            </form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || loadingGroup}>{submitting ? "Đang xử lý..." : (isUpdateMode ? "Cập nhật" : "Tạo mới")}</Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal isOpen={showConfirmClose} onClose={() => setShowConfirmClose(false)} onConfirm={() => {setShowConfirmClose(false); onClose();}} title="Đóng mà không lưu?" message="Dữ liệu đã nhập sẽ bị mất." type="warning" />
    </>
  );
}
