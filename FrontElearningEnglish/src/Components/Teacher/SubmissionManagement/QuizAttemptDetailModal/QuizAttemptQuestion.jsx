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
  
  const superClean = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();

  // Render Fill in the Blank Review
  const renderFillBlankReview = () => {
    // Robust regex supporting [], {}, (), ___
    const parts = questionText.split(/(_+|\[.*?\]|\{.*?\}|\(.*?\))/g);
    
    const isBlankLabel = (p) => {
        if (!p) return false;
        const t = p.trim();
        return t.startsWith('_') || 
               (t.startsWith('[') && t.endsWith(']')) ||
               (t.startsWith('{') && t.endsWith('}')) ||
               (t.startsWith('(') && t.endsWith(')'));
    };
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
          if (isBlankLabel(part)) {
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
    // Dùng raw UserAnswer (object {leftId: rightId}) thay vì userAnswerText đã format
    const rawUserAnswer = question.userAnswer ?? question.UserAnswer;
    const rawCorrectAnswer = question.correctAnswer ?? question.CorrectAnswer;

    // Parse studentMatches: {leftOptionId(string|int): rightOptionId}
    let studentMatches = {};
    try {
      if (rawUserAnswer && typeof rawUserAnswer === 'object' && !Array.isArray(rawUserAnswer)) {
        studentMatches = rawUserAnswer;
      } else if (typeof rawUserAnswer === 'string') {
        studentMatches = JSON.parse(rawUserAnswer || "{}");
      }
    } catch (e) {}

    // Parse correctMatches từ CorrectAnswersJson (backend trả về dạng object hoặc array text)
    let correctMatchesById = {}; // {leftId: rightId}
    try {
      if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && !Array.isArray(rawCorrectAnswer)) {
        correctMatchesById = rawCorrectAnswer;
      } else if (typeof rawCorrectAnswer === 'string') {
        correctMatchesById = JSON.parse(rawCorrectAnswer || "{}");
      }
    } catch (e) {}

    // Lấy left/right options dựa trên isCorrect
    // Backend trả về answerOptionId (không phải optionId)
    // Helpers for extracting IDs and text from options
    const getOptId = (o) => o?.answerOptionId || o?.AnswerOptionId || o?.optionId || o?.OptionId;
    const getOptText = (o) => o?.optionText || o?.OptionText || o?.text || o?.Text || "";

    // Robust Column Separation (Robust Metadata & Pair-Driven fallbacks)
    let leftOptions = [];
    let rightOptions = [];
    let leftSide = [];
    let rightSide = [];
    const processedIndices = new Set();

    try {
      // Priority 1: isCorrect flags (Newly created/saved questions)
      // Teachers mark Left side as "Correct" (true) and Right side as "Incorrect" (false) in useQuestionForm.js
      const flaggedLeft = options.filter(o => o.isCorrect === true || o.IsCorrect === true);
      const flaggedRight = options.filter(o => o.isCorrect === false || o.IsCorrect === false);
      
      if (flaggedLeft.length > 0 && flaggedRight.length > 0 && flaggedLeft.length === flaggedRight.length) {
          leftSide = [...flaggedLeft];
          rightSide = [...flaggedRight];
          options.forEach((o, i) => processedIndices.add(i));
      }

      // Priority 2: MetadataJson (Explicitly stores left/right text arrays)
      if (leftSide.length === 0) {
        const rawMeta = question.metadataJson || question.MetadataJson;
        const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta || "{}") : (rawMeta || {});
        
        if (meta.left && meta.right && Array.isArray(meta.left)) {
            meta.left.forEach(lText => {
                const idx = options.findIndex((o, i) => !processedIndices.has(i) && superClean(getOptText(o)) === superClean(lText));
                if (idx !== -1) {
                    leftSide.push(options[idx]);
                    processedIndices.add(idx);
                }
            });
            meta.right.forEach(rText => {
                const idx = options.findIndex((o, i) => !processedIndices.has(i) && superClean(getOptText(o)) === superClean(rText));
                if (idx !== -1) {
                    rightSide.push(options[idx]);
                    processedIndices.add(idx);
                }
            });
        }
      }

      // Priority 3: CorrectAnswersJson (Dictionary of pairs)
      if (leftSide.length === 0) {
        const rawCorrect = question.correctAnswer ?? question.CorrectAnswer;
        const correctMap = typeof rawCorrect === 'string' ? JSON.parse(rawCorrect || "{}") : (rawCorrect || {});
        
        Object.entries(correctMap).forEach(([lKey, rValue]) => {
          // Identify Left side (key)
          const lOpt = options.find((o, i) => !processedIndices.has(i) && (String(getOptId(o)) === String(lKey) || superClean(getOptText(o)) === superClean(String(lKey))));
          if (lOpt) {
            leftSide.push(lOpt);
            processedIndices.add(options.indexOf(lOpt));
          }

          // Identify Right side (value)
          const rOpt = options.find((o, i) => !processedIndices.has(i) && (String(getOptId(o)) === String(rValue) || superClean(getOptText(o)) === superClean(String(rValue))));
          if (rOpt) {
            rightSide.push(rOpt);
            processedIndices.add(options.indexOf(rOpt));
          }
        });
      }
    } catch (e) {
      console.error("Error in complex review separation logic:", e);
    }

    // Residual mapping
    options.forEach((o, i) => {
      if (!processedIndices.has(i)) {
        if (leftSide.length <= rightSide.length) leftSide.push(o);
        else rightSide.push(o);
      }
    });

    leftOptions = leftSide;
    rightOptions = rightSide;

    if (leftOptions.length === 0 || rightOptions.length === 0) {
      leftOptions = options.filter(o => o.isCorrect === true || o.IsCorrect === true);
      rightOptions = options.filter(o => o.isCorrect === false || o.IsCorrect === false);
      
      if (leftOptions.length === 0 || rightOptions.length === 0 || leftOptions.length !== rightOptions.length) {
        leftOptions = options.filter((_, idx) => idx % 2 === 0);
        rightOptions = options.filter((_, idx) => idx % 2 !== 0);
      }
    }

    return (
      <div className="matching-review-v3">
        {leftOptions.map((left) => {
          const leftId = getOptId(left);

          // Tìm ID phía phải học sinh chọn cho leftId này
          const sMatchId = studentMatches[leftId] ?? studentMatches[String(leftId)];
          // Tìm ID phía phải đúng cho leftId này  
          const cMatchId = correctMatchesById[leftId] ?? correctMatchesById[String(leftId)];

          // Tìm option tương ứng (ưu tiên trong rightOptions, fallback toàn bộ options)
          const findOpt = (id) => {
            if (id == null) return null;
            return rightOptions.find(r => Number(getOptId(r)) === Number(id)) 
                   || options.find(o => Number(getOptId(o)) === Number(id));
          };

          const sMatchedRight = findOpt(sMatchId);
          const cMatchedRight = findOpt(cMatchId);

          const isMatchCorrect = sMatchId != null && Number(sMatchId) === Number(cMatchId);

          return (
            <div key={leftId} className="match-pair-v3">
              <div className="match-left-v3">{getOptText(left)}</div>
              <div className="match-arrow-v3">➜</div>
              <div className={`match-right-v3 ${isMatchCorrect ? 'is-correct' : 'is-wrong'}`}>
                <span className="student-match">{sMatchedRight ? getOptText(sMatchedRight) : "Chưa nối"}</span>
                {!isMatchCorrect && cMatchedRight && (
                  <span className="correct-match-hint">Đúng: {getOptText(cMatchedRight)}</span>
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
    const rawUserAnswer = question.userAnswer ?? question.UserAnswer;
    const getOptId = (o) => o.answerOptionId || o.AnswerOptionId || o.optionId || o.OptionId;
    const getOptText = (o) => o.optionText || o.OptionText || o.text || o.Text || "";

    // Parse student's order as list of option IDs
    let studentOrderIds = [];
    try {
      if (Array.isArray(rawUserAnswer)) {
        studentOrderIds = rawUserAnswer.map(Number);
      } else if (typeof rawUserAnswer === 'string') {
        studentOrderIds = JSON.parse(rawUserAnswer || "[]").map(Number);
      }
    } catch (e) { studentOrderIds = []; }

    // Parse correct order as list of option IDs (from backend CorrectAnswer)
    const rawCorrectAnswer = question.correctAnswer ?? question.CorrectAnswer;
    let correctOrderIds = [];
    try {
      if (Array.isArray(rawCorrectAnswer)) {
        correctOrderIds = rawCorrectAnswer.map(Number);
      } else if (typeof rawCorrectAnswer === 'string') {
        // Backend có thể trả về array of text strings hoặc array of IDs
        const parsed = JSON.parse(rawCorrectAnswer || "[]");
        if (parsed.length > 0 && typeof parsed[0] === 'number') {
          correctOrderIds = parsed;
        } else {
          // Convert text to IDs
          correctOrderIds = parsed.map(text => {
            const opt = options.find(o => getOptText(o) === text);
            return opt ? Number(getOptId(opt)) : -1;
          });
        }
      }
    } catch (e) { correctOrderIds = []; }

    // Map student's order IDs to option objects
    const studentOrderedOptions = studentOrderIds
      .map(id => options.find(o => Number(getOptId(o)) === Number(id)))
      .filter(Boolean);

    return (
      <div className="ordering-review-v3">
        {studentOrderedOptions.map((opt, idx) => {
          const optId = Number(getOptId(opt));
          const correctIdx = correctOrderIds.indexOf(optId);
          const isPosCorrect = correctIdx === idx;

          return (
            <div key={optId} className={`order-item-v3 ${isPosCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="order-number-v3">{idx + 1}</div>
              <div className="order-text-v3">{getOptText(opt)}</div>
              {!isPosCorrect && correctIdx >= 0 && (
                <div className="order-correct-pos-v3">Vị trí đúng: {correctIdx + 1}</div>
              )}
            </div>
          );
        })}
        {studentOrderedOptions.length === 0 && (
          <div className="text-muted fst-italic">Chưa trả lời</div>
        )}
      </div>
    );
  };

  const isCSharpType = (s) => typeof s === 'string' && s.includes("System.Collections.Generic");

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
              {typeof userAnswerText === 'object' || isCSharpType(userAnswerText) ? "Xem chi tiết phía trên" : userAnswerText}
            </span>
          </div>
          <div className="result-item-v3">
            <span className="result-label-v3">Đáp án đúng:</span>
            <span className="result-value-v3 text-success fw-bold">
              {typeof correctAnswerText === 'object' || isCSharpType(correctAnswerText) ? "Xem chi tiết phía trên" : (correctAnswerText || "Chưa có đáp án")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
