import React, { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./FormControls.css";

const FormTextArea = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  maxLength,
  showMarkdownPreview = false,
  rows = 4,
  disabled = false,
  className = "",
  hint,
}, ref) => {
  const hasError = touched && error;

  return (
    <div className={`form-control-wrapper ${className}`}>
      {label && (
        <label htmlFor={name} className={`form-label-custom ${required ? "required" : ""}`}>
          {label}
        </label>
      )}

      <div className={showMarkdownPreview ? "markdown-editor-container" : ""}>
        <div className={showMarkdownPreview ? "markdown-editor-left" : "input-container-custom"}>
          <textarea
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            disabled={disabled}
            className={`form-control-custom textarea-custom ${hasError ? "is-invalid" : ""}`}
          />
        </div>

        {showMarkdownPreview && (
          <div className="markdown-editor-right">
            <div className="markdown-preview">
              {value && value.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              ) : (
                <div className="markdown-preview-empty">
                  <p>Xem trước sẽ hiển thị ở đây...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-start mt-1">
        <div className="flex-grow-1">
          {hasError && <div className="invalid-feedback-custom">{error}</div>}
          {hint && !hasError && <small className="text-muted small">{hint}</small>}
        </div>
        
        {maxLength && (
          <small className={`char-counter-custom ${value?.length >= maxLength ? "at-limit" : ""}`}>
            {(value?.length || 0).toLocaleString("vi-VN")} / {maxLength.toLocaleString("vi-VN")}
          </small>
        )}
      </div>
    </div>
  );
});

FormTextArea.displayName = "FormTextArea";

export default FormTextArea;
