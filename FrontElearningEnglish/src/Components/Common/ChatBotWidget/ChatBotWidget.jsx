import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiSend, FiX, FiMessageSquare } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { BsPerson } from "react-icons/bs";
import chatBotService from "../../../Services/chatBotService";
import "./ChatBotWidget.css";

// ── Câu gợi ý mặc định ──────────────────────────────────────
const SUGGESTIONS = [
  "Tôi muốn học tiếng Anh ",
  "Gói Teacher giá bao nhiêu?",
];

// ── Tin nhắn chào mặc định ───────────────────────────────────
const WELCOME_MESSAGE = {
  id: "welcome",
  role: "bot",
  text: "Xin chào! 👋 Mình là **Catalunya AI**.\n\nMình có thể giúp bạn:\n- 📚 Tìm **khóa học tiếng Anh** phù hợp\n- 👨‍🏫 Tư vấn **nâng cấp tài khoản Giáo viên**\n- 🛡️ Thông tin về **chính sách học tập**\n\nBạn muốn tìm hiểu gì hôm nay?",
};

let msgIdCounter = 1;
const newId = () => `msg-${msgIdCounter++}`;

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBadge, setShowBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) {
      setShowBadge(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text) => {
      const prompt = (text || input).trim();
      if (!prompt || loading) return;

      setError("");
      setInput("");

      // Add user bubble
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: prompt },
      ]);
      setLoading(true);

      try {
        const res = await chatBotService.chat(prompt);
        // data trả về format mới: { response: "...", sentAt: "..." }
        const answer = res?.response || res?.data?.response || "Xin lỗi, mình chưa tìm được câu trả lời phù hợp.";
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "bot", text: answer },
        ]);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 429) {
          const serverMsg = err?.response?.data?.message || err?.response?.data?.Message;
          setError(serverMsg || "Bạn gửi quá nhanh. Vui lòng đợi một chút rồi thử lại.");
        } else if (status === 400) {
          const data = err?.response?.data;
          const serverMsg = data?.message || data?.Message || (data?.errors ? JSON.stringify(data.errors) : (typeof data === "string" ? data : null));
          setError(serverMsg || "Câu hỏi chưa hợp lệ hoặc quá dài. Vui lòng thử lại.");
        } else {
          setError("Không thể kết nối đến AI. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError("");
  };

  // Auto resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <>
      {/* ── FAB Toggle Button ── */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở AI Assistant"
        title="Catalunya AI"
      >
        {open ? <FiX size={22} /> : <FiMessageSquare size={22} />}
        {showBadge && !open && <span className="chatbot-fab-badge" />}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Catalunya AI">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">
              <RiRobot2Line />
            </div>
            <div className="chatbot-header-info">
              <h6>Catalunya AI</h6>
              <small>🟢 Đang hoạt động — Tư vấn khóa học & Teacher</small>
            </div>
            <button
              className="chatbot-header-close"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-bubble-wrapper ${msg.role}`}
              >
                {msg.role === "bot" && (
                  <div className="chatbot-bubble-avatar">
                    <RiRobot2Line />
                  </div>
                )}
                <div className={`chatbot-bubble ${msg.role}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, href, children, ...props }) => {
                        const isInternal = href?.startsWith("/");
                        if (isInternal) {
                          return <Link to={href} {...props} style={{ color: "var(--color-primary-main, #6c63ff)", fontWeight: "600" }}>{children}</Link>;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                {msg.role === "user" && (
                  <div className="chatbot-bubble-avatar" style={{ background: "linear-gradient(135deg,#ff6b6b,#ffa36c)" }}>
                    <BsPerson />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chatbot-bubble-wrapper bot">
                <div className="chatbot-bubble-avatar">
                  <RiRobot2Line />
                </div>
                <div className="chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {showSuggestions && (
            <div className="chatbot-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="chatbot-suggestion-btn"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <div className="chatbot-error">⚠️ {error}</div>}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi... (Enter để gửi)"
              rows={1}
              disabled={loading}
              aria-label="Nhập câu hỏi"
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Gửi"
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
