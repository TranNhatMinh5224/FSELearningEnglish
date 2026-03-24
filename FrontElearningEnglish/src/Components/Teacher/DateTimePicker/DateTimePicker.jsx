import React, { useState, useRef, useEffect } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import "./DateTimePicker.css";

export default function DateTimePicker({ 
  value, 
  onChange, 
  min, 
  max,
  placeholder = "dd/mm/yyyy",
  hasError = false,
  disabled = false,
  label = "",
  required = false,
  dateOnly = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const pickerRef = useRef(null);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        // Format date: dd/mm/yyyy
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        setInputValue(formattedDate);
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Parse date string (dd/mm/yyyy) to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    // Validate date
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return null;
    }
    
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) return null;
    
    // Set time to start of day for dateOnly mode
    if (dateOnly) {
      dateObj.setHours(0, 0, 0, 0);
    }
    
    // Validate min/max
    if (min && dateObj < min) return null;
    if (max && dateObj > max) return null;
    
    return dateObj;
  };

  // Handle input change - Robust digit-only masking
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    
    // 1. Get digits only, max 8 (ddmmyyyy)
    let digits = rawValue.replace(/\D/g, "").slice(0, 8);
    
    // 2. Format to dd/mm/yyyy
    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += "/" + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += "/" + digits.slice(4, 8);
    }
    
    setInputValue(formatted);
    
    // 3. Notify parent if complete and valid
    if (formatted.length === 10) {
      const dateObj = parseDate(formatted);
      if (dateObj) {
        onChange(dateObj);
      }
    } else {
      onChange(null);
    }
  };

  // Handle input blur - ensure formatting
  const handleInputBlur = () => {
    if (inputValue && inputValue.length < 10) {
      // Potentially clear or notify user, but keeping it simple for now
    }
  };

  // Set to today
  const handleTodayClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    setInputValue(formattedDate);
    onChange(today);
    setIsOpen(false);
  };

  // Get max date in YYYY-MM-DD format
  const getMaxDate = () => {
    if (!max) return null;
    const year = max.getFullYear();
    const month = String(max.getMonth() + 1).padStart(2, "0");
    const day = String(max.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get min date in YYYY-MM-DD format
  const getMinDate = () => {
    if (!min) return null;
    const year = min.getFullYear();
    const month = String(min.getMonth() + 1).padStart(2, "0");
    const day = String(min.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Convert input value to YYYY-MM-DD for native date input
  const getInputDateValue = () => {
    if (inputValue.length === 10) {
      const dateObj = parseDate(inputValue);
      if (dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  };

  const isDateValid = inputValue.length === 10 && parseDate(inputValue) !== null;

  return (
    <div className="datetime-picker-wrapper" ref={pickerRef}>
      {label && (
        <label className={`datetime-picker-label ${required ? "required" : ""}`}>
          {label}
        </label>
      )}
    <div className={`datetime-picker-input-container ${hasError ? "has-error" : ""} ${disabled ? "disabled" : ""} ${isDateValid ? "valid" : ""}`}>
        <input
          type="text"
          className="datetime-picker-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(false)}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
        />
        <button
          type="button"
          className="datetime-picker-icon-btn"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          title="Chọn ngày từ lịch"
        >
          <FaCalendarAlt className="datetime-picker-icon" />
        </button>
      </div>
      
      {isOpen && !disabled && (
        <div className="datetime-picker-calendar-overlay" onClick={() => setIsOpen(false)}>
          <div className="datetime-picker-calendar-popup glassmorphism" onClick={(e) => e.stopPropagation()}>
            <div className="datetime-picker-calendar-header">
              <span className="premium-gradient-text">🗓️ Chọn ngày</span>
              <button
                type="button"
                className="datetime-picker-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="datetime-picker-calendar-body">
              <input
                type="date"
                className="datetime-picker-native-input"
                value={getInputDateValue()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate) {
                    const dateObj = new Date(selectedDate);
                    if (!isNaN(dateObj.getTime())) {
                      const day = String(dateObj.getDate()).padStart(2, "0");
                      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                      const year = dateObj.getFullYear();
                      setInputValue(`${day}/${month}/${year}`);
                      onChange(dateObj);
                      setIsOpen(false);
                    }
                  }
                }}
                min={getMinDate() || undefined}
                max={getMaxDate() || undefined}
                autoFocus
              />
              <button 
                type="button"
                className="btn-today-quick"
                onClick={handleTodayClick}
              >
                Hôm nay
              </button>
            </div>
            <div className="datetime-picker-hint">
              Tips: Có thể nhập nhanh: {placeholder}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
