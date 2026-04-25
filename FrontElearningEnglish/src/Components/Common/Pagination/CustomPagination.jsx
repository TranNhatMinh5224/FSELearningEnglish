import React from 'react';
import { Pagination } from 'react-bootstrap';
import './CustomPagination.css';

export default function CustomPagination({ 
  currentPage = 1, 
  totalPages = 1, 
  totalCount = 0, 
  pageSize = 10, 
  onPageChange,
  showInfo = true 
}) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="custom-pagination-wrapper d-flex flex-column flex-md-row justify-content-between align-items-center mt-4">
      {showInfo && totalCount > 0 ? (
        <div className="pagination-info text-muted small mb-3 mb-md-0">
          Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> - <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> records
        </div>
      ) : <div />}

      <Pagination className="mb-0 custom-pagination">
        <Pagination.First 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        />
        
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          
          if (
            page === 1 || 
            page === totalPages || 
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Pagination.Item>
            );
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return <Pagination.Ellipsis key={page} disabled />;
          }
          return null;
        })}
        
        <Pagination.Next 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
}
