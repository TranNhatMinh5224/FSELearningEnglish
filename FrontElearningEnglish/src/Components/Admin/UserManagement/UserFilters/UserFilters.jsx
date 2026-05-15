import React from "react";
import AdminSearch from "../../../Common/AdminSearch/AdminSearch";
import "./UserFilters.css";

export default function UserFilters({ activeTab, setActiveTab, searchTerm, setSearchTerm, onSearch }) {
  return (
    <div className="user-filters-container">
      <div className="filters-content">
        <div className="btn-group" role="group">
          <button 
            className={`filter-tab ${activeTab === 'all' ? 'active-all' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
          <button 
            className={`filter-tab ${activeTab === 'teachers' ? 'active-teachers' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            Teachers Only
          </button>
          <button 
            className={`filter-tab ${activeTab === 'blocked' ? 'active-blocked' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            Blocked Accounts
          </button>
        </div>

        <AdminSearch 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={onSearch}
          placeholder="Tìm kiếm người dùng..."
          className="user-search-bar"
        />
      </div>
    </div>
  );
}
