import React, { useState, useEffect, useCallback } from "react";
import { Modal, Spinner } from "react-bootstrap";
import { quizAttemptService } from "../../../../Services/quizAttemptService";
import { useQuestionTypes } from "../../../../hooks/useQuestionTypes";
import QuizAttemptSidebar from "./QuizAttemptSidebar";
import QuizAttemptSummary from "./QuizAttemptSummary";
import QuizAttemptQuestion from "./QuizAttemptQuestion";
import "./QuizAttemptDetailModal.css";

export default function QuizAttemptDetailModal({ show, onClose, attempt, quizId, isAdmin = false }) {
  const { getQuestionTypeLabel } = useQuestionTypes();
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFromScoresAPI = useCallback(async (targetQuizId, attemptId) => {
    try {
      const response = isAdmin
        ? await quizAttemptService.getAdminQuizScoresPaged(targetQuizId, 1, 100)
        : await quizAttemptService.getQuizScoresPaged(targetQuizId, 1, 100);
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const items = data.items || data.data || [];
        const scoreData = items.find(
          (item) => (item.attemptId || item.AttemptId) === attemptId
        );
        if (scoreData) {
          // Merge score data with attempt data
          setAttemptDetail(prevAttempt => ({
            ...prevAttempt,
            email: scoreData.email || scoreData.Email,
            firstName: scoreData.firstName || scoreData.FirstName,
            lastName: scoreData.lastName || scoreData.LastName,
            percentage: scoreData.percentage !== undefined ? scoreData.percentage : (scoreData.Percentage !== undefined ? scoreData.Percentage : prevAttempt?.percentage ?? prevAttempt?.Percentage ?? null),
            totalScore: scoreData.totalScore !== undefined ? scoreData.totalScore : (scoreData.TotalScore !== undefined ? scoreData.TotalScore : prevAttempt?.totalScore ?? prevAttempt?.TotalScore),
            timeSpentSeconds: scoreData.timeSpentSeconds !== undefined ? scoreData.timeSpentSeconds : (scoreData.TimeSpentSeconds !== undefined ? scoreData.TimeSpentSeconds : prevAttempt?.timeSpentSeconds ?? prevAttempt?.TimeSpentSeconds),
            isPassed: scoreData.isPassed !== undefined ? scoreData.isPassed : (scoreData.IsPassed !== undefined ? scoreData.IsPassed : prevAttempt?.isPassed ?? prevAttempt?.IsPassed),
            totalPossibleScore: scoreData.totalPossibleScore !== undefined ? scoreData.totalPossibleScore : (scoreData.TotalPossibleScore !== undefined ? scoreData.TotalPossibleScore : prevAttempt?.totalPossibleScore ?? prevAttempt?.TotalPossibleScore),
          }));
        } else {
          setAttemptDetail(attempt);
        }
      } else {
        setAttemptDetail(attempt);
      }
    } catch (err) {
      console.error("Error fetching from scores API:", err);
      setAttemptDetail(attempt);
    }
  }, [attempt, isAdmin]);

  const attemptId = attempt?.attemptId || attempt?.AttemptId;

  useEffect(() => {
    const fetchAttemptDetailData = async () => {
      if (!attemptId) return;
      setLoading(true);
      setError(null);
      try {
        const fetchFunc = isAdmin
          ? quizAttemptService.getAdminAttemptDetailForReview
          : quizAttemptService.getTeacherAttemptDetailForReview;

        const response = await fetchFunc(attemptId);
        if (response.data?.success && response.data?.data) {
          setAttemptDetail(response.data.data);
        } else {
          const currentQuizId = quizId || attempt?.quizId || attempt?.QuizId;
          if (currentQuizId) {
            await fetchFromScoresAPI(currentQuizId, attemptId);
          } else {
            setError(response.data?.message || "Không thể tải chi tiết bài làm");
          }
        }
      } catch (err) {
        console.error("Error in fetchAttemptDetailData:", err);
        const currentQuizId = quizId || attempt?.quizId || attempt?.QuizId;
        if (currentQuizId) {
          await fetchFromScoresAPI(currentQuizId, attemptId);
        } else {
          setError("Giao diện không thể tải dữ liệu từ máy chủ");
        }
      } finally {
        setLoading(false);
      }
    };

    if (show && attemptId) {
      fetchAttemptDetailData();
    }
  }, [show, attemptId, isAdmin, quizId, fetchFromScoresAPI]);

  if (!attempt) return null;

  const displayData = attemptDetail || attempt;

  const userName = displayData.firstName || displayData.FirstName || displayData.userName || displayData.UserName || "";
  const lastName = displayData.lastName || displayData.LastName || "";
  const fullName = userName && lastName ? `${userName} ${lastName}` : (userName || lastName || "N/A");
  const email = displayData.email || displayData.Email || "N/A";
  const totalScore = displayData.totalScore !== undefined ? displayData.totalScore : (displayData.TotalScore !== undefined ? displayData.TotalScore : "N/A");
  const totalPossibleScore = displayData.totalPossibleScore !== undefined ? displayData.totalPossibleScore : (displayData.TotalPossibleScore !== undefined ? displayData.TotalPossibleScore : null);
  const percentage = displayData.percentage !== undefined ? displayData.percentage : (displayData.Percentage !== undefined ? displayData.Percentage : null);
  const timeSpentSeconds = displayData.timeSpentSeconds !== undefined ? displayData.timeSpentSeconds : (displayData.TimeSpentSeconds !== undefined ? displayData.TimeSpentSeconds : 0);
  const questions = displayData.questions || displayData.Questions || [];
  const sections = displayData.sections || displayData.Sections || (displayData.data && (displayData.data.sections || displayData.data.Sections)) || [];

  const effectiveSections = (sections && sections.length > 0) ? sections :
    (questions && questions.length > 0 ? [{
      title: "Chi tiết bài làm",
      items: questions.map((q, idx) => ({
        itemType: "Question",
        displayOrder: idx,
        question: q
      }))
    }] : []);

  const scrollToQuestion = (id) => {
    const element = document.getElementById(`q-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  let globalQuestionIndex = 0;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      fullscreen="lg-down"
      size="xl"
      className="quiz-review-modal-v3"
    >
      <Modal.Header closeButton className="quiz-header-custom border-0 px-4 py-3">
        <Modal.Title className="fw-bold text-white">
          Chi tiết kết quả bài làm: <span>{fullName}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading ? (
          <div className="p-5 text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang chuẩn bị dữ liệu review...</p>
          </div>
        ) : error ? (
          <div className="m-4 alert alert-danger">{error}</div>
        ) : (
          <div className="review-layout-container">
            <main className="review-content-main">
              <QuizAttemptSummary
                fullName={fullName}
                email={email}
                percentage={percentage}
                timeSpentSeconds={timeSpentSeconds}
                totalScore={totalScore}
                totalPossibleScore={totalPossibleScore}
              />

              {effectiveSections.map((section, sIdx) => {
                const sectionId = section.sectionId || section.SectionId || sIdx;
                const sectionTitle = section.title || section.Title || `PART ${sIdx + 1}`;
                const sectionItems = section.items || section.Items || [];

                return (
                  <section key={sectionId} className="content-section-block">
                    <div className="content-section-header">
                      <h2>{sectionTitle}</h2>
                    </div>
                    <div className="section-content">
                      {sectionItems.map((item, itemIdx) => {
                        const itemType = item.itemType || item.ItemType;
                        const group = item.group || item.Group;
                        const q = item.question || item.Question;

                        if (itemType === "Group" && group) {
                          return (
                            <div key={group.groupId || group.QuizGroupId || itemIdx} className="question-group-exam mb-4">
                              <div className="group-info-exam mb-3 p-3 bg-white rounded border border-primary-subtle">
                                {group.title && <h5 className="fw-bold text-primary mb-2">{group.title}</h5>}
                                {group.description && (
                                  <div className="small text-dark" dangerouslySetInnerHTML={{ __html: group.description || group.Description }} />
                                )}
                                {(group.mediaUrl || group.MediaUrl) && (
                                  <div className="mt-2">
                                    <audio src={group.mediaUrl || group.MediaUrl} controls />
                                  </div>
                                )}
                              </div>
                              <div className="group-questions ms-3">
                                {(group.questions || group.Questions || []).map((gq) => (
                                  <QuizAttemptQuestion
                                    key={gq.questionId || gq.QuestionId || globalQuestionIndex}
                                    question={gq}
                                    index={globalQuestionIndex++}
                                    getQuestionTypeLabel={getQuestionTypeLabel}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        } else if (itemType === "Question" && q) {
                          return (
                            <QuizAttemptQuestion
                              key={q.questionId || q.QuestionId || globalQuestionIndex}
                              question={q}
                              index={globalQuestionIndex++}
                              getQuestionTypeLabel={getQuestionTypeLabel}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </section>
                );
              })}
            </main>

            <QuizAttemptSidebar
              effectiveSections={effectiveSections}
              totalScore={totalScore}
              totalPossibleScore={totalPossibleScore}
              questionsCount={questions.length}
              scrollToQuestion={scrollToQuestion}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 bg-white px-4 py-3 shadow-lg" style={{ zIndex: 20 }}>
        <button className="btn btn-secondary px-4 py-2 rounded-pill fw-bold" onClick={onClose}>
          Đóng cửa sổ
        </button>
      </Modal.Footer>
    </Modal>
  );
}

