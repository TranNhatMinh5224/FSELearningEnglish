import React, { useState, useEffect, useRef } from "react";
import { FaDownload, FaExternalLinkAlt, FaFilePdf, FaFileWord, FaFileAlt, FaEye } from "react-icons/fa";
import { Spinner } from "react-bootstrap";
import * as docx from "docx-preview";
import "./DocumentViewer.css";

export default function DocumentViewer({
    mediaUrl,
    title,
    mediaType
}) {
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    // Determine extension
    let isPdf = false;
    let isDocx = false;
    if (mediaType?.toLowerCase().includes('pdf') || mediaUrl?.toLowerCase().includes('.pdf')) isPdf = true;
    else if (mediaType?.toLowerCase().includes('word') || mediaType?.toLowerCase().includes('doc') || mediaUrl?.toLowerCase().includes('.doc')) isDocx = true;

    // Load Docx explicitly
    useEffect(() => {
        if (!mediaUrl) return;
        if (!isDocx) return; // Only run this effect for DOCX files

        let isMounted = true;
        setIsLoading(true);
        
        const loadDocxData = async () => {
            try {
                const response = await fetch(mediaUrl);
                if (!response.ok) throw new Error("Lỗi tải file");
                
                const blob = await response.blob();

                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = "";
                    
                    await docx.renderAsync(blob, containerRef.current, null, {
                        className: "docx-inner-view",
                        inWrapper: true,
                        ignoreLastRenderedPageBreak: true,
                        useBase64: true, // Faster for local files
                        debug: false
                    });
                    
                    if (isMounted) setIsLoading(false);
                }
            } catch (error) {
                console.error("Lỗi khi dựng file DOCX:", error);
                if (isMounted) setIsLoading(false);
            }
        };

        loadDocxData();
        return () => { isMounted = false; };
    }, [mediaUrl, isDocx]);

    const handlePdfLoad = () => {
        if (!isPdf) return;
        setIsLoading(false);
    };

    const getFileIcon = () => {
        if (isPdf) return <FaFilePdf />;
        if (isDocx) return <FaFileWord />;
        return <FaFileAlt />;
    };

    const getFileTypeLabel = () => {
        if (isPdf) return "PDF Document";
        if (isDocx) return "Word Document";
        return "Tài liệu";
    };

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
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" download className="document-btn document-btn--download">
                        <FaDownload />
                        <span>Tải xuống</span>
                    </a>
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="document-btn document-btn--external">
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

            {/* Document wrapper */}
            <div className={`document-frame-wrapper ${isLoading ? 'is-loading' : ''}`} style={{ minHeight: "600px", backgroundColor: "#fff" }}>
                {isLoading && (
                    <div className="document-loading-overlay">
                        <Spinner animation="border" variant="primary" className="document-loading-spinner" />
                        <div className="document-loading-text">
                            <p className="fw-bold mb-1">Đang tải và dựng tài liệu</p>
                            <span className="text-muted small">Vui lòng đợi giây lát...</span>
                        </div>
                    </div>
                )}
                
                {/* PDF Viewer - Native Browser Iframe */}
                {isPdf && (
                    <object 
                        data={mediaUrl} 
                        type="application/pdf"
                        className="document-iframe"
                        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease', height: '100%', width: '100%', display: 'block' }}
                        onLoad={handlePdfLoad}
                    >
                        <iframe
                            src={mediaUrl}
                            className="document-iframe"
                            title="PDF Viewer"
                            onLoad={handlePdfLoad}
                            style={{ height: '100%', width: '100%' }}
                        />
                    </object>
                )}

                {/* DOCX Viewer - docx-preview Native Canvas */}
                {isDocx && (
                    <div 
                        ref={containerRef} 
                        className="docx-render-container"
                        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}
                    >
                        {/* docx-preview injects HTML elements here */}
                    </div>
                )}

                {!isPdf && !isDocx && (
                    <div className="text-center p-5 text-muted">
                        <p>Định dạng tài liệu này không hỗ trợ xem trước. Vui lòng tải xuống để xem.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
