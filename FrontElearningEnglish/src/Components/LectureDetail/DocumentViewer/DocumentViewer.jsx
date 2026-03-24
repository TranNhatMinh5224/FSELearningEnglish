import React, { useState, useEffect } from "react";
import { FaDownload, FaExternalLinkAlt, FaFilePdf, FaFileWord, FaFileAlt, FaEye } from "react-icons/fa";
import { Spinner } from "react-bootstrap";
import "./DocumentViewer.css";

/**
 * DocumentViewer Component
 * Displays PDF/DOCX documents with Google Docs viewer iframe
 */
export default function DocumentViewer({
    mediaUrl,
    title,
    mediaType
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    // Simulate progress since iframe doesn't give us real progress events
    useEffect(() => {
        if (!isLoading) return;

        // Start progress quickly, then slow down as it gets closer to 100
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 50) return prev + Math.floor(Math.random() * 10) + 5; // Fast to 50%
                if (prev < 80) return prev + Math.floor(Math.random() * 5) + 2;  // Medium to 80%
                if (prev < 90) return prev + 1; // Slow to 90%
                if (prev < 98) return prev + 0.5; // Very slow to 98%
                return prev; // Stop at 98% until actually loaded
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isLoading]);

    const handleLoad = () => {
        setProgress(100);
        setTimeout(() => {
            setIsLoading(false);
        }, 500); // Wait half a second at 100% before hiding
    };

    // Get file icon based on type
    const getFileIcon = () => {
        if (!mediaType) return <FaFileAlt />;
        const type = mediaType.toLowerCase();
        if (type.includes('pdf')) return <FaFilePdf />;
        if (type.includes('word') || type.includes('doc')) return <FaFileWord />;
        return <FaFileAlt />;
    };

    // Get file type label
    const getFileTypeLabel = () => {
        if (!mediaType) return "Tài liệu";
        const type = mediaType.toLowerCase();
        if (type.includes('pdf')) return "PDF Document";
        if (type.includes('word') || type.includes('doc')) return "Word Document";
        if (type.includes('text')) return "Text File";
        return "Tài liệu";
    };

    // Google Docs viewer URL
    const viewerUrl = mediaUrl
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(mediaUrl)}&embedded=true`
        : null;

    if (!mediaUrl) {
        return (
            <div className="document-viewer-empty">
                <FaFileAlt className="empty-icon" />
                <p>Tài liệu chưa được tải lên</p>
            </div>
        );
    }

    return (
        <div className="document-viewer-container">
            {/* Toolbar */}
            <div className="document-toolbar">
                <div className="document-info">
                    <span className="document-icon">{getFileIcon()}</span>
                    <div className="document-details">
                        <span className="document-title">{title || "Tài liệu"}</span>
                        <span className="document-type">{getFileTypeLabel()}</span>
                    </div>
                </div>

                <div className="document-actions">
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="document-btn document-btn--download"
                    >
                        <FaDownload />
                        <span>Tải xuống</span>
                    </a>
                    <a
                        href={viewerUrl.replace('&embedded=true', '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-btn document-btn--external"
                    >
                        <FaExternalLinkAlt />
                        <span>Mở tab mới</span>
                    </a>
                </div>
            </div>

            {/* Preview indicator */}
            <div className="document-preview-header">
                <FaEye className="preview-icon" />
                <span>Xem trước tài liệu</span>
            </div>

            {/* Document iframe */}
            <div className={`document-frame-wrapper ${isLoading ? 'is-loading' : ''}`}>
                {isLoading && (
                    <div className="document-loading-overlay">
                        <Spinner animation="border" variant="primary" className="document-loading-spinner" />
                        <div className="document-loading-text">
                            <p className="fw-bold mb-1">Đang tải và dựng tài liệu</p>
                            <span className="text-muted small">Vui lòng đợi giây lát, quá trình này phụ thuộc vào dung lượng file...</span>
                        </div>
                        <div className="document-progress-container mt-3">
                            <div className="document-progress-bar" style={{ width: `${progress}%` }}></div>
                            <div className="document-progress-text">{Math.floor(progress)}%</div>
                        </div>
                    </div>
                )}
                <iframe
                    src={viewerUrl}
                    className="document-iframe"
                    title="Document Viewer"
                    allowFullScreen
                    loading="lazy"
                    onLoad={handleLoad}
                    style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}
                />
            </div>
        </div>
    );
}
