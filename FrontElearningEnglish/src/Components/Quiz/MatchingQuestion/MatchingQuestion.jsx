import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import "./MatchingQuestion.css";

export default function MatchingQuestion({ question, answer, onChange, attemptId }) {
    const { user } = useAuth();
    const options = question.options || question.Options || [];

    // --- Column Logic ---
    let leftOptions = [];
    let rightOptions = [];
    const superClean = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();

    const questionType = question.type || question.Type;

    // --- Column Reconstruction Logic (Total Control Version) ---
    let leftSide = [];
    let rightSide = [];

    try {
        const getProp = (obj, ...names) => {
            for (let name of names) {
                if (obj[name] !== undefined && obj[name] !== null) return obj[name];
            }
            return null;
        };

        const rawMeta = getProp(question, "metadataJson", "MetadataJson", "metadata_json", "metadata");
        const meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta || "{}") : (rawMeta || {});

        const rawCorrect = getProp(question, "correctAnswersJson", "CorrectAnswersJson", "correct_answers_json", "correct_answers", "correctAnswers");
        const correctMap = typeof rawCorrect === 'string' ? JSON.parse(rawCorrect || "{}") : (rawCorrect || {});

        const processedIndices = new Set();

        // Strategy A: Reconstruct from Metadata (Most accurate)
        if (meta.left && meta.right && meta.left.length > 0) {
            meta.left.forEach(lText => {
                const idx = options.findIndex((o, i) => !processedIndices.has(i) && superClean(o.text || o.optionText || o.Text) === superClean(lText));
                if (idx !== -1) { leftSide.push(options[idx]); processedIndices.add(idx); }
            });
            meta.right.forEach(rText => {
                const idx = options.findIndex((o, i) => !processedIndices.has(i) && superClean(o.text || o.optionText || o.Text) === superClean(rText));
                if (idx !== -1) { rightSide.push(options[idx]); processedIndices.add(idx); }
            });
        }

        // Strategy B: Reconstruct from CorrectMap (If metadata incomplete)
        if (leftSide.length === 0 && Object.keys(correctMap).length > 0) {
            Object.entries(correctMap).forEach(([lKey, rVal]) => {
                const lIdx = options.findIndex((o, i) => !processedIndices.has(i) && (superClean(o.text || o.optionText || o.Text) === superClean(lKey)));
                if (lIdx !== -1) { leftSide.push(options[lIdx]); processedIndices.add(lIdx); }
                const rIdx = options.findIndex((o, i) => !processedIndices.has(i) && (superClean(o.text || o.optionText || o.Text) === superClean(rVal)));
                if (rIdx !== -1) { rightSide.push(options[rIdx]); processedIndices.add(rIdx); }
            });
        }

        // Strategy C: Fallback to Flags
        if (leftSide.length === 0) {
            const flaggedLeft = options.filter(o => {
                const val = o.isCorrect !== undefined ? o.isCorrect : o.IsCorrect;
                return val === true || val === "true" || val === 1;
            });
            const flaggedRight = options.filter(o => {
                const val = o.isCorrect !== undefined ? o.isCorrect : o.IsCorrect;
                return val === false || val === "false" || val === 0 || val === null;
            });
            if (flaggedLeft.length > 0) {
                leftSide = flaggedLeft;
                rightSide = flaggedRight;
                options.forEach((o, i) => processedIndices.add(i));
            }
        }

        // Final Fallback: Interleaved
        if (processedIndices.size < options.length) {
            options.forEach((o, i) => {
                if (!processedIndices.has(i)) {
                    if (leftSide.length <= rightSide.length) leftSide.push(o);
                    else rightSide.push(o);
                }
            });
        }
    } catch (e) {
        console.error("[Matching] Reconstruction Error:", e);
    }

    leftOptions = leftSide;
    rightOptions = rightSide;

    // Helper to shuffle array with a seed for consistency (Fisher-Yates)
    const shuffleWithSeed = (array, seed) => {
        const newArray = [...array];
        let m = newArray.length, t, i;
        let currentSeed = seed;
        const nextRand = () => {
            currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
            return currentSeed / 0x7fffffff;
        };

        while (m) {
            i = Math.floor(nextRand() * m--);
            t = newArray[m];
            newArray[m] = newArray[i];
            newArray[i] = t;
        }
        return newArray;
    };

    const qId = question.questionId || question.QuestionId || 0;
    const uId = user?.userId || user?.Id || 0;
    const seedBase = Number(qId) + Number(uId) + Number(attemptId || 0);

    const finalLeft = React.useMemo(() => {
        const mapped = leftOptions.map(opt => ({
            id: opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId,
            text: opt.optionText || opt.OptionText || opt.text || opt.Text,
            mediaUrl: opt.mediaUrl || opt.MediaUrl,
            mediaType: opt.mediaType || opt.MediaType,
            isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : opt.IsCorrect
        }));
        return shuffleWithSeed(mapped, seedBase + 123);
    }, [leftOptions, seedBase]);

    const finalRight = React.useMemo(() => {
        const mapped = rightOptions.map(opt => ({
            id: opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId,
            text: opt.optionText || opt.OptionText || opt.text || opt.Text,
            mediaUrl: opt.mediaUrl || opt.MediaUrl,
            mediaType: opt.mediaType || opt.MediaType,
            isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : opt.IsCorrect
        }));
        return shuffleWithSeed(mapped, seedBase + 456);
    }, [rightOptions, seedBase]);

    const [matches, setMatches] = useState(() => {
        if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
            return answer;
        }
        return {};
    });

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const isResettingRef = React.useRef(false);

    useEffect(() => {
        isResettingRef.current = true;
        if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
            setMatches(answer);
        } else {
            setMatches({});
        }
        setSelectedLeft(null);
        setSelectedRight(null);
    }, [qId]);

    useEffect(() => {
        if (isResettingRef.current) {
            isResettingRef.current = false;
            return;
        }
        onChange(matches);
    }, [matches, onChange]);


    const handleLeftClick = (leftId) => {
        const lid = Number(leftId);
        if (selectedLeft === lid) {
            setSelectedLeft(null);
        } else {
            setSelectedLeft(lid);
            if (selectedRight !== null) {
                const newMatches = { ...matches, [lid]: Number(selectedRight) };
                setMatches(newMatches);
                setSelectedLeft(null);
                setSelectedRight(null);
            }
        }
    };

    const handleRightClick = (rightId) => {
        const rid = Number(rightId);
        if (selectedRight === rid) {
            setSelectedRight(null);
        } else {
            setSelectedRight(rid);
            if (selectedLeft !== null) {
                const newMatches = { ...matches, [selectedLeft]: rid };
                setMatches(newMatches);
                setSelectedLeft(null);
                setSelectedRight(null);
            }
        }
    };

    const getMatchedRight = (leftId) => matches[leftId] || null;
    const isRightMatched = (rightId) => Object.values(matches).map(Number).includes(Number(rightId));

    const removeMatch = (leftId) => {
        const newMatches = { ...matches };
        delete newMatches[leftId];
        setMatches(newMatches);
    };

    return (
        <Card className="matching-question p-3 mb-4 border-0 shadow-sm">
            <Card.Body>
                <div className="matching-instructions mb-4">
                    <Card.Title as="h5" className="fw-bold text-primary mb-2">
                        <i className="fa fa-link me-2"></i>Nối các cặp từ tương ứng
                    </Card.Title>
                    <Card.Text className="text-muted small">
                        Nhấp vào một mục ở cột trái, sau đó nhấp vào mục tương ứng ở cột phải để nối chúng lại với nhau.
                    </Card.Text>
                </div>
                <Row className="matching-container g-4">
                    <Col md={6} className="px-2">
                        <div className="matching-column d-flex flex-column p-3 bg-light rounded h-100">
                            <h6 className="column-title text-center mb-3 fw-bold text-secondary">Cột trái</h6>
                            {finalLeft.map((option, index) => {
                                const matchedRightId = getMatchedRight(option.id);
                                const isSelected = selectedLeft === option.id;
                                const matchedOption = finalRight.find(r => r.id === matchedRightId);

                                return (
                                    <div key={option.id} className="position-relative mb-3">
                                        <Card
                                            className={`matching-item left-item d-flex align-items-center border-2 transition-all ${isSelected ? "border-primary bg-primary text-white" : ""} ${matchedRightId ? "border-success bg-success-light" : ""}`}
                                            onClick={() => {
                                                if (matchedRightId) removeMatch(option.id);
                                                else handleLeftClick(option.id);
                                            }}
                                            style={{ cursor: "pointer", minHeight: '50px' }}
                                        >
                                            <Card.Body className="p-2">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <div className="d-flex align-items-center">
                                                        <Badge bg={isSelected ? "light" : "primary"} text={isSelected ? "dark" : "white"} className="me-2">{index + 1}</Badge>
                                                        <span className="fw-medium">{option.text}</span>
                                                    </div>
                                                    {matchedRightId && <i className="fa fa-check-circle text-success"></i>}
                                                </div>
                                                {option.mediaUrl && (
                                                    <div className="matching-item-media w-100 mt-1">
                                                        {option.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                                                            <video src={option.mediaUrl} controls className="option-media-element w-100 rounded" style={{maxHeight: '100px'}} />
                                                        ) : option.mediaUrl.match(/\.(mp3|wav)$/i) ? (
                                                            <audio src={option.mediaUrl} controls className="option-media-element w-100" />
                                                        ) : (
                                                            <img src={option.mediaUrl} alt="Option media" className="option-media-element rounded" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                                                        )}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                        {matchedRightId && matchedOption && (
                                            <div className="matched-preview small text-success fw-bold mt-1 ms-2">
                                                ➜ {matchedOption.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Col>
                    <Col md={6} className="px-2">
                        <div className="matching-column d-flex flex-column p-3 h-100">
                            <h6 className="column-title text-center mb-3 fw-bold text-secondary">Cột phải</h6>
                            {finalRight.map((option, index) => {
                                const isMatched = isRightMatched(option.id);
                                const isSelected = selectedRight === option.id;
                                return (
                                    <Card
                                        key={option.id}
                                        className={`matching-item right-item d-flex align-items-center mb-3 border-2 transition-all ${isSelected ? "border-primary bg-primary text-white" : ""} ${isMatched ? "opacity-50 grayscale border-dashed" : "border-white shadow-sm"}`}
                                        onClick={() => {
                                            if (!isMatched) handleRightClick(option.id);
                                        }}
                                        style={{ cursor: isMatched ? "default" : "pointer", minHeight: '50px' }}
                                    >
                                        <Card.Body className="p-2">
                                            <div className="d-flex align-items-center mb-1">
                                                <Badge bg="secondary" className="me-2">{String.fromCharCode(65 + index)}</Badge>
                                                <span className="fw-medium">{option.text}</span>
                                            </div>
                                            {option.mediaUrl && (
                                                <div className="matching-item-media w-100 mt-1">
                                                    {option.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                                                        <video src={option.mediaUrl} controls className="option-media-element w-100 rounded" style={{maxHeight: '100px'}} />
                                                    ) : option.mediaUrl.match(/\.(mp3|wav)$/i) ? (
                                                        <audio src={option.mediaUrl} controls className="option-media-element w-100" />
                                                    ) : (
                                                        <img src={option.mediaUrl} alt="Option media" className="option-media-element rounded" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                                                    )}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    </Col>
                </Row>
                <div className="matches-summary mt-4 d-flex flex-column align-items-center gap-2 w-100">
                    <Badge bg="info" className="p-2 px-3">
                        Đã nối: {Object.keys(matches).length} / {finalLeft.length} cặp
                    </Badge>
                </div>
            </Card.Body>
        </Card>
    );
}
