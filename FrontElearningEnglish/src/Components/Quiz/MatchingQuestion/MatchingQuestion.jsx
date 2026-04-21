import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import "./MatchingQuestion.css";

export default function MatchingQuestion({ question, answer, onChange }) {
    const { user } = useAuth();
    const options = question.options || question.Options || [];
    
    // --- Column Separation Logic ---
    let leftOptions = [];
    let rightOptions = [];

    // 1. Try isCorrect property first (Canonical way)
    const correctlyFlaggedLeft = options.filter(o => o.isCorrect === true || o.IsCorrect === true);
    const correctlyFlaggedRight = options.filter(o => o.isCorrect === false || o.IsCorrect === false);
    
    if (correctlyFlaggedLeft.length > 0 && correctlyFlaggedRight.length > 0 && 
        Math.abs(correctlyFlaggedLeft.length - correctlyFlaggedRight.length) <= 1) {
        leftOptions = correctlyFlaggedLeft;
        rightOptions = correctlyFlaggedRight;
    } else {
        // 2. Fallback: Use CorrectAnswersJson keys to identify Left side
        try {
            const rawCorrect = question.correctAnswersJson || question.CorrectAnswersJson;
            const correctMap = typeof rawCorrect === 'string' ? JSON.parse(rawCorrect || "{}") : (rawCorrect || {});
            const leftKeys = Object.keys(correctMap);
            
            if (leftKeys.length > 0) {
                const usedIndices = new Set();
                // Pick options matching keys for Left
                leftKeys.forEach(key => {
                    const idx = options.findIndex((o, i) => !usedIndices.has(i) && (o.text || o.optionText || o.Text || "").trim() === key.trim());
                    if (idx !== -1) {
                        leftOptions.push(options[idx]);
                        usedIndices.add(idx);
                    }
                });
                // Remaining go to Right
                options.forEach((o, i) => {
                    if (!usedIndices.has(i)) rightOptions.push(o);
                });
            }
        } catch (e) {
            console.error("Error splitting columns via CorrectAnswersJson:", e);
        }

        // 3. Last fallback: Interleaved split (L, R, L, R)
        if (leftOptions.length === 0 || rightOptions.length === 0) {
            leftOptions = options.filter((_, idx) => idx % 2 === 0);
            rightOptions = options.filter((_, idx) => idx % 2 !== 0);
        }
    }

    // Helper to shuffle array with a seed for consistency
    const shuffleWithSeed = (array, seed) => {
        const newArray = [...array];
        let m = newArray.length, t, i;
        // Use a simple LCG-like pseudo-random generator based on seed
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

    // Shuffle cả 2 cột để tăng tính thử thách (Sử dụng QuestionId + UserId làm seed)
    const qId = question.questionId || question.QuestionId || 0;
    const uId = user?.userId || user?.Id || 0;
    const seedBase = qId + uId;

    // Dùng memo để tránh shuffle lại mỗi lần render nếu không cần
    const finalLeft = React.useMemo(() => {
        const mapped = leftOptions.map(opt => ({
            id: opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId,
            text: opt.optionText || opt.OptionText || opt.text || opt.Text
        }));
        return shuffleWithSeed(mapped, seedBase + 123);
    }, [leftOptions, seedBase]);

    const finalRight = React.useMemo(() => {
        const mapped = rightOptions.map(opt => ({
            id: opt.optionId || opt.OptionId || opt.answerOptionId || opt.AnswerOptionId,
            text: opt.optionText || opt.OptionText || opt.text || opt.Text
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

    // Ref để tránh gọi onChange khi đang reset state
    const isResettingRef = React.useRef(false);

    // 🔑 Reset state khi chuyển sang câu hỏi khác (fix: useState chỉ chạy 1 lần)
    useEffect(() => {
        isResettingRef.current = true;
        if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
            setMatches(answer);
        } else {
            setMatches({});
        }
        setSelectedLeft(null);
        setSelectedRight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qId]); // Reset khi questionId thay đổi

    useEffect(() => {
        if (isResettingRef.current) {
            isResettingRef.current = false;
            return; // Bỏ qua lần gọi onChange ngay sau khi reset
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

    const getMatchedRight = (leftId) => {
        return matches[leftId] || null;
    };

    const isRightMatched = (rightId) => {
        return Object.values(matches).map(Number).includes(Number(rightId));
    };

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
                                
                                // Tìm text của vế phải đã nối để hiển thị preview
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
                                            <Card.Body className="p-2 d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <Badge bg={isSelected ? "light" : "primary"} text={isSelected ? "dark" : "white"} className="me-2">{index + 1}</Badge>
                                                    <span className="fw-medium">{option.text}</span>
                                                </div>
                                                {matchedRightId && <i className="fa fa-check-circle text-success"></i>}
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
                                        <Card.Body className="p-2 d-flex align-items-center">
                                            <Badge bg="secondary" className="me-2">{String.fromCharCode(65 + index)}</Badge>
                                            <span className="fw-medium">{option.text}</span>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    </Col>
                </Row>
                <div className="matches-summary mt-4 d-flex justify-content-center">
                    <Badge bg="info" className="p-2 px-3">
                        Đã nối: {Object.keys(matches).length} / {finalLeft.length} cặp
                    </Badge>
                </div>
            </Card.Body>
        </Card>
    );
}

