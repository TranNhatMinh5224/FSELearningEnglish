import React, { useRef } from "react";
import { FaClock, FaCaretUp, FaCaretDown } from "react-icons/fa";
import "./DurationInput.css";

const presets = [
  { label: "15p", value: 15 },
  { label: "30p", value: 30 },
  { label: "45p", value: 45 },
  { label: "60p", value: 60 },
  { label: "90p", value: 90 },
  { label: "120p", value: 120 },
];

export default function DurationInput({ label, hours, minutes, seconds, onChange, required }) {
  const hRef = useRef(null);
  const mRef = useRef(null);
  const sRef = useRef(null);

  const handleHChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(val || "0", 10);
    onChange({ hours: Math.min(23, num), minutes, seconds });
    if (val.length === 2) mRef.current?.focus();
  };

  const handleMChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(val || "0", 10);
    onChange({ hours, minutes: Math.min(59, num), seconds });
    if (val.length === 2) sRef.current?.focus();
  };

  const handleSChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    const num = parseInt(val || "0", 10);
    onChange({ hours, minutes, seconds: Math.min(59, num) });
  };

  const adjustValue = (type, delta) => {
    if (type === 'h') onChange({ hours: Math.min(23, Math.max(0, hours + delta)), minutes, seconds });
    if (type === 'm') onChange({ hours, minutes: Math.min(59, Math.max(0, minutes + delta)), seconds });
    if (type === 's') onChange({ hours, minutes, seconds: Math.min(59, Math.max(0, seconds + delta)) });
  };

  const handleWheel = (e, type) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    adjustValue(type, delta);
  };

  const handleKeyDown = (e, current) => {
    if (e.key === "Backspace" && !e.target.value) {
      if (current === "m") hRef.current?.focus();
      if (current === "s") mRef.current?.focus();
    }
    if (e.key === "ArrowUp") { e.preventDefault(); adjustValue(current, 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); adjustValue(current, -1); }
  };

  const handlePresetClick = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = 0;
    onChange({ hours: h, minutes: m, seconds: s });
  };

  const renderSegment = (ref, value, type, label, max, nextRef) => (
    <div className="pixel-segment-item">
      <div className="pixel-box-container">
        <input
          ref={ref}
          type="text"
          className="pixel-input"
          value={hours === 0 && minutes === 0 && seconds === 0 ? "" : String(value).padStart(1, "0")}
          onChange={(e) => {
            if (type === 'h') handleHChange(e);
            if (type === 'm') handleMChange(e);
            if (type === 's') handleSChange(e);
          }}
          onKeyDown={(e) => handleKeyDown(e, type)}
          onWheel={(e) => handleWheel(e, type)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          maxLength={2}
        />
        <div className="pixel-stepper-arrows">
          <FaCaretUp className="pixel-arrow" onClick={() => adjustValue(type, 1)} />
          <FaCaretDown className="pixel-arrow" onClick={() => adjustValue(type, -1)} />
        </div>
      </div>
      <span className="pixel-sub-label">{label}</span>
    </div>
  );

  return (
    <div className="pixel-perfect-duration-group">
      {label && (
        <label className="duration-main-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="duration-boxes-row">
        {renderSegment(hRef, hours, 'h', 'GIỜ', 23, mRef)}
        {renderSegment(mRef, minutes, 'm', 'PHÚT', 59, sRef)}
        {renderSegment(sRef, seconds, 's', 'GIÂY', 59, null)}
      </div>

      <div className="duration-presets-minimal">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`min-preset-btn ${(hours * 60 + minutes) === p.value ? "active" : ""}`}
            onClick={() => handlePresetClick(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
