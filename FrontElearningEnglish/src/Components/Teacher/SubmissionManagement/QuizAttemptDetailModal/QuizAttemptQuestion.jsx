import React from "react";

export default function QuizAttemptQuestion({ question, index, getQuestionTypeLabel }) {
  const questionId = question.questionId || question.QuestionId;
  const questionText = question.questionText || question.QuestionText || "";
  const questionType = question.type || question.Type;
  const points = question.points || question.Points || 0;
  const score = question.score || question.Score || 0;
  const isCorrect = question.isCorrect !== undefined ? question.isCorrect : (question.IsCorrect || false);
  const userAnswerText = question.userAnswerText || question.UserAnswerText || "Chưa trả lời";
  const correctAnswerText = question.correctAnswerText || question.CorrectAnswerText || "";
  const options = question.options || question.Options || [];
  const mediaUrl = question.mediaUrl || question.MediaUrl;
  const metadataJson = question.metadataJson || question.MetadataJson;

  // Helper to identify question types by name or enum value
  const typeLabel = getQuestionTypeLabel(questionType)?.toLowerCase() || "";
  const isFillBlank = typeLabel.includes("blank") || typeLabel.includes("điền");
  const isMatching = typeLabel.includes("match") || typeLabel.includes("nối");
  const isOrdering = typeLabel.includes("order") || typeLabel.includes("sắp xếp");
  const isTF = typeLabel.includes("true") || typeLabel.includes("đúng sai");

  // Render Fill in the Blank Review
  const renderFillBlankReview = () => {
    const parts = questionText.split(/(_+|\[.*?\])/g);
    let studentAnswers = [];
    try {
      if (userAnswerText && userAnswerText.startsWith('[')) {
        studentAnswers = JSON.parse(userAnswerText);
      } else if (userAnswerText && userAnswerText.includes(", ")) {
        studentAnswers = userAnswerText.split(", ");
      } else {
        studentAnswers = [userAnswerText];
      }
    } catch (e) {
      studentAnswers = [userAnswerText];
    }

    let correctAnswers = [];
    try {
      if (correctAnswerText && correctAnswerText.startsWith('[')) {
        correctAnswers = JSON.parse(correctAnswerText);
      } else if (correctAnswerText && correctAnswerText.includes(", ")) {
        correctAnswers = correctAnswerText.split(", ");
      } else {
        correctAnswers = [correctAnswerText];
      }
    } catch (e) {
      correctAnswers = [correctAnswerText];
    }

    let blankIdx = 0;
    return (
      <div className="fb-review-text-v3">
        {parts.map((part, i) => {
          if (part.startsWith('_') || (part.startsWith('[') && part.endsWith(']'))) {
            const idx = blankIdx++;
            const sAns = (studentAnswers[idx] || "").trim();
            const cAns = (correctAnswers[idx] || "").trim();
            const isBlankCorrect = sAns.toLowerCase() === cAns.toLowerCase();
            
            return (
              <span key={i} className={`fb-inline-box-v3 ${isBlankCorrect ? 'is-correct' : 'is-wrong'}`}>
                <span className="fb-student-ans">{sAns || "......"}</span>
                {!isBlankCorrect && cAns && <span className="fb-correct-hint">({cAns})</span>}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  // Render Matching Review
  const renderMatchingReview = () => {
    let studentMatches = {};
    try {
      studentMatches = typeof userAnswerText === 'string' ? JSON.parse(userAnswerText || "{}") : (userAnswerText || {});
    } catch (e) {}

    let correctMatches = {};
    try {
      correctMatches = typeof correctAnswerText === 'string' ? JSON.parse(correctAnswerText || "{}") : (correctAnswerText || {});
    } catch (e) {}

    // Identify left and right options from metadata if available
    let leftOptions = options.filter(o => o.isCorrect === true || o.IsCorrect === true);
    let rightOptions = options.filter(o => o.isCorrect === false || o.IsCorrect === false);

    if (leftOptions.length === 0) {
      const half = Math.ceil(options.length / 2);
      leftOptions = options.slice(0, half);
      rightOptions = options.slice(half);
    }

    return (
      <div className="matching-review-v3">
        {leftOptions.map((left) => {
          const leftId = left.optionId || left.OptionId;
          const sMatchId = studentMatches[leftId];
          const cMatchId = correctMatches[leftId];
          
          const sMatchedRight = rightOptions.find(r => (r.optionId || r.OptionId) === Number(sMatchId));
          const cMatchedRight = rightOptions.find(r => (r.optionId || r.OptionId) === Number(cMatchId));
          
          const isMatchCorrect = Number(sMatchId) === Number(cMatchId);

          return (
            <div key={leftId} className="match-pair-v3">
              <div className="match-left-v3">{left.optionText || left.OptionText}</div>
              <div className="match-arrow-v3">➜</div>
              <div className={`match-right-v3 ${isMatchCorrect ? 'is-correct' : 'is-wrong'}`}>
                <span className="student-match">{sMatchedRight ? (sMatchedRight.optionText || sMatchedRight.OptionText) : "Chưa nối"}</span>
                {!isMatchCorrect && cMatchedRight && (
                  <span className="correct-match-hint">Đúng: {cMatchedRight.optionText || cMatchedRight.OptionText}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Ordering Review
  const renderOrderingReview = () => {
    let studentOrderIds = [];
    try {
      studentOrderIds = Array.isArray(userAnswerText) ? userAnswerText : JSON.parse(userAnswerText || "[]");
    } catch (e) {
      studentOrderIds = [];
    }

    let correctOrderIds = [];
    try {
      correctOrderIds = Array.isArray(correctAnswerText) ? correctAnswerText : JSON.parse(correctAnswerText || "[]");
    } catch (e) {
      correctOrderIds = [];
    }

    const studentOrderedOptions = studentOrderIds.map(id => options.find(o => (o.optionId || o.OptionId) === Number(id))).filter(Boolean);

    return (
      <div className="ordering-review-v3">
        {studentOrderedOptions.map((opt, idx) => {
          const optId = opt.optionId || opt.OptionId;
          const correctIdx = correctOrderIds.indexOf(Number(optId));
          const isPosCorrect = correctIdx === idx;

          return (
            <div key={optId} className={`order-item-v3 ${isPosCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="order-number-v3">{idx + 1}</div>
              <div className="order-text-v3">{opt.optionText || opt.OptionText}</div>
              {!isPosCorrect && (
                <div className="order-correct-pos-v3">Vị trí đúng: {correctIdx + 1}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id={`q-${questionId}`}
      className={`card-exam-v3 ${isCorrect ? 'status-correct' : 'status-incorrect'}`}
    >
      <div className="q-header-v3">
        <div className="q-header-left-v3">
          <span className="q-number-v3">Câu {index + 1}</span>
          <span className="q-type-pill-v3">{getQuestionTypeLabel(questionType)}</span>
        </div>
        <div className="q-header-right-v3">
          <span className={`q-status-text-v3 ${isCorrect ? 'text-success' : 'text-danger'}`}>
            {isCorrect ? '✓ Đúng' : '✕ Sai'}
          </span>
          <span className="q-score-v3">{score}/{points}đ</span>
        </div>
      </div>

      <div className="q-content-v3">
        {mediaUrl && (
          <div className="q-media-v3">
            {mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={mediaUrl} controls width="100%" />
            ) : mediaUrl.match(/\.(mp3|wav|ogg)$/i) ? (
              <audio src={mediaUrl} controls />
            ) : (
              <img src={mediaUrl} alt="Question Media" className="img-fluid rounded-4 shadow-sm" />
            )}
          </div>
        )}
        
        <div className="q-main-render-v3">
           {isFillBlank ? (
             renderFillBlankReview()
           ) : isMatching ? (
             renderMatchingReview()
           ) : isOrdering ? (
             renderOrderingReview()
           ) : (
             <>
               <div className="q-text-v3 mb-3">{questionText}</div>
               {options.length > 0 && (
                 <div className="options-grid-v3">
                   {options.map((option, optIdx) => {
                     const isOptionCorrect = option.isCorrect ?? option.IsCorrect;
                     const isSelected = option.isSelected ?? option.IsSelected;

                     let stateClass = '';
                     if (isSelected && isOptionCorrect) stateClass = 'is-correct-selected';
                     else if (isSelected) stateClass = 'is-selected';
                     else if (isOptionCorrect) stateClass = 'is-correct';

                     return (
                       <div key={option.optionId || optIdx} className={`option-card-v3 ${stateClass}`}>
                         <div className="option-indicator-v3">
                           {isOptionCorrect ? (
                             <span className="icon-check-v3">✓</span>
                           ) : isSelected ? (
                             <span className="icon-dot-v3" />
                           ) : null}
                         </div>
                         <div className="option-text-v3">{option.optionText || option.OptionText}</div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </>
           )}
        </div>

        <div className="result-summary-v3 mt-3">
          <div className="result-item-v3">
            <span className="result-label-v3">Học sinh chọn:</span>
            <span className={`result-value-v3 ${userAnswerText === "Chưa trả lời" ? 'text-muted' : 'fw-bold'}`}>
              {typeof userAnswerText === 'object' ? "Xem chi tiết phía trên" : userAnswerText}
            </span>
          </div>
          <div className="result-item-v3">
            <span className="result-label-v3">Đáp án đúng:</span>
            <span className="result-value-v3 text-success fw-bold">
              {typeof correctAnswerText === 'object' ? "Xem chi tiết phía trên" : (correctAnswerText || "Chưa có đáp án")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
