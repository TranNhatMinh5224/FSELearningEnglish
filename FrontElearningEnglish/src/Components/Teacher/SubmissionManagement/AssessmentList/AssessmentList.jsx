import React, { useState, useEffect, useCallback } from "react";
import { Card, Spinner, Badge } from "react-bootstrap";
import { FaClipboardCheck, FaClock, FaCalendarAlt } from "react-icons/fa";
import { assessmentService } from "../../../../Services/assessmentService";
import { AssessmentCardSkeleton } from "../../../Common/Skeleton/LectureDetailSkeleton";
import "./AssessmentList.css";

export default function AssessmentList({ moduleId, onSelect, isAdmin = false }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Use teacher or admin API based on isAdmin prop
      const response = isAdmin 
        ? await assessmentService.getAdminAssessmentsByModule(moduleId)
        : await assessmentService.getTeacherAssessmentsByModule(moduleId);
      if (response.data?.success) {
        const data = response.data.data || [];
        setAssessments(data);
      }
    } catch (err) {
      console.error("Error fetching assessments:", err);
      setError("Không thể tải danh sách assessment");
    } finally {
      setLoading(false);
    }
  }, [moduleId, isAdmin]);

  useEffect(() => {
    fetchAssessments();
  }, [moduleId, fetchAssessments]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="assessment-grid">
        {[...Array(3)].map((_, i) => <AssessmentCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="assessment-list">
      {assessments.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p>Chưa có assessment nào</p>
        </div>
      ) : (
        <div className="assessment-grid">
          {assessments.map((assessment) => {
            const assessmentId = assessment.assessmentId || assessment.AssessmentId;
            const title = assessment.title || assessment.Title || "Untitled Assessment";
            const openAt = assessment.openAt || assessment.OpenAt;
            const dueAt = assessment.dueAt || assessment.DueAt;
            const timeLimit = assessment.timeLimit || assessment.TimeLimit;
            const isPublished = assessment.isPublished !== undefined 
              ? assessment.isPublished 
              : assessment.IsPublished;

            return (
              <Card
                key={assessmentId}
                className="assessment-card h-100"
                onClick={() => onSelect(assessment)}
                style={{ cursor: "pointer" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="assessment-icon">
                      <FaClipboardCheck size={20} />
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <Card.Title className="assessment-title mb-0 text-break">{title}</Card.Title>
                        <Badge bg={isPublished ? "success" : "secondary"} className="assessment-badge flex-shrink-0">
                          {isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      {timeLimit && (
                        <div className="text-muted small d-flex align-items-center mt-2">
                          <FaClock className="me-1" size={12} />
                          <span>{timeLimit}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-top pt-3 mt-auto">
                    <div className="date-row" title="Opening time">
                      <FaCalendarAlt size={12} />
                      <span>Mở: {formatDate(openAt)}</span>
                    </div>
                    <div className="date-row danger" title="Due time">
                      <FaCalendarAlt size={12} />
                      <span>Đóng: {formatDate(dueAt)}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

