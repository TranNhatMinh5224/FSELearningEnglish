import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ContentViewer.css";

/**
 * ContentViewer Component
 * Renders markdown content for lecture (type 1)
 */
export default function ContentViewer({
    title,
    markdownContent
}) {
    if (!markdownContent || markdownContent.trim().length === 0) {
        return (
            <div className="content-viewer-empty">
                <p>Nội dung bài giảng đang được cập nhật...</p>
            </div>
        );
    }

    return (
        <div className="content-viewer">
            {title && (
                <header className="content-header">
                    <h1 className="content-title">{title}</h1>
                </header>
            )}
            <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownContent}
                </ReactMarkdown>
            </div>
        </div>
    );
}
