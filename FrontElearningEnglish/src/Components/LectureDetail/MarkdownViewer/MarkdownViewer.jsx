import React from "react";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import DocumentViewer from "../DocumentViewer/DocumentViewer";
import ContentViewer from "../ContentViewer/ContentViewer";
import "./MarkdownViewer.css";

/**
 * MarkdownViewer (LectureViewer) - Parent component that switches between viewers
 * 
 * Type 1: Content -> ContentViewer (markdown)
 * Type 2: Document -> DocumentViewer (PDF/DOCX)
 * Type 3: Video -> VideoPlayer
 */
function MarkdownViewer({ lecture }) {
    const title = lecture?.title || lecture?.Title || "";
    const markdownContent = lecture?.markdownContent || lecture?.MarkdownContent || "";
    const type = lecture?.type || lecture?.Type || 1;
    const mediaUrl = lecture?.mediaUrl || lecture?.MediaUrl;
    const mediaType = lecture?.mediaType || lecture?.MediaType;
    const duration = lecture?.duration || lecture?.Duration;

    return (
        <div className="markdown-viewer">
            {/* Header with title */}
            <header className="lecture-header">
                <h1 className="lecture-title">{title}</h1>
            </header>

            <div className="lecture-content">
                {/* Type 3: Video */}
                {type === 3 && (
                    <div className="lecture-media-section mb-4">
                        <VideoPlayer
                            mediaUrl={mediaUrl}
                            title={title}
                            duration={duration}
                        />
                    </div>
                )}

                {/* Type 2: Document (PDF/DOCX) */}
                {type === 2 && (
                    <div className="lecture-media-section mb-4">
                        <DocumentViewer
                            mediaUrl={mediaUrl}
                            title={title}
                            mediaType={mediaType}
                        />
                    </div>
                )}

                {/* Markdown Content - shown for all types if available */}
                {markdownContent && markdownContent.trim().length > 0 && (
                    <ContentViewer
                        markdownContent={markdownContent}
                    />
                )}

                {/* No content message - only if no media AND no markdown */}
                {!mediaUrl && (!markdownContent || markdownContent.trim().length === 0) && (
                    <div className="no-content-message">
                        <p>Nội dung bài giảng đang được cập nhật...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

MarkdownViewer.displayName = "MarkdownViewer";

export default MarkdownViewer;
