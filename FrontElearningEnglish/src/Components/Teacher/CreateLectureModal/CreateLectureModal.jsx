import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { FaBook, FaMarkdown, FaBold, FaItalic, FaHeading, FaListUl, FaCode, FaVideo, FaFileAlt, FaSitemap, FaArrowRight } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { lectureService } from "../../../Services/lectureService";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import { useEnums } from "../../../Context/EnumContext";
import "./CreateLectureModal.css";

const LECTURE_MEDIA_BUCKET = "lectures";

export default function CreateLectureModal({ show, onClose, onSuccess, moduleId, moduleName, lectureToUpdate, isAdmin = false }) {
  const isEditMode = !!lectureToUpdate && !lectureToUpdate._isChildCreation;
  const isChildCreation = !!lectureToUpdate?._isChildCreation;
  const textAreaRef = useRef(null);
  const { lectureTypes } = useEnums();

  // Get lecture types from API, fallback to default if not loaded
  const LECTURE_TYPES = lectureTypes && lectureTypes.length > 0
    ? lectureTypes.map(type => ({ value: type.value, label: type.name }))
    : [
      { value: 1, label: "Content" },
      { value: 2, label: "Document" },
      { value: 3, label: "Video" }
    ];

  // Form state - Only essential fields
  const [title, setTitle] = useState("");
  const [lectureType, setLectureType] = useState(1); // Default: Content
  const [markdownContent, setMarkdownContent] = useState("");
  const [parentLectureId, setParentLectureId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Media state - Auto-extracted, not shown to user
  const [mediaTempKey, setMediaTempKey] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);
  const [duration, setDuration] = useState(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState(null);

  // Parent lectures list (for dropdown)
  const [parentLectures, setParentLectures] = useState([]);

  // Find parent lecture info for breadcrumb
  const parentLectureInfo = useMemo(() => {
    if (isChildCreation && lectureToUpdate?.parentTitle) {
      return { title: lectureToUpdate.parentTitle, Title: lectureToUpdate.parentTitle };
    }
    if (!parentLectureId || parentLectures.length === 0) return null;
    return parentLectures.find(l => (l.lectureId || l.LectureId) === parentLectureId);
  }, [parentLectureId, parentLectures, isChildCreation, lectureToUpdate]);

  // Markdown toolbar
  const insertMarkdown = (tag) => {
    const area = textAreaRef.current;
    if (!area) return;

    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    const selected = text.substring(start, end) || "văn bản";
    let inserted = "";

    switch (tag) {
      case 'bold': inserted = `**${selected}**`; break;
      case 'italic': inserted = `_${selected}_`; break;
      case 'heading': inserted = `### ${selected}`; break;
      case 'list': inserted = `\n- ${selected}`; break;
      case 'code': inserted = `\`${selected}\``; break;
      default: inserted = selected;
    }

    const newVal = text.substring(0, start) + inserted + text.substring(end);
    setMarkdownContent(newVal);
    setTimeout(() => {
      area.focus();
      area.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  };

  // Load parent lectures
  useEffect(() => {
    if (show && moduleId) {
      const loadParentLectures = async () => {
        try {
          const response = isAdmin
            ? await lectureService.getAdminLecturesByModule(moduleId)
            : await lectureService.getTeacherLecturesByModule(moduleId);

          if (response.data?.success && response.data?.data) {
            const filtered = isEditMode && lectureToUpdate
              ? response.data.data.filter(l => (l.lectureId || l.LectureId) !== (lectureToUpdate.lectureId || lectureToUpdate.LectureId))
              : response.data.data;
            setParentLectures(filtered);
          }
        } catch (error) {
          console.error("Error loading parent lectures:", error);
        }
      };
      loadParentLectures();
    }
  }, [show, moduleId, isAdmin, isEditMode, lectureToUpdate]);

  // Fetch full lecture detail when editing
  useEffect(() => {
    const fetchLectureDetail = async () => {
      if (!show || !isEditMode || !lectureToUpdate) return;

      const lectureId = lectureToUpdate.lectureId || lectureToUpdate.LectureId;
      if (!lectureId) return;

      const hasMarkdown = lectureToUpdate.markdownContent || lectureToUpdate.MarkdownContent;
      const hasMediaUrl = lectureToUpdate.mediaUrl || lectureToUpdate.MediaUrl;
      if (hasMarkdown !== undefined || hasMediaUrl !== undefined) {
        return;
      }

      try {
        const response = isAdmin
          ? await lectureService.getAdminLectureById(lectureId)
          : await lectureService.getTeacherLectureById(lectureId);

        if (response.data?.success && response.data?.data) {
          const fullLectureData = response.data.data;
          setTitle(fullLectureData.title || fullLectureData.Title || "");
          setLectureType(fullLectureData.type || fullLectureData.Type || 1);
          setMarkdownContent(fullLectureData.markdownContent || fullLectureData.MarkdownContent || "");
          setParentLectureId(fullLectureData.parentLectureId || fullLectureData.ParentLectureId || null);
          setDuration(fullLectureData.duration || fullLectureData.Duration || null);
          setExistingMediaUrl(fullLectureData.mediaUrl || fullLectureData.MediaUrl || null);
        }
      } catch (err) {
        console.error("Error fetching lecture detail:", err);
      }
    };

    fetchLectureDetail();
  }, [show, isEditMode, lectureToUpdate, isAdmin]);

  // Load lecture data when editing
  useEffect(() => {
    if (show) {
      if (lectureToUpdate) {
        if (lectureToUpdate._isChildCreation && lectureToUpdate.parentLectureId) {
          // Reset form but keep parent ID
          setTitle("");
          setLectureType(1);
          setMarkdownContent("");
          setParentLectureId(lectureToUpdate.parentLectureId);
          setMediaTempKey(null);
          setMediaType(null);
          setMediaSize(null);
          setDuration(null);
          setExistingMediaUrl(null);
        } else {
          // Normal edit mode
          setTitle(lectureToUpdate.title || lectureToUpdate.Title || "");
          setLectureType(lectureToUpdate.type || lectureToUpdate.Type || 1);
          setMarkdownContent(lectureToUpdate.markdownContent || lectureToUpdate.MarkdownContent || "");
          setParentLectureId(lectureToUpdate.parentLectureId || lectureToUpdate.ParentLectureId || null);
          setDuration(lectureToUpdate.duration || lectureToUpdate.Duration || null);
          setExistingMediaUrl(lectureToUpdate.mediaUrl || lectureToUpdate.MediaUrl || null);
        }
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [show, lectureToUpdate]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      resetForm();
      setErrors({});
      setSubmitting(false);
    }
  }, [show]);

  const resetForm = () => {
    setTitle("");
    setLectureType(1);
    setMarkdownContent("");
    setParentLectureId(null);
    setMediaTempKey(null);
    setMediaType(null);
    setMediaSize(null);
    setDuration(null);
    setExistingMediaUrl(null);
    setShowConfirmClose(false);
  };

  // Check if form has data
  const hasFormData = () => {
    return (
      title.trim() !== "" ||
      markdownContent.trim() !== "" ||
      !!mediaTempKey ||
      !!existingMediaUrl
    );
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (hasFormData() && !submitting) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  // Media upload handlers - Auto-extract metadata
  const handleMediaUploadSuccess = useCallback((tempKey, fileType, previewUrl, fileSize, extractedDuration) => {
    setMediaTempKey(tempKey);
    setMediaType(fileType);
    setMediaSize(fileSize || null);

    if (lectureType === 3 && extractedDuration !== null && extractedDuration !== undefined) {
      setDuration(extractedDuration);
    }

    setErrors(prev => ({ ...prev, media: null }));
  }, [lectureType]);

  const handleMediaRemove = useCallback(() => {
    setMediaTempKey(null);
    setMediaType(null);
    setMediaSize(null);
    setExistingMediaUrl(null);
    setErrors(prev => ({ ...prev, media: null }));
  }, []);

  const handleMediaUploadError = useCallback((errorMessage) => {
    setErrors(prev => ({ ...prev, media: errorMessage }));
  }, []);

  // Validation - Simplified
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề bài giảng";
    } else if (title.trim().length < 2) {
      newErrors.title = "Tiêu đề phải có ít nhất 2 ký tự";
    } else if (title.trim().length > 255) {
      newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    }

    // Content type requires markdown content
    if (lectureType === 1 && !markdownContent.trim()) {
      newErrors.markdownContent = "Vui lòng nhập nội dung bài giảng";
    }

    // Video type requires video file
    if (lectureType === 3 && !mediaTempKey && !existingMediaUrl) {
      newErrors.media = "Vui lòng tải lên file video";
    }

    // Document type requires document file
    if (lectureType === 2 && !mediaTempKey && !existingMediaUrl) {
      newErrors.media = "Vui lòng tải lên file tài liệu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const lectureData = {
        moduleId: parseInt(moduleId),
        title: title.trim(),
        orderIndex: 0, // Auto-assign
        numberingLabel: null, // Auto-assign
        type: lectureType,
        markdownContent: markdownContent.trim() || null,
        parentLectureId: parentLectureId || null,
        mediaTempKey: mediaTempKey || null,
        mediaType: mediaType ? mediaType.substring(0, 50) : null,
        mediaSize: mediaSize && mediaSize > 0 ? mediaSize : null,
        duration: duration !== null && duration !== undefined && duration >= 0 ? duration : null,
      };

      let response;
      if (isEditMode) {
        const lectureId = lectureToUpdate.lectureId || lectureToUpdate.LectureId;
        response = isAdmin
          ? await lectureService.updateAdminLecture(lectureId, lectureData)
          : await lectureService.updateLecture(lectureId, lectureData);
      } else {
        response = isAdmin
          ? await lectureService.createAdminLecture(lectureData)
          : await lectureService.createLecture(lectureData);
      }

      if (response.data?.success) {
        const createdLecture = response.data.data;
        onSuccess(createdLecture);
        onClose();
      } else {
        throw new Error(response.data?.message || "Thao tác thất bại");
      }
    } catch (error) {
      console.error("Error saving lecture:", error);
      setErrors({ submit: error.response?.data?.message || error.message || "Có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  // Get icon and label for lecture type
  const getLectureTypeInfo = (type) => {
    switch (type) {
      case 1: return { icon: <FaBook />, label: "Nội dung văn bản", color: "#3b82f6" };
      case 2: return { icon: <FaFileAlt />, label: "Tài liệu đính kèm", color: "#8b5cf6" };
      case 3: return { icon: <FaVideo />, label: "Video bài giảng", color: "#ef4444" };
      default: return { icon: <FaBook />, label: "Nội dung", color: "#3b82f6" };
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" className="clm-modal modal-modern" dialogClassName="clm-modal-dialog">
        <Modal.Header className="clm-header">
          <Modal.Title className="clm-title">
            {isEditMode ? "✏️ Chỉnh sửa bài giảng" : isChildCreation ? "➕ Thêm bài giảng con" : "➕ Tạo bài giảng mới"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="clm-body">
          <Form onSubmit={handleSubmit}>
            {/* BREADCRUMB - Show position in tree when creating child */}
            {(isChildCreation || parentLectureId) && parentLectureInfo && (
              <Alert variant="info" className="clm-breadcrumb mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaSitemap className="text-primary" />
                  <span className="fw-semibold">Vị trí:</span>
                  {moduleName && (
                    <>
                      <span className="badge bg-secondary">{moduleName}</span>
                      <FaArrowRight className="text-muted" size={12} />
                    </>
                  )}
                  <span className="badge bg-primary">{parentLectureInfo.title || parentLectureInfo.Title}</span>
                  <FaArrowRight className="text-muted" size={12} />
                  <span className="badge bg-success">{title || "(Bài mới)"}</span>
                </div>
              </Alert>
            )}

            {/* TITLE - Required */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold fs-5">
                📝 Tiêu đề bài giảng <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                size="lg"
                isInvalid={!!errors.title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài giảng..."
                maxLength={255}
                autoFocus
              />
              {errors.title && <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>}
            </Form.Group>

            {/* LECTURE TYPE - Radio buttons for better UX */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold fs-5">🎯 Loại bài giảng</Form.Label>
              <div className="d-flex gap-3 flex-wrap">
                {LECTURE_TYPES.map((type) => {
                  const info = getLectureTypeInfo(type.value);
                  const isSelected = lectureType === type.value;
                  return (
                    <div
                      key={type.value}
                      className={`clm-type-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setLectureType(type.value)}
                      style={{ borderColor: isSelected ? info.color : undefined }}
                    >
                      <div className="clm-type-icon" style={{ color: info.color }}>{info.icon}</div>
                      <div className="clm-type-label">{type.label}</div>
                      <div className="clm-type-hint">{info.label}</div>
                    </div>
                  );
                })}
              </div>
            </Form.Group>

            {/* CONTENT - Markdown editor for Content type */}
            {lectureType === 1 && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold fs-5">
                  <FaMarkdown className="me-2" />
                  Nội dung bài giảng <span className="text-danger">*</span>
                </Form.Label>
                <div className="clm-markdown-toolbar mb-2">
                  <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('bold')} title="In đậm"><FaBold /></button>
                  <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('italic')} title="In nghiêng"><FaItalic /></button>
                  <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('heading')} title="Tiêu đề"><FaHeading /></button>
                  <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('list')} title="Danh sách"><FaListUl /></button>
                  <button type="button" className="clm-toolbar-btn" onClick={() => insertMarkdown('code')} title="Mã code"><FaCode /></button>
                </div>
                <div className="clm-markdown-editor">
                  <textarea
                    ref={textAreaRef}
                    className={`clm-markdown-textarea ${errors.markdownContent ? "border-danger" : ""}`}
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    placeholder="Viết nội dung bằng Markdown..."
                  />
                  <div className="clm-markdown-preview">
                    {markdownContent ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
                    ) : (
                      <div className="text-muted h-100 d-flex align-items-center justify-content-center">
                        Xem trước nội dung...
                      </div>
                    )}
                  </div>
                </div>
                {errors.markdownContent && (
                  <div className="text-danger small mt-1">{errors.markdownContent}</div>
                )}
              </Form.Group>
            )}

            {/* DOCUMENT - For Document type */}
            {lectureType === 2 && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold fs-5">
                  <FaFileAlt className="me-2" />
                  Tải lên tài liệu <span className="text-danger">*</span>
                </Form.Label>
                <FileUpload
                  bucket={LECTURE_MEDIA_BUCKET}
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  maxSize={10}
                  existingUrl={existingMediaUrl}
                  onUploadSuccess={handleMediaUploadSuccess}
                  onRemove={handleMediaRemove}
                  onError={handleMediaUploadError}
                  label="Kéo thả hoặc click để chọn file"
                  hint="Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 10MB)"
                  showPreview={false}
                />
                {errors.media && <div className="text-danger small mt-1">{errors.media}</div>}

                {/* Optional markdown content for document */}
                <div className="mt-3">
                  <Form.Label className="fw-semibold text-muted">📝 Mô tả tài liệu (không bắt buộc)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    placeholder="Thêm mô tả về tài liệu này..."
                  />
                </div>
              </Form.Group>
            )}

            {/* VIDEO - For Video type */}
            {lectureType === 3 && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold fs-5">
                  <FaVideo className="me-2" />
                  Tải lên video <span className="text-danger">*</span>
                </Form.Label>
                <FileUpload
                  bucket={LECTURE_MEDIA_BUCKET}
                  accept="video/*"
                  maxSize={100}
                  existingUrl={existingMediaUrl}
                  onUploadSuccess={handleMediaUploadSuccess}
                  onRemove={handleMediaRemove}
                  onError={handleMediaUploadError}
                  label="Kéo thả hoặc click để chọn video"
                  hint="Hỗ trợ: MP4, AVI, MOV... (tối đa 100MB)"
                />
                {errors.media && <div className="text-danger small mt-1">{errors.media}</div>}

                {/* Show video duration if available */}
                {duration !== null && duration > 0 && (
                  <div className="mt-2 p-2 bg-light rounded d-flex align-items-center gap-2">
                    <span className="text-muted">⏱️ Thời lượng:</span>
                    <strong>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</strong>
                  </div>
                )}
              </Form.Group>
            )}

            {/* PARENT LECTURE - Optional, only show if there are parent lectures */}
            {parentLectures.length > 0 && !isChildCreation && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-muted">
                  <FaSitemap className="me-2" />
                  Bài giảng cha (không bắt buộc)
                </Form.Label>
                <Form.Select
                  value={parentLectureId || ""}
                  onChange={(e) => setParentLectureId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Không có (Bài giảng gốc) --</option>
                  {parentLectures.map((lec) => (
                    <option key={lec.lectureId || lec.LectureId} value={lec.lectureId || lec.LectureId}>
                      {lec.title || lec.Title}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Chọn nếu muốn tạo bài giảng con nằm trong một bài giảng khác
                </Form.Text>
              </Form.Group>
            )}

            {/* Error message */}
            {errors.submit && (
              <Alert variant="danger" className="mt-3">
                {errors.submit}
              </Alert>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer className="clm-footer">
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            className="clm-btn-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : (isEditMode ? "Cập nhật Lecture" : "Tạo Lecture")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Close Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message="Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn đóng không?"
        confirmText="Đóng"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}
