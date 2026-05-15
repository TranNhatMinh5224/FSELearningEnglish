import React, { useState, useEffect, useCallback } from "react";
import { Button, Col, Container, Form, InputGroup, Nav, Row, Tab } from "react-bootstrap";
import { FaFileAlt, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../../Context/AuthContext";
import { adminService } from "../../../Services/adminService";
import EssaySubmissionTab from "../../../Components/Teacher/SubmissionManagement/EssaySubmissionTab/EssaySubmissionTab";
import QuizAttemptTab from "../../../Components/Teacher/SubmissionManagement/QuizAttemptTab/QuizAttemptTab";
import AdminSearch from "../../../Components/Common/AdminSearch/AdminSearch";
import CourseTypeFilter from "../../../Components/Common/CourseTypeFilter/CourseTypeFilter";
import "./AdminSubmissionManagement.css";

export default function AdminSubmissionManagement() {
  const { roles, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("essay");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseType, setCourseType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const isAdmin = roles.some((role) => {
    const roleName = typeof role === 'string' ? role : role?.name || role;
    return roleName === "SuperAdmin" || 
           roleName === "ContentAdmin" || 
           roleName === "FinanceAdmin" ||
           roleName === "Admin";
  });

  const fetchCourses = useCallback(async (override = {}) => {
    try {
      setLoading(true);
      setError("");

      const trimmedSearch = (override.searchTerm ?? searchTerm).trim();
      const selectedType = override.courseType ?? courseType;
      
      let typeParam = "";
      if (selectedType === "system") typeParam = "1";
      if (selectedType === "teacher") typeParam = "2";

      const params = {
        pageNumber: 1,
        pageSize: 100, // Get all courses
        ...(trimmedSearch ? { searchTerm: trimmedSearch } : {}),
        ...(typeParam ? { type: Number(typeParam) } : {})
      };

      const response = await adminService.getAllCourses(params);

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const items = data.items || data.data || [];
        setCourses(items);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Không thể tải danh sách khóa học");
      setCourses([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchTerm, courseType]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    fetchCourses();
  }, [isAuthenticated, isAdmin, fetchCourses]);

  const handleSearch = (event) => {
    event.preventDefault();
    setIsSearching(true);
    fetchCourses();
  };

  const handleResetFilters = () => {
    setCourseType("all");
    setSearchTerm("");
    setIsSearching(true);
    fetchCourses({ courseType: "all", searchTerm: "" });
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }



  return (
    <div className="admin-submission-management-container">
      <Container fluid className="p-0">
        <div className="mb-4">
          <h1 className="mb-0 fw-bold text-primary">Quản lý bài nộp</h1>
          <p className="text-muted mt-2">Xem và chấm bài nộp của học sinh</p>
        </div>

        <Form onSubmit={handleSearch} className="mb-4">
          <div className="admin-filters-header">
            <CourseTypeFilter 
              activeType={courseType}
              onTypeChange={setCourseType}
            />
            
            <div className="admin-filters-right">
              <AdminSearch 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={fetchCourses}
                placeholder="Tìm tên khóa học, mã lớp hoặc giáo viên..."
                className="submission-search-bar"
              />
              <Button
                type="button"
                variant="outline-secondary"
                className="px-4 reset-btn"
                onClick={handleResetFilters}
                disabled={loading || isSearching}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </Form>

        <div className={`admin-management-content ${loading ? 'content-loading' : ''}`}>
          {error ? (
            <div className="alert alert-danger text-center">{error}</div>
          ) : (
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "essay")}>
              <Nav variant="tabs" className="mb-4 border-0">
                <Nav.Item>
                  <Nav.Link eventKey="essay" className="d-flex align-items-center gap-2">
                    <FaFileAlt />
                    <span>Bài Essay</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="quiz" className="d-flex align-items-center gap-2">
                    <FaClipboardList />
                    <span>Bài Quiz</span>
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="essay">
                  <EssaySubmissionTab courses={courses} isAdmin={true} />
                </Tab.Pane>
                <Tab.Pane eventKey="quiz">
                  <QuizAttemptTab courses={courses} isAdmin={true} />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          )}
          
          {loading && (
            <div className="admin-loading-overlay text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
