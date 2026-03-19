import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";
import ConfirmModal from "../../Components/Common/ConfirmModal/ConfirmModal";
import StudentEssayResultModal from "../../Components/Common/StudentEssayResultModal/StudentEssayResultModal";
import { essayService } from "../../Services/essayService";
import { essaySubmissionService } from "../../Services/essaySubmissionService";
import { fileService } from "../../Services/fileService";
import { moduleService } from "../../Services/moduleService";
import { courseService } from "../../Services/courseService";
import { lessonService } from "../../Services/lessonService";
import { assessmentService } from "../../Services/assessmentService";
import { FaFileUpload, FaTimes, FaEdit, FaCheckCircle, FaTimesCircle, FaStar } from "react-icons/fa";
import "./EssayDetail.css";

export default function EssayDetail() {
    const { courseId, lessonId, moduleId, essayId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [essay, setEssay] = useState(null);
    const [assessment, setAssessment] = useState(null);
    const [course, setCourse] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Submission state
    const [currentSubmission, setCurrentSubmission] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [textContent, setTextContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [attachmentTempKey, setAttachmentTempKey] = useState(null);
    const [attachmentType, setAttachmentType] = useState(null);
    const [existingAttachmentUrl, setExistingAttachmentUrl] = useState(null);

    const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);

    const fileInputRef = useRef(null);
    const moduleStartedRef = useRef(false);
    const audioRef = useRef(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                console.log("📌 [EssayDetail] Params:", { courseId, lessonId, moduleId, essayId });

                // Gọi API hoàn thành module khi vào trang essay
                const parsedModuleId = typeof moduleId === 'string' ? parseInt(moduleId) : moduleId;
                if (parsedModuleId && !isNaN(parsedModuleId) && !moduleStartedRef.current) {
                    try {
                        await moduleService.startModule(parsedModuleId);
                        moduleStartedRef.current = true;
                        console.log(`Module ${parsedModuleId} started successfully`);
                    } catch (err) {
                        console.error("Error starting module:", err);
                    }
                }

                // Fetch course info
                const courseResponse = await courseService.getCourseById(courseId);
                console.log("📌 [EssayDetail] Course response:", courseResponse?.data);
                if (courseResponse.data?.success && courseResponse.data?.data) {
                    setCourse(courseResponse.data.data);
                }

                // Fetch lesson info
                const lessonResponse = await lessonService.getLessonById(lessonId);
                console.log("📌 [EssayDetail] Lesson response:", lessonResponse?.data);
                if (lessonResponse.data?.success && lessonResponse.data?.data) {
                    setLesson(lessonResponse.data.data);
                }

                // Fetch module info
                const moduleResponse = await moduleService.getModuleById(moduleId);
                console.log("📌 [EssayDetail] Module response:", moduleResponse?.data);
                if (moduleResponse.data?.success && moduleResponse.data?.data) {
                    // Module data fetched but not stored
                }

                // Fetch essay info
                if (essayId) {
                    console.log("📌 [EssayDetail] Fetching essay with ID:", essayId);
                    const essayResponse = await essayService.getById(essayId);
                    console.log("📌 [EssayDetail] Essay response:", essayResponse?.data);
                    if (essayResponse.data?.success && essayResponse.data?.data) {
                        console.log("✅ [EssayDetail] Essay loaded successfully:", essayResponse.data.data);
                        setEssay(essayResponse.data.data);

                        // Fetch assessment info to get DueAt
                        const essayData = essayResponse.data.data;
                        const assessmentId = essayData.assessmentId || essayData.AssessmentId;
                        if (assessmentId) {
                            try {
                                const assessmentResponse = await assessmentService.getById(assessmentId);
                                if (assessmentResponse.data?.success && assessmentResponse.data?.data) {
                                    setAssessment(assessmentResponse.data.data);
                                    console.log("✅ [EssayDetail] Loaded assessment info:", assessmentResponse.data.data);
                                }
                            } catch (err) {
                                console.log("⚠️ [EssayDetail] Could not load assessment info:", err);
                            }
                        }

                        // Load audio if available
                        const audioUrl = essayData?.audioUrl || essayData?.AudioUrl;
                        if (audioUrl) {
                            // Load audio as blob
                            (async () => {
                                try {
                                    const response = await fetch(audioUrl, {
                                        method: 'GET',
                                        headers: { 'Accept': 'audio/mpeg, audio/*' },
                                        mode: 'cors',
                                        credentials: 'include',
                                    });
                                    
                                    if (response.ok) {
                                        const blob = await response.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        setAudioBlobUrl(blobUrl);
                                    } else {
                                        setAudioBlobUrl(audioUrl);
                                    }
                                } catch {
                                    setAudioBlobUrl(audioUrl);
                                }
                            })();
                        }

                        // Check if user has already submitted this essay
                                try {
                                    // If navigation provided full submission in state, use it directly (faster, reliable)
                                    const submissionFromState = location?.state?.submission;
                                    if (submissionFromState) {
                                        setCurrentSubmission(submissionFromState);
                                        const content = submissionFromState?.textContent || submissionFromState?.TextContent || "";
                                        setTextContent(content);
                                        const attachmentUrl = submissionFromState?.attachmentUrl || submissionFromState?.AttachmentUrl;
                                        if (attachmentUrl) setExistingAttachmentUrl(attachmentUrl);
                                        console.log("✅ [EssayDetail] Loaded submission from navigation state:", submissionFromState);
                                    } else {
                                        // Fallback: call status API which returns full submission object in data
                                        const statusResponse = await essaySubmissionService.getSubmissionStatus(essayId);
                                        if (statusResponse?.data?.success && statusResponse?.data?.data) {
                                            const submission = statusResponse.data.data;
                                            // Backend returns full submission object (textContent, attachmentUrl, etc.) directly
                                            if (submission && (submission.submissionId || submission.SubmissionId)) {
                                                setCurrentSubmission(submission);
                                                const content = submission?.textContent || submission?.TextContent || "";
                                                setTextContent(content);
                                                const attachmentUrl = submission?.attachmentUrl || submission?.AttachmentUrl;
                                                if (attachmentUrl) {
                                                    setExistingAttachmentUrl(attachmentUrl);
                                                }
                                                console.log("✅ [EssayDetail] Loaded existing submission from status API:", submission);
                                            }
                                        }
                                    }
                                } catch (statusErr) {
                                    console.log("ℹ️ [EssayDetail] No existing submission found or error:", statusErr);
                                }
                    } else {
                        setError(essayResponse.data?.message || "Không thể tải thông tin essay");
                    }
                }
            } catch (err) {
                console.error("Error fetching essay data:", err);
                setError("Không thể tải dữ liệu essay");
            } finally {
                setLoading(false);
            }
        };

        if (moduleId && essayId) {
            fetchData();
        }
    }, [moduleId, essayId, courseId, lessonId, location]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB for documents)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setNotification({
                    isOpen: true,
                    type: "error",
                    message: "File quá lớn. Kích thước tối đa là 10MB."
                });
                return;
            }

            // Validate file type (only text/word documents)
            const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.docm', '.dotx', '.dotm'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

            if (!hasValidExtension) {
                setNotification({
                    isOpen: true,
                    type: "error",
                    message: "Chỉ chấp nhận file PDF, DOC, DOCX, TXT, DOCM, DOTX, DOTM"
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setSelectedFile(file);
            setAttachmentTempKey(null); // Reset temp key when new file is selected
            setAttachmentType(file.type || 'application/octet-stream'); // Default type if not detected
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setAttachmentTempKey(null);
        setAttachmentType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const audioElement = audioRef.current;
            if (audioElement) {
                audioElement.pause();
                audioElement.src = "";
            }
        };
    }, [audioBlobUrl]);

    // Update audio src when blob URL is ready
    useEffect(() => {
        if (audioRef.current && audioBlobUrl) {
            audioRef.current.src = audioBlobUrl;
        }
    }, [audioBlobUrl]);

    const handleUploadFile = async () => {
        if (!selectedFile) return;

        try {
            setUploadingFile(true);
            console.log("📤 [EssayDetail] Uploading file to temp storage...");

            const uploadResponse = await fileService.uploadTempFile(
                selectedFile,
                "essay-attachments",
                "temp"
            );

            console.log("📥 [EssayDetail] Upload response:", uploadResponse.data);

            if (uploadResponse.data?.success && uploadResponse.data?.data) {
                const resultData = uploadResponse.data.data;
                const tempKey = resultData.TempKey || resultData.tempKey;
                const imageUrl = resultData.ImageUrl || resultData.imageUrl;
                const imageType = resultData.ImageType || resultData.imageType || selectedFile.type;

                if (!tempKey) {
                    throw new Error("Không nhận được TempKey từ server");
                }

                setAttachmentTempKey(tempKey);

                // Backend validator yêu cầu MIME type chính xác:
                // - PDF: application/pdf
                // - DOC: application/msword
                // - DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
                const extension = selectedFile?.name?.split('.').pop()?.toLowerCase();

                // Type mapping theo backend validator (CreateEssaySubmissionDtoValidator)
                const typeMap = {
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    // Các loại khác không được backend chấp nhận, nhưng để an toàn vẫn map
                    'txt': 'text/plain',
                    'docm': 'application/vnd.ms-word.document.macroEnabled.12',
                    'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
                    'dotm': 'application/vnd.ms-word.template.macroEnabled.12'
                };

                // Ưu tiên dùng type từ mapping, nếu không có thì dùng imageType từ server
                let finalAttachmentType = typeMap[extension];

                // Nếu không có trong mapping, kiểm tra imageType từ server
                if (!finalAttachmentType) {
                    // Kiểm tra nếu imageType từ server là MIME type hợp lệ cho backend
                    if (imageType) {
                        // Nếu là MIME type đầy đủ cho docx
                        if (imageType.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                            finalAttachmentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        } else if (imageType === 'application/msword' || imageType === 'application/pdf') {
                            finalAttachmentType = imageType;
                        } else {
                            // Fallback: dùng type từ file nếu hợp lệ
                            finalAttachmentType = imageType;
                        }
                    } else {
                        // Fallback cuối cùng
                        finalAttachmentType = 'application/octet-stream';
                    }
                }

                setAttachmentType(finalAttachmentType);

                console.log("✅ [EssayDetail] File uploaded successfully:", {
                    tempKey,
                    imageUrl,
                    imageType: finalAttachmentType,
                    originalImageType: imageType,
                    fileName: selectedFile?.name || "Unknown"
                });

                setNotification({
                    isOpen: true,
                    type: "success",
                    message: `Upload file "${selectedFile?.name || "file"}" thành công!`
                });
            } else {
                const errorMessage = uploadResponse.data?.message || "Không thể upload file";
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("❌ [EssayDetail] Error uploading file:", err);
            setNotification({
                isOpen: true,
                type: "error",
                message: err.response?.data?.message || "Không thể upload file. Vui lòng thử lại."
            });
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmitEssay = async () => {
        if (!essay) {
            setNotification({
                isOpen: true,
                type: "error",
                message: "Không tìm thấy thông tin essay"
            });
            return;
        }

        // Cho phép nộp bài trống - không validate bắt buộc

        // If file is selected but not uploaded, upload it first (optional)
        if (selectedFile && !attachmentTempKey && !existingAttachmentUrl) {
            try {
                await handleUploadFile();
                // Wait a bit for upload to complete
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error("Error uploading file:", err);
                // Continue with submission even if file upload fails (file is optional)
            }
        }

        try {
            if (currentSubmission) {
                // Update existing submission
                setIsUpdating(true);
                const submissionId = currentSubmission.submissionId || currentSubmission.SubmissionId;

                // Backend expects PascalCase: TextContent, AttachmentTempKey, AttachmentType
                const updateData = {
                    TextContent: textContent && textContent.trim() ? textContent.trim() : null, // Cho phép null/empty
                };

                // Only add attachment fields if new file is uploaded
                if (attachmentTempKey) {
                    updateData.AttachmentTempKey = attachmentTempKey;
                }
                if (attachmentType) {
                    updateData.AttachmentType = attachmentType;
                }

                console.log("📤 [EssayDetail] Updating submission...");
                console.log("📝 [EssayDetail] Update data (PascalCase):", updateData);

                const updateResponse = await essaySubmissionService.updateSubmission(submissionId, updateData);
                console.log("📥 [EssayDetail] Update response:", updateResponse.data);

                if (updateResponse.data?.success) {
                    setNotification({
                        isOpen: true,
                        type: "success",
                        message: "Cập nhật bài essay thành công!"
                    });

                    // Reload submission data
                    const submissionResponse = await essaySubmissionService.getSubmissionById(submissionId);
                    if (submissionResponse.data?.success && submissionResponse.data?.data) {
                        setCurrentSubmission(submissionResponse.data.data);
                        setExistingAttachmentUrl(submissionResponse.data.data.attachmentUrl || submissionResponse.data.data.AttachmentUrl);
                        setAttachmentTempKey(null);
                        setSelectedFile(null);
                    }

                    // Navigate back to assignment page after 2 seconds
                    setTimeout(() => {
                        navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment`);
                    }, 2000);
                } else {
                    setNotification({
                        isOpen: true,
                        type: "error",
                        message: updateResponse.data?.message || "Không thể cập nhật bài essay"
                    });
                }
            } else {
                // Submit new submission
                setSubmitting(true);

                // Backend expects PascalCase: EssayId, TextContent, AttachmentTempKey, AttachmentType
                const submissionData = {
                    EssayId: essay.essayId || essay.EssayId,
                    TextContent: textContent && textContent.trim() ? textContent.trim() : null, // Cho phép null/empty
                };

                // Only add attachment fields if they exist
                if (attachmentTempKey) {
                    submissionData.AttachmentTempKey = attachmentTempKey;
                }
                if (attachmentType) {
                    submissionData.AttachmentType = attachmentType;
                }

                console.log("📤 [EssayDetail] Submitting essay...");
                console.log("📝 [EssayDetail] Submission data (PascalCase):", submissionData);

                const submitResponse = await essaySubmissionService.submit(submissionData);
                console.log("📥 [EssayDetail] Submit response:", submitResponse.data);

                if (submitResponse.data?.success) {
                    setNotification({
                        isOpen: true,
                        type: "success",
                        message: "Nộp bài essay thành công!"
                    });

                    // Navigate back to assignment page after 2 seconds
                    setTimeout(() => {
                        navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment`);
                    }, 2000);
                } else {
                    setNotification({
                        isOpen: true,
                        type: "error",
                        message: submitResponse.data?.message || "Không thể nộp bài essay"
                    });
                }
            }
        } catch (err) {
            console.error("❌ [EssayDetail] Error submitting/updating essay:", err);

            // Log full error response
            if (err.response?.data) {
                console.error("❌ [EssayDetail] Full error response:", err.response.data);
                try {
                    console.error("❌ [EssayDetail] Error response (stringified):", JSON.stringify(err.response.data, null, 2));
                } catch (e) {
                    console.error("❌ [EssayDetail] Could not stringify error response");
                }
            }

            // Extract error message from backend response
            let errorMessage = currentSubmission
                ? "Không thể cập nhật bài essay. Vui lòng thử lại."
                : "Không thể nộp bài essay. Vui lòng thử lại.";

            if (err.response?.data) {
                const responseData = err.response.data;

                // Check for validation errors (FluentValidation format)
                if (responseData.errors) {
                    const validationErrors = Object.values(responseData.errors).flat();
                    errorMessage = validationErrors.join(", ") || errorMessage;
                } else if (responseData.title) {
                    // ASP.NET Core ProblemDetails format
                    errorMessage = responseData.title || errorMessage;
                    if (responseData.errors) {
                        const validationErrors = Object.values(responseData.errors).flat();
                        if (validationErrors.length > 0) {
                            errorMessage = validationErrors.join(", ");
                        }
                    }
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }

            setNotification({
                isOpen: true,
                type: "error",
                message: errorMessage
            });
        } finally {
            setSubmitting(false);
            setIsUpdating(false);
            setShowSubmitModal(false);
        }
    };

    const handleDeleteSubmission = async () => {
        if (!currentSubmission) return;

        try {
            setIsDeleting(true);
            const submissionId = currentSubmission.submissionId || currentSubmission.SubmissionId;

            console.log("🗑️ [EssayDetail] Deleting submission:", submissionId);

            const deleteResponse = await essaySubmissionService.deleteSubmission(submissionId);
            console.log("📥 [EssayDetail] Delete response:", deleteResponse.data);

            if (deleteResponse.data?.success) {
                setNotification({
                    isOpen: true,
                    type: "success",
                    message: "Xóa bài nộp thành công!"
                });

                // Reset form
                setCurrentSubmission(null);
                setTextContent("");
                setSelectedFile(null);
                setAttachmentTempKey(null);
                setAttachmentType(null);
                setExistingAttachmentUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setNotification({
                    isOpen: true,
                    type: "error",
                    message: deleteResponse.data?.message || "Không thể xóa bài nộp"
                });
            }
        } catch (err) {
            console.error("❌ [EssayDetail] Error deleting submission:", err);
            setNotification({
                isOpen: true,
                type: "error",
                message: err.response?.data?.message || "Không thể xóa bài nộp. Vui lòng thử lại."
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Không có";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatTimeLimit = (timeLimit) => {
        if (!timeLimit) return "Không giới hạn";
        if (typeof timeLimit === 'string') {
            // Parse TimeSpan string (e.g., "01:00:00" or "00:15:00")
            const parts = timeLimit.split(':');
            const hours = parseInt(parts[0]) || 0;
            const minutes = parseInt(parts[1]) || 0;
            if (hours > 0) {
                return `${hours} giờ ${minutes} phút`;
            }
            return `${minutes} phút`;
        }
        return "Không giới hạn";
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const handleBackClick = () => {
        navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment`);
    };

    const isPastDue = () => {
        if (!assessment) {
            return false;
        }
        const dueDate = assessment?.dueAt || assessment?.DueAt;
        if (!dueDate) {
            return false;
        }
        
        const due = new Date(dueDate);
        const now = new Date();
        const isPast = now > due;
        
        return isPast;
    };

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="essay-detail-container">
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

    if (error && !essay) {
        return (
            <>
                <MainHeader />
                <div className="essay-detail-container">
                    <Container>
                        <div className="alert alert-danger">{error}</div>
                        <div className="text-center mt-3">
                            <Button variant="primary" onClick={handleBackClick}>
                                Quay lại
                            </Button>
                        </div>
                    </Container>
                </div>
            </>
        );
    }

    const essayTitle = essay?.title || essay?.Title || "Essay";
    const courseTitle = course?.title || course?.Title || "Khóa học";
    const lessonTitle = lesson?.title || lesson?.Title || "Bài học";

    // Safety check: ensure all required objects exist before rendering
    if (!essay) {
        return (
            <>
                <MainHeader />
                <div className="essay-detail-container">
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

    return (
        <>
            <MainHeader />
            <div className="essay-detail-container">
                <Container>
                    <Row className="mb-3">
                        <Col>
                            <Breadcrumb
                                items={[
                                    { label: "Khóa học của tôi", path: "/my-courses" },
                                    { label: courseTitle, path: `/course/${courseId}` },
                                    { label: "Lesson", path: `/course/${courseId}/learn` },
                                    { label: lessonTitle, path: `/course/${courseId}/lesson/${lessonId}` },
                                    { label: essayTitle, isCurrent: true }
                                ]}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col xs={12}>
                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Body className="bg-white">
                                    <div className="text-center mb-4">
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                                            <FaEdit className="text-primary" size={40} style={{ color: '#d946ef' }} />
                                        </div>
                                        <h1 className="h3 mb-3 fw-bold">{essayTitle}</h1>
                                    </div>
                                    {essay?.description && (
                                        <p className="text-muted mb-3">{essay.description || essay.Description}</p>
                                    )}
                                    {essay?.audioUrl && (
                                        <div className="mb-3">
                                            <audio 
                                                ref={audioRef}
                                                controls 
                                                controlsList="nodownload"
                                                className="w-100"
                                                style={{ maxWidth: '500px' }}
                                                src={audioBlobUrl || essay.audioUrl || essay.AudioUrl}
                                            >
                                                Trình duyệt của bạn không hỗ trợ phát audio.
                                            </audio>
                                        </div>
                                    )}
                                    {essay?.imageUrl && (
                                        <div className="mb-3">
                                            <img 
                                                src={essay.imageUrl} 
                                                alt={essayTitle || "Essay image"} 
                                                className="img-fluid rounded"
                                            />
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <Card.Body className="bg-white">
                                    {/* Check if student has been graded */}
                                    {currentSubmission && ((currentSubmission.teacherScore !== null && currentSubmission.teacherScore !== undefined) || 
                                     (currentSubmission.TeacherScore !== null && currentSubmission.TeacherScore !== undefined) ||
                                     (currentSubmission.score !== null && currentSubmission.score !== undefined) ||
                                     (currentSubmission.Score !== null && currentSubmission.Score !== undefined)) ? (
                                        // Student has been graded - Show result view
                                        <div className="text-center py-5">
                                            <FaStar size={64} className="text-warning mb-3" />
                                            <h2 className="mb-3">Bài essay của bạn đã được chấm điểm!</h2>
                                            <p className="text-muted mb-4">
                                                Nhấn vào nút bên dưới để xem kết quả chi tiết
                                            </p>
                                            <Button
                                                variant="success"
                                                size="lg"
                                                onClick={() => setShowResultModal(true)}
                                                className="px-5"
                                            >
                                                <FaStar className="me-2" />
                                                Xem điểm và nhận xét
                                            </Button>
                                        </div>
                                    ) : (
                                        // Student hasn't been graded - Show normal form
                                        <>
                                            <h2 className="h4 mb-4">
                                                {currentSubmission ? "Cập nhật bài Essay" : "Nộp bài Essay"}
                                            </h2>

                                            {currentSubmission && (
                                                <div className="alert alert-info mb-3" role="alert">
                                                    <FaCheckCircle className="me-2" />
                                                    Bạn đã nộp bài essay này. Bạn có thể cập nhật hoặc xóa bài nộp.
                                                    {currentSubmission.submittedAt && (
                                                        <div className="mt-2">
                                                            <small>Nộp lúc: {formatDate(currentSubmission.submittedAt || currentSubmission.SubmittedAt)}</small>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Form>
                                                {/* Tiêu đề Essay (read-only) */}
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="d-flex align-items-center">
                                                        <FaEdit className="me-2 text-primary" />
                                                        Tiêu đề
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={essayTitle}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                    <div className="d-flex justify-content-end mt-2">
                                                        <span className="badge bg-success">Tự luận (Essay)</span>
                                                    </div>
                                                </Form.Group>

                                                {/* Mô tả Essay (read-only) */}
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="d-flex align-items-center">
                                                        <FaEdit className="me-2 text-primary" />
                                                        Mô tả
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={essay?.description || essay?.Description || ""}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </Form.Group>

                                                {/* Nội dung Essay (editable) */}
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="d-flex align-items-center">
                                                        <FaEdit className="me-2 text-primary" />
                                                        Nội dung Essay <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={12}
                                                        value={textContent}
                                                        onChange={(e) => setTextContent(e.target.value)}
                                                        placeholder="Nhập nội dung essay của bạn ở đây..."
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Số ký tự: {textContent.length}
                                                    </Form.Text>
                                                </Form.Group>

                                                {/* File đính kèm */}
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="d-flex align-items-center">
                                                        <FaFileUpload className="me-2 text-primary" />
                                                        File đính kèm (tùy chọn)
                                                    </Form.Label>
                                                    {existingAttachmentUrl && !selectedFile && (
                                                        <div className="mb-3 p-3 border rounded bg-light">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div>
                                                                    <FaFileUpload className="me-2 text-primary" />
                                                                    <span>File đính kèm hiện tại</span>
                                                                </div>
                                                                <a href={existingAttachmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                                    Xem file
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedFile ? (
                                                        <div className="p-3 border rounded">
                                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                                <div>
                                                                    <FaFileUpload className="me-2 text-primary" />
                                                                    <strong>{selectedFile?.name || "Unknown file"}</strong>
                                                                    <small className="text-muted ms-2">({formatFileSize(selectedFile?.size || 0)})</small>
                                                                </div>
                                                                <div>
                                                                    {!attachmentTempKey && (
                                                                        <Button
                                                                            variant="primary"
                                                                            size="sm"
                                                                            onClick={handleUploadFile}
                                                                            disabled={uploadingFile}
                                                                            className="me-2"
                                                                        >
                                                                            {uploadingFile ? "Đang upload..." : "Upload file"}
                                                                        </Button>
                                                                    )}
                                                                    {attachmentTempKey && (
                                                                        <span className="badge bg-success me-2">
                                                                            <FaCheckCircle className="me-1" /> Đã upload
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={handleRemoveFile}
                                                                    >
                                                                        <FaTimes /> Xóa
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border border-dashed rounded p-4 text-center">
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                id="file-input"
                                                                className="d-none"
                                                                onChange={handleFileSelect}
                                                                accept=".pdf,.doc,.docx,.txt,.docm,.dotx,.dotm"
                                                            />
                                                            <label htmlFor="file-input" className="cursor-pointer">
                                                                <FaFileUpload size={32} className="text-primary mb-2" />
                                                                <div>Chọn file để upload</div>
                                                                <small className="text-muted">(PDF, DOC, DOCX, TXT, DOCM, DOTX, DOTM - tối đa 10MB)</small>
                                                            </label>
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Form>

                                            {!isPastDue() ? (
                                                <div className="d-flex gap-2 mt-4">
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        onClick={() => setShowSubmitModal(true)}
                                                        disabled={submitting || isUpdating}
                                                        className="flex-fill"
                                                    >
                                                        {isUpdating ? "Đang cập nhật..." : submitting ? "Đang nộp bài..." : currentSubmission ? "Cập nhật bài" : "Nộp bài"}
                                                    </Button>
                                                    {currentSubmission && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="lg"
                                                            onClick={() => setShowDeleteModal(true)}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? "Đang xóa..." : "Xóa bài"}
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="alert alert-warning mt-3" role="alert">
                                                    <FaTimesCircle className="me-2" />
                                                    Đã quá hạn nộp bài. Bạn không thể nộp hoặc cập nhật bài essay này.
                                                </div>
                                            )}

                                            {/* Thông tin Essay Cards */}
                                            <Row className="g-3 mt-4">
                                                <Col md={6}>
                                                    <Card className="h-100">
                                                        <Card.Body>
                                                            <div className="text-muted small mb-1">Thời gian làm bài</div>
                                                            <div className="fw-bold">
                                                                {formatTimeLimit(assessment?.timeLimit || assessment?.TimeLimit)}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>

                                                <Col md={6}>
                                                    <Card className="h-100">
                                                        <Card.Body>
                                                            <div className="text-muted small mb-1">Tổng điểm</div>
                                                            <div className="fw-bold">
                                                                {essay?.totalPoints || essay?.TotalPoints || 0} điểm
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>

                                                <Col md={6}>
                                                    <Card className="h-100">
                                                        <Card.Body>
                                                            <div className="text-muted small mb-1">Mở từ</div>
                                                            <div className="fw-bold">
                                                                {assessment?.openAt || assessment?.OpenAt
                                                                    ? formatDate(assessment?.openAt || assessment?.OpenAt)
                                                                    : "Không có"}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>

                                                <Col md={6}>
                                                    <Card className="h-100">
                                                        <Card.Body>
                                                            <div className="text-muted small mb-1">Hạn nộp</div>
                                                            <div className="fw-bold">
                                                                {assessment?.dueAt || assessment?.DueAt
                                                                    ? formatDate(assessment?.dueAt || assessment?.DueAt)
                                                                    : "Không có hạn nộp"}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <ConfirmModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmitEssay}
                title={currentSubmission ? "Xác nhận cập nhật bài" : "Xác nhận nộp bài"}
                message={currentSubmission
                    ? "Bạn có chắc chắn muốn cập nhật bài essay này?"
                    : "Bạn có chắc chắn muốn nộp bài essay này? Sau khi nộp, bạn có thể cập nhật hoặc xóa bài nộp."
                }
                confirmText={currentSubmission ? "Cập nhật bài" : "Nộp bài"}
                cancelText="Hủy"
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteSubmission}
                title="Xác nhận xóa bài"
                message="Bạn có chắc chắn muốn xóa bài nộp này? Hành động này không thể hoàn tác."
                confirmText="Xóa bài"
                cancelText="Hủy"
                type="danger"
            />

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification({ ...notification, isOpen: false })}
                type={notification.type}
                message={notification.message}
            />

            <StudentEssayResultModal
                show={showResultModal}
                onClose={() => setShowResultModal(false)}
                submission={currentSubmission}
            />
        </>
    );
}
