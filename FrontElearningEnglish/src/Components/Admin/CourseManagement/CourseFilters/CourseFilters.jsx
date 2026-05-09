import React from "react";
import { MdFilterList } from "react-icons/md";
import AdminSearch from "../../../Common/AdminSearch/AdminSearch";
import CourseTypeFilter from "../../../Common/CourseTypeFilter/CourseTypeFilter";
import "./CourseFilters.css";

export default function CourseFilters({ activeTab, setActiveTab, searchTerm, setSearchTerm, onSearch }) {
  return (
    <div className="course-filters-container">
      <div className="filters-content">
        <CourseTypeFilter 
          activeType={activeTab}
          onTypeChange={setActiveTab}
        />

        <div className="filter-right">
          <AdminSearch 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={onSearch}
            placeholder="Tìm kiếm khóa học..."
          />
          <button className="btn-filter">
            <MdFilterList />
          </button>
        </div>
      </div>
    </div>
  );
}
