import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Modal } from "react-bootstrap";
import Cropper from "react-easy-crop";
import { FaFileUpload, FaTimes, FaImage, FaMusic, FaVideo, FaFileAlt } from "react-icons/fa";
import { fileService } from "../../../Services/fileService";
import "./FileUpload.css";

/**
 * FileUpload Component - Reusable file upload component
 * 
 * @param {Object} props
 * @param {string} props.bucket - S3 bucket name (required)
 * @param {string} props.accept - Accept file types (e.g., "image/*", "audio/*", "video/*")
 * @param {number} props.maxSize - Max file size in MB (default: 5)
 * @param {string} props.existingUrl - Existing file URL to display
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds: (tempKey, fileType, previewUrl, fileSize, duration) => void
 * @param {Function} props.onRemove - Callback when file is removed: () => void
 * @param {Function} props.onError - Callback when error occurs: (errorMessage) => void
 * @param {Function} props.onUploadingChange - Callback when uploading state changes: (isUploading) => void
 * @param {string} props.label - Label text (default: "Chọn file hoặc kéo thả vào đây")
 * @param {string} props.hint - Hint text (default: "Hỗ trợ Paste (Ctrl+V) từ Clipboard")
 * @param {boolean} props.enablePaste - Enable paste from clipboard (default: true)
 * @param {string} props.previewClassName - Custom class for preview container
 * @param {boolean} props.showPreview - Show preview (default: true)
 * @param {boolean} props.enableImageCrop - Enable image cropping before upload (default: false)
 * @param {number} props.cropAspect - Crop aspect ratio (default: 16/9)
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
    enableImageCrop = false,
    cropAspect = 16 / 9,
}) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(existingUrl || null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreview, setPendingPreview] = useState(null);

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

        // Check file type
        if (accept !== "*" && accept !== "*/*") {
            const acceptedTypes = accept.split(",").map(t => t.trim().toLowerCase());
            const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
            
            const isValidType = acceptedTypes.some(type => {
                // Wildcard match (e.g. image/*)
                if (type.endsWith("/*")) {
                    const baseType = type.split("/")[0];
                    return file.type.startsWith(`${baseType}/`);
                }
                // Exact MIME match (e.g. application/pdf)
                if (type.includes("/")) {
                    return file.type === type;
                }
                // Extension match (e.g. .doc, .docx, .pdf)
                if (type.startsWith(".")) {
                    return fileExtension === type;
                }
                return false;
            });

            if (!isValidType) {
                const typeName = accept.includes("image") ? "ảnh" : accept.includes("audio") ? "âm thanh" : accept.includes("video") ? "video" : "file định dạng hợp lệ";
                return `Vui lòng chọn ${typeName}`;
            }
        }

        // Check file size
        const maxSizeBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `Kích thước file tối đa ${maxSize}MB`;
        }

        return null;
    }, [accept, maxSize]);

    // Extract duration from video/audio file
    const extractDuration = useCallback(async (file) => {
        if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
            return null;
        }

        try {
            return new Promise((resolve) => {
                const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
                media.src = URL.createObjectURL(file);
                
                media.onloadedmetadata = () => {
                    const duration = Math.round(media.duration); // Round to nearest second
                    URL.revokeObjectURL(media.src);
                    resolve(duration);
                };

                media.onerror = () => {
                    URL.revokeObjectURL(media.src);
                    resolve(null); // Return null if can't extract duration
                };

                // Timeout after 5 seconds
                setTimeout(() => {
                    URL.revokeObjectURL(media.src);
                    resolve(null);
                }, 5000);
            });
        } catch (error) {
            console.warn("Error extracting duration:", error);
            return null;
        }
    }, []);

    // Upload file
    const uploadFile = useCallback(async (file, options = {}) => {
        const { skipCrop = false } = options;
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            if (onError) onError(validationError);
            return;
        }

        if (!skipCrop && enableImageCrop && file.type.startsWith("image/")) {
            const previewUrl = URL.createObjectURL(file);
            setPendingFile(file);
            setPendingPreview(previewUrl);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setShowCropper(true);
            return;
        }

        setUploading(true);
        setUploadProgress(10);
        setError(null);
        if (onUploadingChange) onUploadingChange(true);

        try {
            // Create preview
            let previewUrl = null;
            if (showPreview && file.type.startsWith("image/")) {
                previewUrl = URL.createObjectURL(file);
                setPreview(previewUrl);
            } else if (showPreview && file.type.startsWith("audio/")) {
                previewUrl = URL.createObjectURL(file);
                setPreview(previewUrl);
            } else if (showPreview && file.type.startsWith("video/")) {
                previewUrl = URL.createObjectURL(file);
                setPreview(previewUrl);
            } else if (showPreview) {
                // For documents, we don't have a blob preview, so we use a custom protocol to store the filename
                previewUrl = `document:${file.name}`;
                setPreview(previewUrl);
            }

            // Extract duration for video/audio files
            setUploadProgress(30);
            let duration = null;
            if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
                duration = await extractDuration(file);
            }

            // Upload to temp storage
            setUploadProgress(50);
            const uploadResponse = await fileService.uploadTempFile(file, bucket, "temp");
            setUploadProgress(100);

            if (uploadResponse.data?.success && uploadResponse.data?.data) {
                const resultData = uploadResponse.data.data;
                const tempKey = resultData.TempKey || resultData.tempKey;
                const fileType = resultData.ImageType || resultData.imageType || resultData.FileType || resultData.fileType || file.type;

                if (!tempKey) {
                    throw new Error("Không nhận được TempKey từ server");
                }

                // Call success callback with file size and duration
                if (onUploadSuccess) {
                    onUploadSuccess(tempKey, fileType, previewUrl, file.size, duration);
                }
            } else {
                throw new Error(uploadResponse.data?.message || "Upload thất bại");
            }
        } catch (error) {
            // Handle backend validation errors (file size, etc.)
            let errorMessage = error.message || "Lỗi upload file";
            
            if (error.response?.data) {
                // Backend returns: { success: false, message: "...", maxSize: "100MB" }
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }
            
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
    }, [bucket, showPreview, existingUrl, onUploadSuccess, onError, onUploadingChange, validateFile, extractDuration, enableImageCrop]);

    // Process file
    const processFile = useCallback(async (file) => {
        if (!file) return;
        await uploadFile(file);
    }, [uploadFile]);

    const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedBlob = async (imageSrc, pixelCrop, fileType) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), fileType || "image/jpeg", 0.92);
        });
    };

    const handleCropCancel = () => {
        if (pendingPreview && pendingPreview.startsWith("blob:")) {
            URL.revokeObjectURL(pendingPreview);
        }
        setPendingFile(null);
        setPendingPreview(null);
        setShowCropper(false);
    };

    const handleCropConfirm = async () => {
        if (!pendingFile || !pendingPreview || !croppedAreaPixels) {
            handleCropCancel();
            return;
        }
        try {
            const croppedBlob = await getCroppedBlob(pendingPreview, croppedAreaPixels, pendingFile.type);
            if (!croppedBlob) {
                throw new Error("Không thể cắt ảnh");
            }
            const croppedFile = new File([croppedBlob], pendingFile.name, { type: pendingFile.type });
            handleCropCancel();
            await uploadFile(croppedFile, { skipCrop: true });
        } catch (cropError) {
            const errorMessage = cropError.message || "Lỗi khi cắt ảnh";
            setError(errorMessage);
            if (onError) onError(errorMessage);
            handleCropCancel();
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Handle paste from clipboard
    useEffect(() => {
        if (!enablePaste) return;

        const handlePaste = async (e) => {
            if (uploading) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (accept.includes("image") && item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        processFile(file);
                    }
                    break;
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [enablePaste, uploading, accept, processFile]);

    // Handle remove
    const handleRemove = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (onRemove) {
            onRemove();
        }
    };

    // Update preview when existingUrl changes
    useEffect(() => {
        if (existingUrl && !preview) {
            setPreview(existingUrl);
        }
    }, [existingUrl, preview]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    return (
        <div className="file-upload-container">
            <Modal
                show={showCropper}
                onHide={handleCropCancel}
                centered
                size="lg"
                dialogClassName="image-cropper-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Căn chỉnh ảnh</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="cropper-container">
                        {pendingPreview && (
                            <Cropper
                                image={pendingPreview}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropAspect}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div className="cropper-controls">
                        <label htmlFor="zoom" className="cropper-zoom-label">Zoom</label>
                        <input
                            id="zoom"
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCropCancel}>Hủy</Button>
                    <Button variant="primary" onClick={handleCropConfirm}>Dùng ảnh này</Button>
                </Modal.Footer>
            </Modal>
            {preview && showPreview ? (
                <div className={`file-preview-wrapper ${previewClassName}`}>
                    {preview.startsWith("blob:") || preview.startsWith("http") || preview.startsWith("document:") ? (
                        <>
                            {accept.includes("image") && !preview.startsWith("document:") && (
                                <img src={preview} alt="Preview" className="file-preview-image" />
                            )}
                            {accept.includes("audio") && !preview.startsWith("document:") && (
                                <audio src={preview} controls className="file-preview-audio" />
                            )}
                            {accept.includes("video") && !preview.startsWith("document:") && (
                                <video src={preview} controls className="file-preview-video" />
                            )}
                            {(!accept.includes("image") && !accept.includes("audio") && !accept.includes("video")) || preview.startsWith("document:") ? (
                                <div className="file-preview-document success-state">
                                    <div className="document-icon"><FaFileAlt /></div>
                                    <div className="document-info">
                                        <span className="document-success-text fw-bold text-success">
                                            {preview.startsWith("document:") ? preview.replace("document:", "") : "Đã tải lên thành công"}
                                        </span>
                                        <span className="document-hint text-muted small">File tài liệu đã được đính kèm</span>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="file-preview-placeholder">
                            {getFileTypeIcon()}
                            <span>File đã tải lên</span>
                        </div>
                    )}
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
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
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

            {error && (
                <div className="file-upload-error">{error}</div>
            )}
        </div>
    );
}
