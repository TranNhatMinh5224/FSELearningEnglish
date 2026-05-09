import React from "react";
import { MdSearch, MdClose } from "react-icons/md";
import "./AdminSearch.css";

export default function AdminSearch({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search...", 
  className = "" 
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const handleClear = () => {
    onChange({ target: { value: "" } });
    if (onSearch) {
      setTimeout(onSearch, 0);
    }
  };

  return (
    <div className={`admin-search-wrapper ${className}`}>
      <div className="admin-search-container">
        <div className="search-input-group">
          <MdSearch className="search-icon-main" />
          <input
            type="text"
            className="admin-search-input"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
          />
          {value && (
            <button className="search-clear-btn" onClick={handleClear} title="Clear search">
              <MdClose />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
