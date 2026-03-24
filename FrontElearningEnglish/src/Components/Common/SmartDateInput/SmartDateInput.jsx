import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./SmartDateInput.css";

// Helper to pad numbers
function pad(n) {
  return String(n).padStart(2, "0");
}

// Robust parsing from dd/mm/yyyy hh:mm
function parseDateTime(dateStr, timeStr = "00:00") {
  const dateDigits = dateStr.replace(/\D/g, "");
  if (dateDigits.length !== 8) return null;
  
  const day = parseInt(dateDigits.slice(0, 2), 10);
  const month = parseInt(dateDigits.slice(2, 4), 10) - 1;
  const year = parseInt(dateDigits.slice(4, 8), 10);
  
  const [hours, minutes] = timeStr.split(":").map(s => parseInt(s, 10) || 0);
  
  const date = new Date(year, month, day, hours, minutes);
  
  // Validation
  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return date;
  }
  return null;
}

export default function SmartDateInput({
  label,
  value,
  onChange,
  minDate,
  compareAfter,
  required,
  showTime = true,
}) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [time, setTime] = useState("00:00");
  const [error, setError] = useState(null);
  
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      setDay(pad(value.getDate()));
      setMonth(pad(value.getMonth() + 1));
      setYear(String(value.getFullYear()));
      setTime(`${pad(value.getHours())}:${pad(value.getMinutes())}`);
      setError(null);
    } else if (!value) {
      setDay("");
      setMonth("");
      setYear("");
      setTime("00:00");
    }
  }, [value, showTime]);

  // Re-validate when compareAfter changes
  useEffect(() => {
    if (day && month && year) {
      validateAndNotify(day, month, year, time);
    }
  }, [compareAfter]);

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(val);
    if (val.length === 2) monthRef.current?.focus();
    validateAndNotify(val, month, year, time);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMonth(val);
    if (val.length === 2) yearRef.current?.focus();
    validateAndNotify(day, val, year, time);
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(val);
    if (val.length === 4 && showTime) timeRef.current?.focus();
    validateAndNotify(day, month, val, time);
  };

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setTime(val);
    validateAndNotify(day, month, year, val);
  };

  const handleKeyDown = (e, current) => {
    if (e.key === "Backspace" && !e.target.value) {
      if (current === "month") dayRef.current?.focus();
      if (current === "year") monthRef.current?.focus();
      if (current === "time") yearRef.current?.focus();
    }
  };

  const validateAndNotify = (d, m, y, t) => {
    if (d.length < 1 || m.length < 1 || y.length < 4) {
      setError(null);
      return;
    }

    const dd = parseInt(d, 10);
    const mm = parseInt(m, 10) - 1;
    const yyyy = parseInt(y, 10);
    const [hh, min] = t.split(":").map(s => parseInt(s, 10));

    const date = new Date(yyyy, mm, dd, hh, min);
    
    // Check validity
    if (date.getFullYear() !== yyyy || date.getMonth() !== mm || date.getDate() !== dd) {
      setError("Ngày tháng không hợp lệ");
      return;
    }

    // MinDate check (Strict)
    const now = new Date();
    now.setSeconds(0, 0); // Ignore seconds/ms to avoid "false past" errors for current minute
    
    if (minDate && date < now) {
      setError("Không được chọn thời gian trong quá khứ");
      return;
    }

    // compareAfter check
    if (compareAfter && date <= compareAfter) {
      setError("Phải sau thời điểm bắt đầu");
      return;
    }

    setError(null);
    onChange && onChange(date);
  };

  return (
    <div className={`smart-segmented-group ${error ? 'has-error' : ''}`}>
      <label className="smart-segmented-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      
      <div className="segmented-input-container">
        <div className="date-segments-wrapper">
          <input
            ref={dayRef}
            type="text"
            className="segment-input day"
            value={day}
            onChange={handleDayChange}
            placeholder="DD"
            maxLength={2}
          />
          <span className="segment-separator">/</span>
          <input
            ref={monthRef}
            type="text"
            className="segment-input month"
            value={month}
            onChange={handleMonthChange}
            onKeyDown={(e) => handleKeyDown(e, "month")}
            placeholder="MM"
            maxLength={2}
          />
          <span className="segment-separator">/</span>
          <input
            ref={yearRef}
            type="text"
            className="segment-input year"
            value={year}
            onChange={handleYearChange}
            onKeyDown={(e) => handleKeyDown(e, "year")}
            placeholder="YYYY"
            maxLength={4}
          />
        </div>
        
        {showTime && (
          <div className="time-segment-wrapper">
            <input
              ref={timeRef}
              type="time"
              className="segment-input-time"
              value={time}
              onChange={handleTimeChange}
              onKeyDown={(e) => handleKeyDown(e, "time")}
            />
          </div>
        )}
      </div>
      
      {error && <div className="segment-error-msg">{error}</div>}
    </div>
  );
}

SmartDateInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func,
  minDate: PropTypes.instanceOf(Date),
  compareAfter: PropTypes.instanceOf(Date),
  required: PropTypes.bool,
  showTime: PropTypes.bool,
};
