import React, { useState, useEffect } from "react";
import { Button, Col, Container, Form, InputGroup, Nav, Row, Tab } from "react-bootstrap";
import { FaFileAlt, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../../Context/AuthContext";
import { adminService } from "../../../Services/adminService";
import EssaySubmissionTab from "../../../Components/Teacher/SubmissionManagement/EssaySubmissionTab/EssaySubmissionTab";
import QuizAttemptTab from "../../../Components/Teacher/SubmissionManagement/QuizAttemptTab/QuizAttemptTab";
import "./AdminSubmissionManagement.css";

export default function AdminSubmissionManagement() {
  const { roles, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("essay");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseType, setCourseType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const isAdmin = roles.some((role) => {
    const roleName = typeof role === 'string' ? role : role?.name || role;
    return roleName === "SuperAdmin" || 
           roleName === "ContentAdmin" || 
           roleName === "FinanceAdmin" ||
           roleName === "Admin";
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    fetchCourses();
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    setIsSearching(true);
    fetchCourses();
  }, [courseType, isAuthenticated, isAdmin]);

  const fetchCourses = async (override = {}) => {
    try {
      setLoading(true);
      setError("");

      const trimmedSearch = (override.searchTerm ?? searchTerm).trim();
      const selectedType = override.courseType ?? courseType;
      const params = {
        pageNumber: 1,
        pageSize: 100, // Get all courses
        ...(trimmedSearch ? { searchTerm: trimmedSearch } : {}),
        ...(selectedType ? { type: Number(selectedType) } : {})
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
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setIsSearching(true);
    fetchCourses();
  };

  const handleResetFilters = () => {
    setCourseType("");
    setSearchTerm("");
    setIsSearching(true);
    fetchCourses({ courseType: "", searchTerm: "" });
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-submission-management-container">
        <Container>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-submission-management-container">
        <Container>
          <div className="alert alert-danger text-center">{error}</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="admin-submission-management-container">
      <Container>
        <div className="mb-4">
          <h1 className="mb-0 fw-bold text-primary">Quản lý bài nộp</h1>
          <p className="text-muted mt-2">Xem và chấm bài nộp của học sinh</p>
        </div>

        <Form onSubmit={handleSearch} className="mb-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} lg={5}>
              <Form.Label className="fw-semibold">Loại khóa học</Form.Label>
              <div className="admin-course-type-toggle">
                <Button
                  type="button"
                  variant={courseType === "" ? "dark" : "outline-secondary"}
                  className="admin-course-type-btn"
                  onClick={() => setCourseType("")}
                >
                  All Courses
                </Button>
                <Button
                  type="button"
                  variant={courseType === "1" ? "dark" : "outline-secondary"}
                  className="admin-course-type-btn"
                  onClick={() => setCourseType("1")}
                >
                  System Courses
                </Button>
                <Button
                  type="button"
                  variant={courseType === "2" ? "dark" : "outline-secondary"}
                  className="admin-course-type-btn"
                  onClick={() => setCourseType("2")}
                >
                  Teacher Courses
                </Button>
              </div>
            </Col>
            <Col xs={12} lg={5}>
              <Form.Label className="fw-semibold">Tìm kiếm khóa học</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên khóa học, mã lớp hoặc tên giáo viên..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || isSearching}
                >
                  {isSearching ? "Đang tìm..." : "Tìm"}
                </Button>
              </InputGroup>
            </Col>
            <Col xs={12} lg={2} className="d-flex">
              <Button
                type="button"
                variant="outline-secondary"
                className="w-100"
                onClick={handleResetFilters}
                disabled={loading || isSearching}
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Form>

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
      </Container>
    </div>
  );
}
