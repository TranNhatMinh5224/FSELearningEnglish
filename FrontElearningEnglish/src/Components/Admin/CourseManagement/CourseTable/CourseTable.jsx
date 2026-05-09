import React from "react";
import { MdEdit, MdDelete, MdVisibility, MdMenuBook } from "react-icons/md";
import { PiGraduationCapDuotone } from "react-icons/pi";
import { useAssets } from "../../../../Context/AssetContext";
import ImageWithIconFallback from "../../../Common/ImageWithIconFallback/ImageWithIconFallback";
import CustomPagination from "../../../Common/Pagination/CustomPagination";
import "./CourseTable.css";

export default function CourseTable({ 
  courses, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange
}) {
  const { getDefaultCourseImage } = useAssets();
  const defaultCourseImage = getDefaultCourseImage();
  
  const formatPrice = (price) => {
    if (price === 0 || !price) {
      return <span className="price-free">Free</span>;
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getTypeBadge = (type) => {
    return type === 1 
      ? <span className="type-badge type-system">System</span> 
      : <span className="type-badge type-teacher">Teacher</span>;
  };

  return (
    <div className="course-table-container">
      <div className="table-responsive">
        <table className="course-table">
          <thead>
            <tr>
              <th style={{width: '35%'}}>Course Name</th>
              <th style={{width: '18%'}}>Instructor</th>
              <th style={{width: '12%'}}>Type</th>
              <th style={{width: '12%'}}>Price</th>
              <th style={{width: '10%'}} className="text-center">Students</th>
              <th style={{width: '13%'}} className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody className={loading ? "table-loading-fade" : ""}>
            {loading && courses.length === 0 ? (
              // Show skeleton rows ONLY on initial load
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td>
                    <div className="course-info">
                      <div className="skeleton skeleton-thumbnail"></div>
                      <div className="table-course-details">
                        <div className="skeleton skeleton-title"></div>
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                  <td><div className="skeleton skeleton-badge"></div></td>
                  <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                  <td className="text-center"><div className="skeleton skeleton-text" style={{ width: '40px', margin: '0 auto' }}></div></td>
                  <td>
                    <div className="action-buttons">
                      <div className="skeleton skeleton-circle"></div>
                      <div className="skeleton skeleton-circle"></div>
                      <div className="skeleton skeleton-circle"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  <div className="no-data-content">
                    <MdMenuBook size={48} className="mb-3 opacity-20" />
                    <p>No courses found</p>
                  </div>
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr 
                  key={course.courseId}
                  onClick={() => onView(course.courseId)}
                  style={{ cursor: 'pointer' }}
                  className="course-row-clickable"
                >
                  <td>
                    <div className="course-info">
                      <ImageWithIconFallback
                        imageUrl={course.imageUrl}
                        fallbackImageUrl={defaultCourseImage}
                        icon={<PiGraduationCapDuotone size={28} />}
                        alt="Course"
                        className="course-thumbnail"
                      />
                      <div className="table-course-details">
                        <div className="table-course-title">{course.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{course.teacherName || "System Admin"}</td>
                  <td>{getTypeBadge(course.type)}</td>
                  <td>{formatPrice(course.price)}</td>
                  <td className="text-center">{course.studentCount || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="table-action-btn action-view" 
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(course.courseId);
                        }}
                      >
                        <MdVisibility />
                      </button>
                      <button 
                        className="table-action-btn action-edit" 
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(course);
                        }}
                      >
                        <MdEdit />
                      </button>
                      <button 
                        className="table-action-btn action-delete" 
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(course.courseId);
                        }}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <CustomPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
