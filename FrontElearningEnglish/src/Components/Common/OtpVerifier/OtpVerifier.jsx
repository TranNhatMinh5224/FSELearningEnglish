import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button, Alert, Form } from "react-bootstrap";
import { FaSyncAlt } from "react-icons/fa";
import "./OtpVerifier.css";

/**
 * Props:
 * - email: string
 * - title: string (optional)
 * - description: string (optional)
 * - initialSeconds: number (default 120)
 * - verifyFn: async (code) => { success: boolean, message?: string, data?: any }
 * - resendFn: async () => { success: boolean, message?: string }
 * - onVerifySuccess: (res) => void
 */
export default function OtpVerifier({
  email,
  title = "Xác minh OTP",
  description,
  expirySeconds = 300,
  resendSeconds = 60,
  verifyFn,
  resendFn,
  onVerifySuccess,
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'error' or 'success'
  const [loading, setLoading] = useState(false);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [remainingExpiry, setRemainingExpiry] = useState(expirySeconds);
  const [remainingResend, setRemainingResend] = useState(resendSeconds);
  const expiryTimerRef = useRef(null);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    startExpiryTimer(expirySeconds);
    startResendTimer(resendSeconds);
    return () => {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startExpiryTimer = (seconds) => {
    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    setRemainingExpiry(seconds);
    expiryTimerRef.current = setInterval(() => {
      setRemainingExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(expiryTimerRef.current);
          expiryTimerRef.current = null;
          setMessage({ text: "Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP.", type: "error" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendTimer = (seconds) => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setRemainingResend(seconds);
    resendTimerRef.current = setInterval(() => {
      setRemainingResend((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "");
    if (numericValue === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }
    const digit = numericValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) setMessage({ text: "", type: "" });
    if (digit && index < 5) setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
      setMessage({ text: "", type: "" });
    }
  };

  const clearOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setMessage({ text: "", type: "" });
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setMessage({ text: "Vui lòng nhập đầy đủ mã OTP.", type: "error" });
      return;
    }
    if (remainingExpiry === 0) {
      setMessage({ text: "Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP.", type: "error" });
      return;
    }
    if (!verifyFn) return;
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await verifyFn(code);
      if (res?.success) {
        if (onVerifySuccess) onVerifySuccess(res);
      } else {
        clearOtp();
        const msg = res?.message || "Mã OTP không đúng hoặc đã hết hạn.";
        const isMaxAttemptsReached = msg.includes("quá") && msg.includes("lần") && (msg.includes("5 lần") || msg.includes("quá 5"));
        if (isMaxAttemptsReached) {
          setMaxAttemptsReached(true);
          setMessage({ text: "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới.", type: "error" });
        } else {
          setMessage({ text: msg, type: "error" });
        }
      }
    } catch (err) {
      clearOtp();
      const msg = err?.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.";
      const isMaxAttemptsReached = msg.includes("quá") && msg.includes("lần") && (msg.includes("5 lần") || msg.includes("quá 5"));
      if (isMaxAttemptsReached) {
        setMaxAttemptsReached(true);
        setMessage({ text: "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới.", type: "error" });
      } else {
        setMessage({ text: msg, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendFn || remainingResend > 0) return;
    setLoading(true);
    setMessage({ text: "", type: "" });
    setMaxAttemptsReached(false);
    try {
      const res = await resendFn();
      if (res?.success) {
        clearOtp();
        setMessage({ text: "Mã OTP mới đã được gửi đến email của bạn!", type: "success" });
        startExpiryTimer(expirySeconds);
        startResendTimer(resendSeconds);
      } else {
        setMessage({ text: res?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại.", type: "error" });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <div className="otp-box">
              <h2>{title}</h2>
              {description ? (
                <p className="otp-desc">{description}</p>
              ) : (
                <p className="otp-desc">Mã xác minh đã được gửi đến email <strong>{email}</strong></p>
              )}

              <div className="otp-input-group">
                {otp.map((digit, index) => (
                  <Form.Control
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    className="otp-input"
                    maxLength={1}
                    inputMode="numeric"
                    type="text"
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    autoComplete="off"
                    disabled={loading || maxAttemptsReached}
                  />
                ))}
              </div>

              <div className="d-flex flex-column align-items-center mb-3">
                <span className="otp-timer">Mã có hiệu lực trong: {formatTime(remainingExpiry)}</span>
                {remainingResend > 0 && (
                    <span className="otp-resend-wait">Có thể gửi lại sau: {remainingResend}s</span>
                )}
              </div>

              {message.text && (
                <Alert variant={message.type === "success" ? "success" : "danger"} className={`otp-alert ${message.type === "error" && maxAttemptsReached ? "otp-error-max" : ""}`}>
                  {message.text}
                </Alert>
              )}

              <div className="d-grid">
                <Button
                  variant="primary"
                  size="lg"
                  className="otp-btn"
                  onClick={handleVerify}
                  disabled={loading || maxAttemptsReached || remainingExpiry === 0}
                >
                  {loading ? "Đang xác minh..." : "Xác minh"}
                </Button>
              </div>

              <div className="otp-resend text-center mt-3">
                <span>Chưa nhận được mã? </span>
                <Button
                  variant="link"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={loading || maxAttemptsReached || remainingResend > 0}
                >
                  <FaSyncAlt className={`resend-icon ${loading ? "spinning" : ""}`} />
                  {loading ? "Đang gửi..." : (remainingResend > 0 ? `Gửi lại mã OTP (${remainingResend}s)` : "Gửi lại mã OTP")}
                </Button>
                {remainingExpiry === 0 && <span className="otp-expired"> &nbsp;Mã đã hết hạn</span>}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

