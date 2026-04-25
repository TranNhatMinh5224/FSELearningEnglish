import React from "react";
import { FaVolumeUp } from "react-icons/fa";
import "./FlashCardBack.css";

export default function FlashCardBack({ flashcard, onAudioClick }) {
    if (!flashcard) {
        return null;
    }

    const word = flashcard.word || "";
    const meaning = flashcard.meaning || "";
    const pronunciation = flashcard.pronunciation || "";
    const exampleTranslation = flashcard.exampleTranslation || "";
    const partOfSpeech = flashcard.partOfSpeech || "";
    const audioUrl = flashcard.audioUrl || "";

    const handleAudioClick = (e) => {
        e.stopPropagation();
        if (onAudioClick) {
            onAudioClick(e);
        }
    };

    return (
        <div className="flashcard-back d-flex flex-column">
            <div className="flashcard-icons-top d-flex justify-content-center align-items-center">
                {audioUrl && (
                    <button 
                        className="flashcard-audio-icon-btn d-flex align-items-center justify-content-center"
                        onClick={handleAudioClick}
                        title="Phát âm"
                    >
                        <FaVolumeUp />
                    </button>
                )}
            </div>
            <div className="flashcard-back-content d-flex flex-column align-items-center justify-content-center">
                <h2 className="flashcard-word">{word}</h2>
                
                <div className="flashcard-details-main">
                    {pronunciation && (
                        <p className="flashcard-pronunciation">/{pronunciation}/</p>
                    )}
                    {partOfSpeech && (
                        <span className="flashcard-part-of-speech">({partOfSpeech})</span>
                    )}
                </div>

                {meaning && (
                    <div className="flashcard-meaning-box">
                        <p className="flashcard-meaning-text">{meaning}</p>
                    </div>
                )}

                {exampleTranslation && (
                    <div className="flashcard-usage-section">
                        <p className="flashcard-usage-title">Ví dụ sử dụng:</p>
                        <p className="flashcard-full-example">{flashcard.example}</p>
                        <p className="flashcard-example-translation-text">{exampleTranslation}</p>
                    </div>
                )}
                
                <p className="flashcard-hint">Ấn vào thẻ để lật lại</p>
            </div>
        </div>
    );
}

