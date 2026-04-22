import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { FiMail, FiSend, FiArrowLeft } from "react-icons/fi";

const FLOW_KEY = "passwordResetFlow";

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveFlow(data) {
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(data));
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) return;

    setError("");
    setLoading(true);

    const otp = genOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    try {
      saveFlow({ email: safeEmail, otp, expiresAt, step: "otp" });

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: safeEmail,
          email: safeEmail,
          otp,
          name: "User",
        },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );

      navigate("/verify-otp", {
        state: { email: safeEmail, otp, expiresAt },
        replace: true,
      });
    } catch (err) {
      console.error("EmailJS failed:", err);
      sessionStorage.removeItem(FLOW_KEY);
      setError(
        err?.text
          ? `Send failed: ${err.text}`
          : "Failed to send code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="card-header">
          <div className="logo-mark"><span /></div>
          <h1>Forgot password?</h1>
          <p>Enter your registered email and we will send a 6-digit verification code</p>
        </div>

        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiMail /></span>
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Registered email address</label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : <><FiSend />&nbsp;Send Verification Code</>}
          </button>
        </form>

        <p className="links-row">
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <FiArrowLeft /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}