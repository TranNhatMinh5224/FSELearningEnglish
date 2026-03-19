import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { courseService } from "../../Services/courseService";
import { useAssets } from "../../Context/AssetContext";
import MainHeader from "../../Components/Header/MainHeader";
import SuggestedCourseCard from "../../Components/Home/SuggestedCourseCard/SuggestedCourseCard";
import SearchBox from "../../Components/Home/SearchBox/SearchBox";
import "./SearchResults.css";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const keyword = searchParams.get("q") || "";
    const { getDefaultCourseImage } = useAssets();
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchSearchResults = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await courseService.searchCourses(keyword.trim());
            const coursesData = response.data?.data || [];
            
            const mappedCourses = coursesData.map((course) => ({
                id: course.courseId,
                courseId: course.courseId,
                title: course.title || course.Title || "",
                imageUrl: course.imageUrl && course.imageUrl.trim() !== "" 
                    ? course.imageUrl 
                    : getDefaultCourseImage(),
                price: course.price || course.Price || 0,
                isEnrolled: course.isEnrolled || course.IsEnrolled || false,
            }));
            
            setCourses(mappedCourses);
        } catch (err) {
            console.error("Error searching courses:", err);
            setError("Không thể tải kết quả tìm kiếm");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [keyword, getDefaultCourseImage]);

    useEffect(() => {
        if (keyword.trim()) {
            fetchSearchResults();
        } else {
            setCourses([]);
        }
    }, [keyword, fetchSearchResults]);

    return (
        <>
            <MainHeader />
            <div className="search-results-page">
                <Container>
                    <div className="search-results-header">
                        <h1 className="search-results-title">
                            {keyword ? `Kết quả tìm kiếm cho "${keyword}"` : "Tìm kiếm khóa học"}
                        </h1>
                        <div className="search-box-wrapper">
                            <SearchBox />
                        </div>
                    </div>

                    {loading ? (
                        <div className="search-loading-state">
                            <Spinner animation="border" variant="primary" />
                            <p>Đang tìm kiếm...</p>
                        </div>
                    ) : error ? (
                        <div className="search-error-state">
                            <p className="error-message">{error}</p>
                            <button 
                                className="retry-btn"
                                onClick={fetchSearchResults}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : courses.length > 0 ? (
                        <>
                            <div className="search-results-count">
                                Tìm thấy <strong>{courses.length}</strong> khóa học
                            </div>
                            <Row className="g-3 g-md-4">
                                {courses.map((course, index) => (
                                    <Col key={course.id || index} xs={12} sm={6} lg={4} xl={3}>
                                        <SuggestedCourseCard
                                            course={course}
                                            isEnrolled={course.isEnrolled || false}
                                            showEnrolledBadge={true}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </>
                    ) : keyword ? (
                        <div className="search-no-results-state">
                            <div className="no-results-icon">🔍</div>
                            <h2>Không tìm thấy khóa học nào</h2>
                            <p>Thử tìm kiếm với từ khóa khác hoặc xem các khóa học phổ biến</p>
                            <button 
                                className="back-to-home-btn"
                                onClick={() => navigate("/home")}
                            >
                                Về trang chủ
                            </button>
                        </div>
                    ) : (
                        <div className="search-empty-state">
                            <div className="empty-icon">🔍</div>
                            <h2>Nhập từ khóa để tìm kiếm</h2>
                            <p>Sử dụng ô tìm kiếm ở trên để tìm khóa học bạn muốn</p>
                        </div>
                    )}
                </Container>
            </div>
        </>
    );
}
