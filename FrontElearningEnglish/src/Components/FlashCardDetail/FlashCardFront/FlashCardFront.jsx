import React from "react";
import { FaVolumeUp } from "react-icons/fa";
import "./FlashCardFront.css";

export default function FlashCardFront({ flashcard, onAudioClick }) {
    if (!flashcard) {
        return null;
    }

    const word = flashcard.word || "";
    const example = flashcard.example || "";
    const exampleTranslation = flashcard.exampleTranslation || "";
    const audioUrl = flashcard.audioUrl || "";
    const imageUrl = flashcard.imageUrl || "";
    
    // Create cloze-deletion (blank out the word in the example sentence)
    const getClozeExample = (text, targetWord) => {
        if (!text || !targetWord) return text;
        const escapedWord = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(\\b)${escapedWord}(\\b)`, 'gi');
        return text.replace(regex, '$1___$2');
    };

    const clozeExample = getClozeExample(example, word);

    const handleAudioClick = (e) => {
        e.stopPropagation();
        if (onAudioClick) {
            onAudioClick(e);
        }
    };

    return (
        <div className="flashcard-front d-flex flex-column">
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
            
            {imageUrl && (
                <div className="flashcard-image">
                    <img src={imageUrl} alt={`Hình ảnh minh họa cho từ "${word}"`} />
                </div>
            )}

            <div className="flashcard-content d-flex flex-column align-items-center">
                <h2 className="flashcard-word-front">{word}</h2>
                
                {clozeExample && (
                    <div 
                        className="flashcard-example-cloze"
                        dangerouslySetInnerHTML={{ __html: clozeExample }}
                    />
                )}

                <p className="flashcard-hint">Ấn vào thẻ để lật</p>
            </div>
        </div>
    );
}

