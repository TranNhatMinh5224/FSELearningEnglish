import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { FaFileUpload, FaTimes, FaImage, FaMusic, FaVideo, FaFileAlt } from "react-icons/fa";
import { fileService } from "../../../Services/fileService";
import "./FileUpload.css";

/**
 * FileUpload Component - Reusable file upload component
 */
export default function FileUpload({
    bucket,
    accept = "image/*",
    maxSize = 5,
    existingUrl = null,
    onUploadSuccess,
    onRemove,
    onError,
    onUploadingChange,
    label = "Chọn file hoặc kéo thả vào đây",
    hint = "Hỗ trợ Paste (Ctrl+V) từ Clipboard",
    enablePaste = true,
    previewClassName = "",
    showPreview = true,
}) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(existingUrl || null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Determine file type icon
    const getFileTypeIcon = () => {
        if (accept.includes("image")) return <FaImage />;
        if (accept.includes("audio")) return <FaMusic />;
        if (accept.includes("video")) return <FaVideo />;
        return <FaFileUpload />;
    };

    // Validate file
    const validateFile = useCallback((file) => {
        if (!file) return "Không có file được chọn";
        if (accept !== "*" && accept !== "*/*") {
            const acceptedTypes = accept.split(",").map(t => t.trim().toLowerCase());
            const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
            const isValidType = acceptedTypes.some(type => {
                if (type.endsWith("/*")) {
                    const baseType = type.split("/")[0];
                    return file.type.startsWith(`${baseType}/`);
                }
                if (type.includes("/")) return file.type === type;
                if (type.startsWith(".")) return fileExtension === type;
                return false;
            });
            if (!isValidType) {
                const typeName = accept.includes("image") ? "ảnh" : accept.includes("audio") ? "âm thanh" : accept.includes("video") ? "video" : "file định dạng hợp lệ";
                return `Vui lòng chọn ${typeName}`;
            }
        }
        const maxSizeBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) return `Kích thước file tối đa ${maxSize}MB`;
        return null;
    }, [accept, maxSize]);

    // Extract duration from video/audio file
    const extractDuration = useCallback(async (file) => {
        if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return null;
        try {
            return new Promise((resolve) => {
                const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
                media.src = URL.createObjectURL(file);
                media.onloadedmetadata = () => {
                    const duration = Math.round(media.duration);
                    URL.revokeObjectURL(media.src);
                    resolve(duration);
                };
                media.onerror = () => {
                    URL.revokeObjectURL(media.src);
                    resolve(null);
                };
                setTimeout(() => {
                    URL.revokeObjectURL(media.src);
                    resolve(null);
                }, 5000);
            });
        } catch (error) {
            return null;
        }
    }, []);

    // Upload file
    const uploadFile = useCallback(async (file) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            if (onError) onError(validationError);
            return;
        }

        setUploading(true);
        setUploadProgress(10);
        setError(null);
        if (onUploadingChange) onUploadingChange(true);

        try {
            let previewUrl = null;
            if (showPreview) {
                if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")) {
                    previewUrl = URL.createObjectURL(file);
                } else {
                    previewUrl = `document:${file.name}`;
                }
                setPreview(previewUrl);
            }

            setUploadProgress(30);
            let duration = null;
            if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
                duration = await extractDuration(file);
            }

            setUploadProgress(50);
            const uploadResponse = await fileService.uploadTempFile(file, bucket, "temp");
            setUploadProgress(100);

            if (uploadResponse.data?.success && uploadResponse.data?.data) {
                const resultData = uploadResponse.data.data;
                const tempKey = resultData.TempKey || resultData.tempKey;
                const fileType = resultData.ImageType || resultData.imageType || resultData.FileType || resultData.fileType || file.type;

                if (onUploadSuccess) {
                    onUploadSuccess(tempKey, fileType, previewUrl, file.size, duration);
                }
            } else {
                throw new Error(uploadResponse.data?.message || "Upload thất bại");
            }
        } catch (error) {
            let errorMessage = error.message || "Lỗi upload file";
            setError(errorMessage);
            setPreview(existingUrl || null);
            if (onError) onError(errorMessage);
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                if (onUploadingChange) onUploadingChange(false);
            }, 600);
        }
    }, [bucket, showPreview, existingUrl, onUploadSuccess, onError, onUploadingChange, validateFile, extractDuration]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleRemove = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onRemove) onRemove();
    };

    useEffect(() => {
        if (existingUrl && !preview) setPreview(existingUrl);
    }, [existingUrl, preview]);

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // Render Preview Logic (Exclusive Tags)
    const renderPreviewContent = () => {
        if (!preview) return null;

        if (preview.startsWith("document:")) {
            return (
                <div className="file-preview-document success-state">
                    <div className="document-icon"><FaFileAlt /></div>
                    <div className="document-info">
                        <span className="document-success-text fw-bold text-success">Đã đính kèm tài liệu</span>
                        <span className="document-hint text-muted small">{preview.replace("document:", "")}</span>
                    </div>
                </div>
            );
        }

        const isImage = preview.startsWith("blob:") ? accept.includes("image") : preview.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
        const isAudio = preview.startsWith("blob:") ? accept.includes("audio") : preview.match(/\.(mp3|wav|ogg|m4a)/i);
        const isVideo = preview.startsWith("blob:") ? accept.includes("video") : preview.match(/\.(mp4|webm|mov|m4v)/i);

        if (isImage) return <img src={preview} alt="Preview" className="file-preview-image" />;
        if (isAudio) return <audio src={preview} controls className="file-preview-audio" />;
        if (isVideo) return <video src={preview} controls className="file-preview-video" />;

        return (
            <div className="file-preview-placeholder">
                <FaFileAlt />
                <span>File đã tải lên</span>
            </div>
        );
    };

    return (
        <div className="file-upload-container">
            {preview && showPreview ? (
                <div className={`file-preview-wrapper ${previewClassName}`}>
                    {renderPreviewContent()}
                    <Button
                        variant="danger"
                        size="sm"
                        className="file-remove-btn"
                        onClick={handleRemove}
                        disabled={uploading}
                    >
                        <FaTimes />
                    </Button>
                </div>
            ) : (
                <div
                    className={`file-upload-area ${isDragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) uploadFile(file); }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <div className="file-upload-icon">{getFileTypeIcon()}</div>
                    <div className="file-upload-label">{label}</div>
                    {hint && <div className="file-upload-hint">{hint}</div>}
                </div>
            )}

            {uploading && (
                <div className="file-upload-progress">
                    <div className="file-upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}

            {error && <div className="file-upload-error text-danger mt-2 small">{error}</div>}
        </div>
    );
}