import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { quizService } from "../../../Services/quizService";
import { useAuth } from "../../../Context/AuthContext";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import "./CreateQuizGroupModal.css";

const QUIZ_GROUP_BUCKET = "quizgroups";

export default function CreateQuizGroupModal({ show, onClose, onSuccess, quizSectionId, groupToUpdate = null, isAdmin: propIsAdmin = false }) {
  const { roles } = useAuth();
  const isUpdateMode = !!groupToUpdate;

  // Auto-detect admin role from AuthContext if not explicitly provided
  // Backend admin roles: SuperAdmin, ContentAdmin, FinanceAdmin
  const isAdmin = propIsAdmin || (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return roleName === "SuperAdmin" ||
      roleName === "ContentAdmin" ||
      roleName === "FinanceAdmin" ||
      roleName === "Admin" ||
      roleName?.toLowerCase() === "admin";
  }));

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [sumScore, setSumScore] = useState("0");

  // Image state
  const [imageUrl, setImageUrl] = useState(null);
  const [imageTempKey, setImageTempKey] = useState(null);
  const [imageType, setImageType] = useState(null);

  // Video state
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTempKey, setVideoTempKey] = useState(null);
  const [videoType, setVideoType] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [touched, setTouched] = useState({});

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Load group data when in update mode
  useEffect(() => {
    if (show && isUpdateMode && groupToUpdate) {
      loadGroupData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isUpdateMode, groupToUpdate, isAdmin]);

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
        const loadedName = group.name || group.Name || "";
        const loadedDescription = group.description || group.Description || "";
        const loadedTitle = group.title || group.Title || "";
        const scoreVal = group.sumScore !== undefined ? group.sumScore : (group.SumScore !== undefined ? group.SumScore : 0);
        const loadedSumScore = (scoreVal ?? 0).toString();

        // Load media URLs if available
        const loadedImgUrl = group.imgUrl || group.ImgUrl || null;
        const loadedVideoUrl = group.videoUrl || group.VideoUrl || null;
        const loadedVideoDuration = group.videoDuration || group.VideoDuration || null;

        setName(loadedName);
        setDescription(loadedDescription);
        setTitle(loadedTitle);
        setSumScore(loadedSumScore);
        setImageUrl(loadedImgUrl);
        setVideoUrl(loadedVideoUrl);
        setVideoDuration(loadedVideoDuration);

        // Save original data for comparison
        setOriginalData({
          name: loadedName,
          description: loadedDescription,
          title: loadedTitle,
          sumScore: loadedSumScore,
          imageUrl: loadedImgUrl,
          videoUrl: loadedVideoUrl
        });
      }
    } catch (error) {
      setErrors({ ...errors, submit: "Không thể tải dữ liệu group" });
    } finally {
      setLoadingGroup(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setName("");
      setDescription("");
      setTitle("");
      setSumScore("0");
      setImageUrl(null);
      setImageTempKey(null);
      setImageType(null);
      setVideoUrl(null);
      setVideoTempKey(null);
      setVideoType(null);
      setVideoDuration(null);
      setOriginalData(null);
      setErrors({});
      setShowConfirmClose(false);
    }
  }, [show]);

  // Original data for comparison (update mode)
  const [originalData, setOriginalData] = useState(null);

  // Check if form has data or has been modified
  const hasFormData = () => {
    if (isUpdateMode && originalData) {
      // In update mode, check if data changed from original
      return (
        name !== originalData.name ||
        title !== originalData.title ||
        description !== originalData.description ||
        String(sumScore) !== String(originalData.sumScore) ||
        imageTempKey !== null ||
        videoTempKey !== null ||
        (imageUrl !== null && imageUrl !== originalData.imageUrl) ||
        (videoUrl !== null && videoUrl !== originalData.videoUrl)
      );
    }
    // In create mode, check if any field has data
    return (
      name.trim() !== "" ||
      description.trim() !== "" ||
      title.trim() !== "" ||
      (sumScore && sumScore !== "0" && sumScore !== "0.0" && parseFloat(sumScore) !== 0) ||
      imageTempKey !== null ||
      videoTempKey !== null
    );
  };

  // FileUpload callbacks for Image
  const handleImageUploadSuccess = (tempKey, fileType, previewUrl) => {
    setImageTempKey(tempKey);
    setImageType(fileType);
    setImageUrl(previewUrl);
    setErrors({ ...errors, image: null });
  };

  const handleImageRemove = () => {
    setImageTempKey(null);
    setImageType(null);
    setImageUrl(null);
    setErrors({ ...errors, image: null });
  };

  const handleImageError = (errorMessage) => {
    setErrors({ ...errors, image: errorMessage });
  };

  // FileUpload callbacks for Video
  const handleVideoUploadSuccess = (tempKey, fileType, previewUrl, fileSize, extractedDuration) => {
    setVideoTempKey(tempKey);
    setVideoType(fileType);
    setVideoUrl(previewUrl);
    if (extractedDuration !== null && extractedDuration !== undefined) {
      setVideoDuration(Math.round(extractedDuration));
    }
    setErrors({ ...errors, video: null });
  };

  const handleVideoRemove = () => {
    setVideoTempKey(null);
    setVideoType(null);
    setVideoUrl(null);
    setVideoDuration(null);
    setErrors({ ...errors, video: null });
  };

  const handleVideoError = (errorMessage) => {
    setErrors({ ...errors, video: errorMessage });
  };

  // Handle close with confirmation
  const handleClose = () => {
    // Always allow closing if submitting or loading
    if (submitting || loadingGroup) {
      return; // Don't close if submitting/loading
    }

    // Check if form has data
    if (hasFormData()) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Handle confirm close
  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Tên nhóm là bắt buộc";
    } else if (name.trim().length > 200) {
      newErrors.name = "Tên nhóm không được vượt quá 200 ký tự";
    }

    if (!title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (title.trim().length > 200) {
      newErrors.title = "Tiêu đề không được vượt quá 200 ký tự";
    }

    if (description && description.trim().length > 1000) {
      newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    if (!sumScore || sumScore === "" || isNaN(parseFloat(sumScore))) {
      newErrors.sumScore = "Tổng điểm là bắt buộc";
    } else if (parseFloat(sumScore) < 0) {
      newErrors.sumScore = "Tổng điểm phải lớn hơn hoặc bằng 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTouched({ name: true, title: true, sumScore: true });
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        quizSectionId: parseInt(quizSectionId),
        name: name.trim(),
        description: description.trim() || null,
        title: title.trim(),
        sumScore: parseFloat(sumScore),
        imageTempKey: imageTempKey || null,
        imageType: imageTempKey ? imageType : null,
        videoTempKey: videoTempKey || null,
        videoType: videoTempKey ? videoType : null,
        videoDuration: videoTempKey && videoDuration ? videoDuration : null,
      };

      let response;
      if (isUpdateMode && groupToUpdate) {
        const groupId = groupToUpdate.quizGroupId || groupToUpdate.QuizGroupId;
        const updateData = {
          name: submitData.name,
          description: submitData.description,
          title: submitData.title,
          sumScore: submitData.sumScore,
          imageTempKey: submitData.imageTempKey,
          imageType: submitData.imageType,
          videoTempKey: submitData.videoTempKey,
          videoType: submitData.videoType,
          videoDuration: submitData.videoDuration,
        };
        response = isAdmin
          ? await quizService.updateAdminQuizGroup(groupId, updateData)
          : await quizService.updateQuizGroup(groupId, updateData);
      } else {
        response = isAdmin
          ? await quizService.createAdminQuizGroup(submitData)
          : await quizService.createQuizGroup(submitData);
      }

      if (response.data?.success) {
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || (isUpdateMode ? "Cập nhật Group thất bại" : "Tạo Group thất bại"));
      }
    } catch (error) {
      console.error(`Error ${isUpdateMode ? "updating" : "creating"} group:`, error);
      const errorMessage = error.response?.data?.message || error.message || (isUpdateMode ? "Có lỗi xảy ra khi cập nhật Group" : "Có lỗi xảy ra khi tạo Group");
      setErrors({ ...errors, submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    name.trim() &&
    title.trim() &&
    sumScore &&
    parseFloat(sumScore) >= 0;

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        backdrop={submitting ? "static" : true}
        keyboard={!submitting}
        centered
        className="create-quiz-group-modal modal-modern"
        dialogClassName="create-quiz-group-modal-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget && !submitting) {
            handleClose();
          }
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{isUpdateMode ? "Cập nhật Group" : "Tạo Group mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingGroup ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}>
              {/* Thông tin cơ bản */}
              <div className="form-section-card mb-4">
                <div className="form-section-title">Thông tin cơ bản</div>

                {/* Tên nhóm */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label required mb-0">Tên nhóm</label>
                    <span className={`small ${name.length > 200 ? "text-danger fw-bold" : "text-muted"}`}>
                      {name.length}/200
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${touched.name && errors.name ? "is-invalid" : ""}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (touched.name) validateForm();
                    }}
                    onBlur={() => handleBlur("name")}
                    placeholder="Nhập tên nhóm"
                    maxLength={200}
                  />
                  {touched.name && errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Tiêu đề */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label required mb-0">Tiêu đề</label>
                    <span className={`small ${title.length > 200 ? "text-danger fw-bold" : "text-muted"}`}>
                      {title.length}/200
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${touched.title && errors.title ? "is-invalid" : ""}`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (touched.title) validateForm();
                    }}
                    onBlur={() => handleBlur("title")}
                    placeholder="Nhập tiêu đề"
                    maxLength={200}
                  />
                  {touched.title && errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                {/* Mô tả */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0">Mô tả</label>
                    <span className={`small ${description.length > 1000 ? "text-danger fw-bold" : "text-muted"}`}>
                      {description.length}/1000
                    </span>
                  </div>
                  <textarea
                    className={`form-control ${touched.description && errors.description ? "is-invalid" : ""}`}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (touched.description) validateForm();
                    }}
                    onBlur={() => handleBlur("description")}
                    placeholder="Nhập mô tả (không bắt buộc)"
                    rows={3}
                    maxLength={1000}
                  />
                  {touched.description && errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>
              </div>

              {/* Cài đặt điểm số */}
              <div className="form-section-card mb-4">
                <div className="form-section-title">Cài đặt điểm số</div>

                {/* Tổng điểm */}
                <div className="mb-3">
                  <label className="form-label required">Tổng điểm</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`form-control ${touched.sumScore && errors.sumScore ? "is-invalid" : ""}`}
                    value={sumScore}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      if (value === '') {
                        setSumScore('');
                        if (touched.sumScore) validateForm();
                        return;
                      }
                      const numValue = value.replace(/[^\d.]/g, '');
                      const parts = numValue.split('.');
                      if (parts.length <= 2) {
                        setSumScore(numValue);
                        if (touched.sumScore) validateForm();
                      }
                    }}
                    onBlur={() => handleBlur("sumScore")}
                    placeholder="Ví dụ: 10"
                  />
                  {touched.sumScore && errors.sumScore && <div className="invalid-feedback">{errors.sumScore}</div>}
                  <div className="form-text">*Bắt buộc. Tổng điểm của nhóm câu hỏi này</div>
                </div>
              </div>

              {/* Media đính kèm */}
              <div className="form-section-card mb-4">
                <div className="form-section-title">Media đính kèm</div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="form-label">Ảnh đính kèm</label>
                  <FileUpload
                    bucket={QUIZ_GROUP_BUCKET}
                    accept="image/*"
                    maxSize={10}
                    existingUrl={imageUrl}
                    onUploadSuccess={handleImageUploadSuccess}
                    onRemove={handleImageRemove}
                    onError={handleImageError}
                    label="Chọn ảnh hoặc kéo thả vào đây"
                    hint="Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)"
                  />
                  {errors.image && <div className="text-danger small mt-1">{errors.image}</div>}
                  <div className="form-text">Không bắt buộc. Ảnh minh họa cho nhóm câu hỏi</div>
                </div>

                {/* Video Upload */}
                <div className="mb-3">
                  <label className="form-label">Video đính kèm</label>
                  <FileUpload
                    bucket={QUIZ_GROUP_BUCKET}
                    accept="video/*"
                    maxSize={100}
                    existingUrl={videoUrl}
                    onUploadSuccess={handleVideoUploadSuccess}
                    onRemove={handleVideoRemove}
                    onError={handleVideoError}
                    label="Chọn video hoặc kéo thả vào đây"
                    hint="Hỗ trợ: MP4, WebM, MOV (tối đa 100MB)"
                  />
                  {errors.video && <div className="text-danger small mt-1">{errors.video}</div>}
                  <div className="form-text">Không bắt buộc. Video minh họa cho nhóm câu hỏi (thời lượng sẽ tự động được tính)</div>
                </div>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="alert alert-danger mt-3">{errors.submit}</div>
              )}
            </form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            type="button"
          >
            Huỷ
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid || submitting || loadingGroup}
            type="button"
          >
            {submitting ? (isUpdateMode ? "Đang cập nhật..." : "Đang tạo...") : (isUpdateMode ? "Cập nhật" : "Tạo")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message="Bạn có dữ liệu chưa lưu. Bạn có chắc chắn muốn đóng không?"
        confirmText="Đóng"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}

