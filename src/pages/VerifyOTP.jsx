import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

const FLOW_KEY = "passwordResetFlow";
function genOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp: initOTP, expiresAt: initExpiry } = location.state || {};

  const [digits,     setDigits]     = useState(["", "", "", "", "", ""]);
  const [error,      setError]      = useState("");
  const [resending,  setResending]  = useState(false);
  const [resent,     setResent]     = useState(false);
  const [currentOTP, setCurrentOTP] = useState(initOTP || "");
  const [expiry,     setExpiry]     = useState(initExpiry || 0);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email || !initOTP) { navigate("/forgot-password", { replace: true }); return; }
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ email, otp: initOTP, expiresAt: initExpiry, step: "otp" }));
  }, [email, initOTP, initExpiry, navigate]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  function handleChange(idx, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits]; next[idx] = val; setDigits(next); setError("");
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  }
  function handleKeyDown(idx, e) {
    if (e.key === "Backspace") {
      if (digits[idx]) { const n = [...digits]; n[idx] = ""; setDigits(n); }
      else if (idx > 0) inputRefs.current[idx - 1]?.focus();
    }
  }
  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleVerify(e) {
    e.preventDefault();
    const entered = digits.join("");
    if (entered.length < 6) return setError("Please enter all 6 digits.");
    if (timeLeft === 0)      return setError("Code expired. Request a new one below.");
    if (entered !== currentOTP) return setError("Incorrect code. Please try again.");
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ email, step: "otp-verified", verifiedAt: Date.now() }));
    navigate("/reset-password", { state: { email, fromOtp: true }, replace: true });
  }

  async function handleResend() {
    setResending(true); setError("");
    const newOTP = genOTP();
    const newExpiry = Date.now() + 10 * 60 * 1000;
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { to_email: email, email, otp: newOTP, name: "User" },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );
      setCurrentOTP(newOTP); setExpiry(newExpiry);
      setDigits(["", "", "", "", "", ""]);
      sessionStorage.setItem(FLOW_KEY, JSON.stringify({ email, otp: newOTP, expiresAt: newExpiry, step: "otp" }));
      setResent(true); setTimeout(() => setResent(false), 4000);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.text ? `Resend failed: ${err.text}` : "Failed to resend. Try again.");
    } finally { setResending(false); }
  }

  const filled = digits.join("").length === 6;
  const canResend = timeLeft <= 540;

  return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-info">🔐</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Enter your code
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
          We sent a 6-digit code to
        </p>
        <span className="email-chip">{email}</span>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          Check your inbox and spam folder.
        </p>

        {resent && <div className="success-banner"><FiCheck />&nbsp;New code sent!</div>}
        {error  && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <form onSubmit={handleVerify}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => (inputRefs.current[i] = el)}
                className={`otp-digit${d ? " filled" : ""}`}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          <div className="otp-timer">
            {timeLeft > 0
              ? <>Code expires in&nbsp;<strong style={{ color: timeLeft < 60 ? "var(--error)" : "var(--accent)" }}>{fmt(timeLeft)}</strong></>
              : <span style={{ color: "var(--error)" }}>Code expired — request a new one</span>}
          </div>
          <button type="submit" className="submit-btn" disabled={!filled || timeLeft === 0}>
            <FiCheck />&nbsp;Verify Code
          </button>
        </form>

        <div className="resend-row" style={{ marginTop: "1.25rem" }}>
          Didn't receive it?&nbsp;
          <button className="resend-btn" onClick={handleResend}
            disabled={resending || !canResend} type="button">
            {resending ? "Sending…" : canResend ? "Resend code" : `Wait ${fmt(timeLeft - 540)}`}
          </button>
        </div>

        <p className="links-row">
          <Link to="/forgot-password" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            <FiArrowLeft />&nbsp;Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}