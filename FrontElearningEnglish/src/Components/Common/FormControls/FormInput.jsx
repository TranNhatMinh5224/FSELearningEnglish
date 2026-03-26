import React from "react";
import "./FormControls.css";

const FormInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  icon: Icon,
  disabled = false,
  readOnly = false,
  className = "",
  hint,
  hintClassName,
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
        {Icon && <Icon className="input-icon-custom" />}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          className={`form-control-custom ${Icon ? "has-icon" : ""} ${hasError ? "is-invalid" : ""}`}
        />
      </div>

      <div className="d-flex justify-content-between align-items-start mt-1">
        <div className="flex-grow-1">
          {hasError && <div className="invalid-feedback-custom">{error}</div>}
          {hint && !hasError && (
            <small className={`${hintClassName || "text-muted"} small`}>{hint}</small>
          )}
        </div>
        
        {maxLength && (
          <small className={`char-counter-custom ${value?.length >= maxLength ? "at-limit" : ""}`}>
            {value?.length || 0} / {maxLength}
          </small>
        )}
      </div>
    </div>
  );
};

export default FormInput;
