import React from "react";
import { FaDownload, FaExternalLinkAlt, FaFilePdf, FaFileWord, FaFileAlt, FaEye } from "react-icons/fa";
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
            <div className="document-frame-wrapper">
                <iframe
                    src={viewerUrl}
                    className="document-iframe"
                    title="Document Viewer"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
        </div>
    );
}
