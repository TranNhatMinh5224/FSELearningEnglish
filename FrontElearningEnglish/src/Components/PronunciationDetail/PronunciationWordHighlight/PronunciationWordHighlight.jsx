import React from "react";
import "./PronunciationWordHighlight.css";

/**
 * PronunciationWordHighlight - Displays text with word-level highlighting
 * @param {string} originalText - The reference text to be pronounced
 * @param {Array} words - Array of word-level details from assessment result
 */
const PronunciationWordHighlight = ({ originalText, words = [] }) => {
    if (!originalText) return null;

    // If no assessment yet, just show the plain text
    if (!words || words.length === 0) {
        return <h2 className="pronunciation-target-word">{originalText}</h2>;
    }

    return (
        <div className="pronunciation-highlighted-text">
            {words.map((wordDetail, index) => {
                const { Word, AccuracyScore, ErrorType } = wordDetail;
                
                let statusClass = "word-neutral";
                if (ErrorType === "None") {
                    if (AccuracyScore >= 90) statusClass = "word-correct";
                    else if (AccuracyScore >= 60) statusClass = "word-warning";
                    else statusClass = "word-error";
                } else if (ErrorType === "Mispronunciation") {
                    statusClass = "word-error";
                } else if (ErrorType === "Omission") {
                    statusClass = "word-omission";
                } else if (ErrorType === "Insertion") {
                    statusClass = "word-insertion";
                }

                return (
                    <span 
                        key={index} 
                        className={`highlighted-word ${statusClass}`}
                        title={`Score: ${Math.round(AccuracyScore)}% | ${ErrorType}`}
                    >
                        {Word}
                    </span>
                );
            })}
        </div>
    );
};

export default PronunciationWordHighlight;
