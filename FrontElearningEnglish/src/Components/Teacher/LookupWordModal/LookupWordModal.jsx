import React, { useState, useRef } from "react";
import { FaTimes, FaSearch, FaExternalLinkAlt, FaVolumeUp, FaCheck, FaBookOpen } from "react-icons/fa";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import { dictionaryService } from "../../../Services/dictionaryService";
import "./LookupWordModal.css";

export default function LookupWordModal({ show, onClose, onSelect }) {
  const [lookupWord, setLookupWord] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const audioRef = useRef(null);

  const handleLookup = async () => {
    if (!lookupWord.trim()) {
      setLookupError("Vui lòng nhập từ vựng");
      return;
    }

    setLookingUp(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const response = await dictionaryService.lookupWord(lookupWord.trim(), "vi");

      if (response.data?.success && response.data?.data) {
        setLookupResult(response.data.data);
      } else {
        setLookupError(response.data?.message || "Không tìm thấy từ này trong từ điển");
      }
    } catch (error) {
      console.error("Error looking up word:", error);
      setLookupError(error.response?.data?.message || "Có lỗi xảy ra khi tra từ");
    } finally {
      setLookingUp(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleClose = () => {
    setLookupWord("");
    setLookupError("");
    setLookupResult(null);
    setLookingUp(false);
    if (onClose) {
      onClose();
    }
  };

  if (!show) return null;

  // Helpers to handle potential property casing differences from API
  const getVal = (obj, ...keys) => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return null;
  };

  const wordValue = getVal(lookupResult || {}, 'word', 'Word');
  const phoneticValue = getVal(lookupResult || {}, 'phonetic', 'Phonetic');
  const translationValue = getVal(lookupResult || {}, 'wordTranslation', 'WordTranslation');
  const audioUrlValue = getVal(lookupResult || {}, 'audioUrl', 'AudioUrl');
  const sourceUrlValue = getVal(lookupResult || {}, 'sourceUrl', 'SourceUrl');
  const meaningsArray = getVal(lookupResult || {}, 'meanings', 'Meanings') || [];

  return (
    <div className="modal-overlay" onClick={() => !lookingUp && handleClose()}>
      <div className="lookup-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="lookup-modal-header">
          <div className="header-icon-title">
            <FaBookOpen className="header-icon" />
            <h3>Từ điển thông minh</h3>
          </div>
          {!lookingUp && (
            <PremiumCloseButton onClick={handleClose} />
          )}
        </div>

        <div className="lookup-modal-body">
          {lookingUp ? (
            <div className="generating-content">
              <div className="loading-spinner"></div>
              <p>Đang kết nối thư viện Oxford...</p>
              <small className="text-muted">Đang phân tích định nghĩa và dịch nghĩa</small>
            </div>
          ) : lookupResult ? (
            <div className="lookup-result-container">
              {/* Premium Word Header */}
              <div className="word-hero-section">
                <div className="word-meta">
                  <div className="d-flex align-items-center gap-3">
                    <h1 className="display-6 fw-bold mb-0 text-primary">{wordValue}</h1>
                    {audioUrlValue && (
                      <button className="audio-play-btn" onClick={playAudio} title="Nghe phát âm">
                        <FaVolumeUp />
                        <audio ref={audioRef} src={audioUrlValue} />
                      </button>
                    )}
                  </div>
                  
                  <div className="d-flex align-items-center gap-2 mt-2">
                    {phoneticValue && <span className="phonetic-badge">{phoneticValue}</span>}
                    {translationValue && <span className="translation-text">• {translationValue}</span>}
                  </div>
                </div>

                {onSelect && (
                  <div className="apply-section-premium">
                    <button 
                      className="apply-fast-btn translation-primary"
                      onClick={() => onSelect({
                        word: wordValue,
                        pronunciation: phoneticValue,
                        partOfSpeech: getVal(meaningsArray[0] || {}, 'partOfSpeech', 'PartOfSpeech') || "",
                        definition: translationValue || wordValue, // Prioritize SHORT translation
                        example: getVal(getVal(meaningsArray[0] || {}, 'definitions', 'Definitions')?.[0] || {}, 'example', 'Example') || ""
                      })}
                    >
                      <FaCheck className="me-2" /> CHỌN NGHĨA NÀY (NGẮN GỌN)
                    </button>
                    {translationValue && <p className="apply-hint">Click để sử dụng nghĩa: <b>{translationValue}</b></p>}
                  </div>
                )}
              </div>

              {/* Meanings Navigation / Content */}
              <div className="meanings-wrapper mt-4">
                <h5 className="section-subtitle">Định nghĩa chi tiết (Oxford)</h5>
                {meaningsArray.map((meaning, mIdx) => (
                  <div key={mIdx} className="pos-group mb-4">
                    <div className="pos-header">
                      <span className="pos-badge">{getVal(meaning, 'partOfSpeech', 'PartOfSpeech')}</span>
                      <div className="pos-line"></div>
                    </div>

                    <div className="definitions-list">
                      {(getVal(meaning, 'definitions', 'Definitions') || []).map((def, dIdx) => (
                        <div key={dIdx} className="def-card">
                          <div className="def-content">
                            <p className="def-text">{getVal(def, 'definition', 'Definition')}</p>
                            {getVal(def, 'example', 'Example') && (
                              <p className="def-example">
                                <span>Example:</span> {getVal(def, 'example', 'Example')}
                              </p>
                            )}
                          </div>
                          {onSelect && (
                            <button 
                              className="def-select-btn detail-btn"
                              title="Sử dụng định nghĩa này"
                              onClick={() => onSelect({
                                word: wordValue,
                                pronunciation: phoneticValue,
                                partOfSpeech: getVal(meaning, 'partOfSpeech', 'PartOfSpeech'),
                                definition: getVal(def, 'definition', 'Definition'),
                                example: getVal(def, 'example', 'Example')
                              })}
                            >
                              Dùng làm định nghĩa
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Synonyms & Antonyms */}
                    <div className="extra-info-row">
                      {getVal(meaning, 'synonyms', 'Synonyms')?.length > 0 && (
                        <div className="extra-item synonyms">
                          <span className="label">Synonyms:</span>
                          <div className="tags">
                            {getVal(meaning, 'synonyms', 'Synonyms').slice(0, 5).map((s, i) => (
                              <span key={i} className="tag">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lookup-footer-info">
                 {sourceUrlValue && (
                   <a href={sourceUrlValue} target="_blank" rel="noopener noreferrer" className="external-source">
                     <FaExternalLinkAlt className="me-1" /> View on Oxford Dictionary
                   </a>
                 )}
              </div>
            </div>
          ) : (
            <div className="search-box-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className={`search-input-field ${lookupError ? "is-error" : ""}`}
                  value={lookupWord}
                  onChange={(e) => {
                    setLookupWord(e.target.value);
                    setLookupError("");
                  }}
                  placeholder="Nhập từ vựng bạn muốn tra..."
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  autoFocus
                />
              </div>
              {lookupError && <p className="error-message">{lookupError}</p>}
              
              <div className="search-suggestions">
                <p>Gợi ý:</p>
                <div className="suggestion-tags">
                  {['persistent', 'innovative', 'paradigm', 'resilient'].map(t => (
                    <span key={t} onClick={() => {setLookupWord(t); setLookupError("");}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lookup-modal-footer-actions">
           {lookupResult ? (
             <button className="btn-action secondary" onClick={() => {setLookupResult(null); setLookupWord("");}}>
               Tra từ khác
             </button>
           ) : (
             <div className="d-flex w-100 gap-2">
               <button className="btn-action secondary flex-grow-1" onClick={handleClose}>Đóng</button>
               <button className="btn-action primary flex-grow-1" onClick={handleLookup} disabled={!lookupWord.trim()}>
                 <FaSearch className="me-2" /> Tra cứu
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

