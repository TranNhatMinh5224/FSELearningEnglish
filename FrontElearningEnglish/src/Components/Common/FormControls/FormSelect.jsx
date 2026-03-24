import React from "react";
import "./FormControls.css";

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options = [],
  required = false,
  disabled = false,
  className = "",
  hint,
  placeholder = "Chọn một tùy chọn...",
  loading = false,
}) => {
  const hasError = touched && error;

  return (
    <div className={`form-control-wrapper ${className}`}>
      {label && (
        <label htmlFor={name} className={`form-label-custom ${required ? "required" : ""}`}>
          {label}
        </label>
      )}

      <div className="input-container-custom">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled || loading}
          className={`form-control-custom select-custom ${hasError ? "is-invalid" : ""}`}
        >
          {loading ? (
            <option value={value}>Đang tải...</option>
          ) : (
            <>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="mt-1">
        {hasError && <div className="invalid-feedback-custom">{error}</div>}
        {hint && !hasError && <small className="text-muted small">{hint}</small>}
      </div>
    </div>
  );
};

export default FormSelect;
