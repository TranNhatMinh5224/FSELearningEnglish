import React from "react";

export default function QuizAttemptSidebar({ 
  effectiveSections, 
  totalScore, 
  maxScore, 
  questionsCount, 
  scrollToQuestion 
}) {
  let sidebarQuestionIndex = 0;

  return (
    <div className="review-sidebar-v3">
      <div className="sidebar-header-v3">
        <h3 className="sidebar-title-v3">Danh sách câu hỏi</h3>
        <div className="score-circle-badge">
          <div className="check-icon-bg">
            <span className="check-mark-v3">✓</span>
          </div>
          <div className="score-value-v3">
            {totalScore !== "N/A" ? `${totalScore}/${maxScore || questionsCount}` : "N/A"}
          </div>
        </div>
      </div>

      <div className="sidebar-scroll-area-v3">
        {effectiveSections.map((section, sIdx) => {
          const sectionItems = section.items || section.Items || [];
          const sectionQuestions = [];
          sectionItems.forEach(item => {
            const itemType = item.itemType || item.ItemType;
            const group = item.group || item.Group;
            const q = item.question || item.Question;

            if (itemType === "Group" && group) {
              (group.questions || group.Questions || []).forEach(gq => sectionQuestions.push(gq));
            } else if (itemType === "Question" && q) {
              sectionQuestions.push(q);
            }
          });

          if (sectionQuestions.length === 0) return null;

          return (
            <div key={section.sectionId || section.SectionId || sIdx} className="sidebar-section-v3">
              <span className="section-label-blue">
                {section.title || section.Title || `PART ${sIdx + 1}`}
              </span>
              <div className="question-grid-v3">
                {sectionQuestions.map((q) => {
                  const qNum = ++sidebarQuestionIndex;
                  const isCorrectStatus = q.isCorrect || q.IsCorrect;
                  return (
                    <div
                      key={q.questionId || q.QuestionId || qNum}
                      className={`q-nav-box-v3 ${isCorrectStatus ? "is-correct" : "is-incorrect"}`}
                      onClick={() => scrollToQuestion(q.questionId || q.QuestionId)}
                    >
                      {qNum}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-legend-v3">
        <div className="legend-item-v3">
          <div className="legend-box-v3 status-correct" />
          <span>Chính xác</span>
        </div>
        <div className="legend-item-v3">
          <div className="legend-box-v3 status-incorrect" />
          <span>Chưa đúng</span>
        </div>
      </div>
    </div>
  );
}
