import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { FiCheckCircle, FiRefreshCw, FiLogOut } from "react-icons/fi";

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const navigate                = useNavigate();
  const [msg,      setMsg]      = useState("");
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { if (!currentUser) navigate("/login"); }, [currentUser, navigate]);
  useEffect(() => {
    if (currentUser?.emailVerified) navigate("/dashboard", { replace: true });
  }, [currentUser, navigate]);

  // Auto-poll every 3s
  useEffect(() => {
    const id = setInterval(async () => {
      if (!auth.currentUser) return;
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) navigate("/dashboard", { replace: true });
    }, 3000);
    return () => clearInterval(id);
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Verification email sent! Check your inbox.");
      setError(""); setCooldown(60);
    } catch { setError("Could not resend. Please wait a moment."); }
  }

  async function checkVerified() {
    setChecking(true); setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate("/dashboard");
      } else {
        setError("Not verified yet. Please click the link in your email first.");
      }
    } catch { setError("Something went wrong. Please try again."); }
    setChecking(false);
  }

  async function handleLogout() { await logout(); navigate("/login"); }

  return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-warn">📬</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Check your email
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.55, marginBottom: "0.25rem" }}>
          We sent a verification link to:
        </p>
        <span className="email-chip">{currentUser?.email}</span>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Click the link in the email to activate your account.<br />
          This page updates automatically once verified.<br />
          Can't find it? Check your spam folder.
        </p>

        {/* Auto-checking indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", color: "var(--muted)", fontSize: "0.78rem", marginBottom: "1.25rem" }}>
          <span className="spinner spinner-dark" style={{ width: 12, height: 12, borderWidth: 2 }} />
          Checking automatically…
        </div>

        {msg   && <div className="success-banner"><FiCheckCircle />&nbsp;{msg}</div>}
        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button className="submit-btn" onClick={checkVerified} disabled={checking}>
            {checking ? <span className="spinner" /> : <><FiCheckCircle />&nbsp;I've verified my email</>}
          </button>
          <button className="btn-ghost" onClick={resend} disabled={cooldown > 0}>
            <FiRefreshCw />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
          </button>
        </div>

        <p className="links-row" style={{ marginTop: "1.25rem" }}>
          <button className="logout-text-btn" onClick={handleLogout}>
            <FiLogOut />&nbsp;Sign out
          </button>
        </p>
      </div>
    </div>
  );
}