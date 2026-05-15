import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import "./VocabularyNotebook.css";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import CustomPagination from "../../Components/Common/Pagination/CustomPagination";
import { flashcardReviewService } from "../../Services/flashcardReviewService";
import { FaBookOpen, FaCheckCircle } from "react-icons/fa";

export default function VocabularyNotebook() {
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const getMeaning = (flashcard) => flashcard.meaning || flashcard.Meaning || "";

    useEffect(() => {
        const fetchMasteredFlashCards = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await flashcardReviewService.getMasteredFlashCards();
                if (response.data?.success && response.data?.data) {
                    setFlashcards(response.data.data.flashCards || []);
                } else {
                    setError(response.data?.message || "Không thể tải danh sách từ vựng");
                }
            } catch (err) {
                setError("Không thể tải dữ liệu từ vựng");
            } finally {
                setLoading(false);
            }
        };
        fetchMasteredFlashCards();
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentItems = flashcards.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(flashcards.length / pageSize);

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="vocabulary-notebook-container">
                    <Container>
                        <div className="loading-message">Đang tải...</div>
                    </Container>
                </div>
            </>
        );
    }

    return (
        <>
            <MainHeader />
            <div className="vocabulary-notebook-container">
                <Container>
                    <Breadcrumb 
                        items={[{ label: "Sổ tay từ vựng", isCurrent: true }]}
                    />

                    <div className="vocabulary-notebook-header-section mt-4 mb-5">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
                            <div className="title-area">
                                <h1 className="vocabulary-notebook-title">SỔ TAY TỪ VỰNG</h1>
                                <p className="vocabulary-notebook-subtitle">Ghi lại những từ vựng bạn đã chinh phục được</p>
                            </div>
                            
                            <div className="stats-highlight-card">
                                <div className="stat-icon-box">
                                    <FaBookOpen />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">TỔNG TỪ VỰNG</span>
                                    <span className="stat-value">{flashcards.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {flashcards.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📖</div>
                            <h3 className="empty-title">Sổ tay còn trống</h3>
                            <p className="empty-subtitle">Bạn chưa có từ vựng nào đã thuộc hoàn toàn.</p>
                            <p className="empty-state-hint">
                                Hãy bắt đầu học và ôn tập để thêm những từ vựng đầu tiên vào sổ tay nhé!
                            </p>
                        </div>
                    ) : (
                        <div className="vocabulary-list-container">
                            <div className="vocabulary-table-wrapper">
                                <div className="vocabulary-list-header">
                                    <div className="vocabulary-header-column status-column">
                                        <span>Trạng thái</span>
                                    </div>
                                    <div className="vocabulary-header-column word-column">
                                        <span>Từ vựng</span>
                                    </div>
                                    <div className="vocabulary-header-column pronunciation-column d-none d-md-flex">
                                        <span>Phát âm</span>
                                    </div>
                                    <div className="vocabulary-header-column part-of-speech-column d-none d-md-flex">
                                        <span>Từ loại</span>
                                    </div>
                                    <div className="vocabulary-header-column meaning-column d-none d-md-flex">
                                        <span>Nghĩa</span>
                                    </div>
                                </div>

                                <div className="vocabulary-list">
                                    {currentItems.map((flashcard) => (
                                        <div key={flashcard.flashCardId} className="vocabulary-item">
                                            <div className="vocabulary-column status-column">
                                                <FaCheckCircle className="status-icon" />
                                                <span className="mobile-label d-md-none">Trạng thái</span>
                                            </div>
                                            <div className="vocabulary-column word-column">
                                                <span className="mobile-label d-md-none">Từ vựng</span>
                                                <span className="vocabulary-word">
                                                    {flashcard.word || flashcard.Word || ""}
                                                </span>
                                            </div>
                                            <div className="vocabulary-column pronunciation-column">
                                                <span className="mobile-label d-md-none">Phát âm</span>
                                                <span className="vocabulary-pronunciation">
                                                    {flashcard.pronunciation || flashcard.Pronunciation || "-"}
                                                </span>
                                            </div>
                                            <div className="vocabulary-column part-of-speech-column">
                                                <span className="mobile-label d-md-none">Từ loại</span>
                                                <span className={`vocabulary-part-of-speech pos-${(flashcard.partOfSpeech || flashcard.PartOfSpeech || "other").toLowerCase()}`}>
                                                    {flashcard.partOfSpeech || flashcard.PartOfSpeech || "-"}
                                                </span>
                                            </div>
                                            <div className="vocabulary-column meaning-column">
                                                <span className="mobile-label d-md-none">Nghĩa</span>
                                                <span className="vocabulary-meaning">
                                                    {(() => {
                                                        const m = getMeaning(flashcard);
                                                        return m ? m.charAt(0).toUpperCase() + m.slice(1) : "";
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pagination-wrapper">
                                    <CustomPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalCount={flashcards.length}
                                        pageSize={pageSize}
                                        onPageChange={setCurrentPage}
                                        showInfo={false}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </Container>
            </div>
        </>
    );
}

