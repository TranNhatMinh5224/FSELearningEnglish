import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./FillBlankQuestion.css";

/**
 * FillBlankQuestion
 * Logic: Parse text chứa các cụm [đáp án] thành câu có ô Input.
 */
export default function FillBlankQuestion({ question, answer, onChange }) {
    // Lấy nội dung câu hỏi từ nhiều nguồn có thể có của Backend
    const text = useMemo(() => {
        return (
            question?.questionText || 
            question?.QuestionText || 
            question?.stemText || 
            question?.StemText || 
            ""
        );
    }, [question]);

    // Parse nội dung để tìm các ô trống (hỗ trợ cả [...] và ___)
    // Parse nội dung để tìm các ô trống (hỗ trợ [...], {...}, (...) và ___)
    const parts = useMemo(() => {
        // Regex này bắt cụm ____, [đáp án], {đáp án} hoặc (đáp án)
        return text.split(/(_+|\[.*?\]|\{.*?\}|\(.*?\))/g);
    }, [text]);
    
    const isBlankPart = (p) => {
        if (!p) return false;
        const trimmed = p.trim();
        return (
            trimmed.startsWith('_') || 
            (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('(') && trimmed.endsWith(')'))
        );
    };

    // Đếm số lượng ô trống thực tế
    const blanksCount = useMemo(() => {
        return parts.filter(isBlankPart).length;
    }, [parts]);

    // Parse answer helper
    const parseAnswer = useCallback((ans) => {
        try {
            if (!ans) return new Array(blanksCount).fill("");
            if (typeof ans === 'string' && ans.startsWith('[')) {
                const parsed = JSON.parse(ans);
                return Array.isArray(parsed) ? parsed : [ans];
            }
            if (Array.isArray(ans)) return ans;
            // Handle comma separated string logic if needed, or just treat as single
            if (typeof ans === 'string') {
                 if (blanksCount > 1 && ans.includes(", ")) return ans.split(", ");
                 return [ans];
            }
        } catch (e) {
            console.error("FillBlank Error parsing answer:", e);
        }
        return new Array(blanksCount).fill("");
    }, [blanksCount]);

    // Khởi tạo state inputs
    const [inputs, setInputs] = useState(() => parseAnswer(answer));

    // Đồng bộ inputs khi answer hoặc blanksCount thay đổi (Fix bug chuyển câu hỏi không reset)
    useEffect(() => {
        const newInputs = parseAnswer(answer);
        // Ensure length match
        if (newInputs.length < blanksCount) {
             while (newInputs.length < blanksCount) newInputs.push("");
        }
        setInputs(newInputs);
    }, [answer, blanksCount, parseAnswer]);

    const handleInputChange = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);
        
        // Gửi kết quả về parent để nộp bài
        if (blanksCount === 1) {
            // Nếu chỉ có 1 ô, gửi chính xác giá trị text (đã trim) để backend so sánh chuỗi
            onChange(value); 
        } else {
            // Nếu nhiều ô, gửi chuỗi nối (logic mặc định của backend cũ)
            onChange(newInputs.map(i => i.trim()).join(", "));
        }
    };

    if (!text) return null;

    let currentBlankIdx = 0;

    return (
        <div className="fill-blank-question-container mt-3 p-4 bg-white rounded shadow-sm border">
            <div className="fill-blank-sentence" style={{ lineHeight: '3.5rem', fontSize: '1.25rem', color: '#333' }}>
                {parts.map((part, i) => {
                    // Kiểm tra xem part này có phải là ô trống không
                    if (isBlankPart(part)) {
                        const index = currentBlankIdx++;
                        // Tính toán độ rộng dựa trên nội dung trong ngoặc
                        // Loại bỏ các ký tự bao quanh để lấy đáp án mẫu tính độ rộng
                        const expectedAnswer = part.replace(/^(_+|\[|\{|\()|(\]|\}|\)|_+)$/g, '');
                        const charCount = Math.max(expectedAnswer.length, 1);
                        const adaptiveWidth = Math.min(Math.max(charCount * 14 + 20, 40), 400);

                        return (
                            <input
                                key={i}
                                type="text"
                                className="fill-blank-inline-input"
                                value={inputs[index] || ""}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                autoComplete="off"
                                style={{
                                    width: `${adaptiveWidth}px`
                                }}
                            />
                        );
                    }
                    // Nếu là text bình thường
                    return <span key={i}>{part}</span>;
                })}
            </div>

            {/* Fallback: Nếu giáo viên quên dùng ngoặc vuông [] nhưng vẫn chọn loại câu hỏi điền từ */}
            {blanksCount === 0 && (
                <div className="mt-4 border-top pt-3">
                    <label className="form-label text-muted small">Câu trả lời của bạn:</label>
                    <input
                        type="text"
                        className="form-control form-control-lg"
                        value={inputs[0] || ""}
                        onChange={(e) => handleInputChange(0, e.target.value)}
                        placeholder="Nhập đáp án tại đây..."
                    />
                </div>
            )}

            <div className="mt-4 pt-3 border-top d-flex align-items-center text-muted small">
                <span className="badge bg-info me-2">Mẹo</span>
                Nhấp vào vùng màu xanh để điền từ còn thiếu vào chỗ trống.
            </div>
        </div>
    );
}
