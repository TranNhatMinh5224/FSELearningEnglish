import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FaCalendarAlt, FaRegClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // For calendar navigation
  
  const containerRef = useRef(null);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const timeRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setTime(""); 
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

  // Handle manual time input to prevent browser picker
  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Keep only digits
    if (val.length > 4) val = val.slice(0, 4);
    
    let formattedTime = "";
    if (val.length <= 2) {
      formattedTime = val;
    } else {
      // Format as HH:MM
      formattedTime = val.slice(0, 2) + ":" + val.slice(2);
    }
    
    setTime(formattedTime);
    
    // Only validate and notify parent when we have a full HH:MM or valid partial that makes sense
    if (formattedTime.length === 5) {
      const hh = parseInt(val.slice(0, 2), 10);
      const mm = parseInt(val.slice(2, 4), 10);
      if (hh <= 23 && mm <= 59) {
        validateAndNotify(day, month, year, formattedTime);
      } else {
        setError("Giờ hoặc phút không hợp lệ");
      }
    } else {
      setError(null);
    }
  };

  const handleKeyDown = (e, current) => {
    if (e.key === "Backspace" && !e.target.value) {
      if (current === "month") dayRef.current?.focus();
      if (current === "year") monthRef.current?.focus();
      if (current === "time") yearRef.current?.focus();
    }
  };

  const validateAndNotify = (d, m, y, t) => {
    if (!d || !m || !y || d.length < 1 || m.length < 1 || y.length < 4) {
      setError(null);
      return;
    }

    const dd = parseInt(d, 10);
    const mm = parseInt(m, 10) - 1;
    const yyyy = parseInt(y, 10);
    
    // Ensure time has hh:mm format
    const timeToUse = t || "00:00";
    if (!timeToUse.includes(":")) return;
    const [hh, min] = timeToUse.split(":").map(s => parseInt(s, 10));

    const date = new Date(yyyy, mm, dd, hh, min);
    
    // Check validity
    if (date.getFullYear() !== yyyy || date.getMonth() !== mm || date.getDate() !== dd) {
      setError("Ngày tháng không hợp lệ");
      return;
    }

    // MinDate check (Strict)
    const now = new Date();
    now.setSeconds(0, 0); 
    
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

  // --- Calendar Popover Logic ---
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateSelect = (d, m, y) => {
    const paddedDay = pad(d);
    const paddedMonth = pad(m + 1);
    setDay(paddedDay);
    setMonth(paddedMonth);
    setYear(String(y));
    validateAndNotify(paddedDay, paddedMonth, String(y), time);
    setShowCalendar(false);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const renderCalendar = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year);
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    
    const days = [];
    // Fill empty slots
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    
    // Fill actual days
    for (let d = 1; d <= totalDays; d++) {
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      const isSelected = day === pad(d) && month === pad(month + 1) && year === viewDate.getFullYear();
      
      days.push(
        <div 
          key={d} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateSelect(d, month, year)}
        >
          {d}
        </div>
      );
    }

    return (
      <div className="ultimate-calendar-popover">
        <div className="calendar-header">
          <button type="button" onClick={() => changeMonth(-1)}><FaChevronLeft /></button>
          <span>{monthNames[month]} {year}</span>
          <button type="button" onClick={() => changeMonth(1)}><FaChevronRight /></button>
        </div>
        <div className="calendar-weekdays">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d} className="weekday">{d}</div>)}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="ultimate-date-input-group" ref={containerRef}>
      {label && (
        <div className="ultimate-label-wrapper">
          <span className="ultimate-label">{label}</span>
          {required && <span className="ultimate-required">*</span>}
        </div>
      )}
      
      <div className={`ultimate-input-container ${error ? 'has-error' : ''}`}>
        <div className="ultimate-date-section">
          <div className="icon-clickable-wrapper" onClick={() => setShowCalendar(!showCalendar)}>
            <FaCalendarAlt className="ultimate-icon clickable" />
          </div>
          <div className="ultimate-segments">
            <input
              ref={dayRef}
              type="text"
              className="ultimate-segment day"
              value={day}
              onChange={handleDayChange}
              onFocus={(e) => e.target.select()}
              placeholder="DD"
              maxLength={2}
            />
            <span className="ultimate-divider">/</span>
            <input
              ref={monthRef}
              type="text"
              className="ultimate-segment month"
              value={month}
              onChange={handleMonthChange}
              onKeyDown={(e) => handleKeyDown(e, "month")}
              onFocus={(e) => e.target.select()}
              placeholder="MM"
              maxLength={2}
            />
            <span className="ultimate-divider">/</span>
            <input
              ref={yearRef}
              type="text"
              className="ultimate-segment year"
              value={year}
              onChange={handleYearChange}
              onKeyDown={(e) => handleKeyDown(e, "year")}
              onFocus={(e) => e.target.select()}
              placeholder="YYYY"
              maxLength={4}
            />
          </div>
        </div>

        <div className="ultimate-separator"></div>

        <div className="ultimate-time-section">
          <FaRegClock className="ultimate-icon" />
            <input
              ref={timeRef}
              type="text"
              className="ultimate-time-input"
              value={time}
              onChange={handleTimeChange}
              onKeyDown={(e) => handleKeyDown(e, "time")}
              onFocus={(e) => e.target.select()}
              placeholder="00:00"
              maxLength={5}
            />
        </div>

        {showCalendar && renderCalendar()}
      </div>
      
      {error && (
        <div className="ultimate-error-msg">
          <span className="error-indicator">!</span>
          {error}
        </div>
      )}
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
