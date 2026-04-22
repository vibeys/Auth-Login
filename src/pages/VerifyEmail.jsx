import { useState, useEffect }         from "react";
import { useNavigate }                  from "react-router-dom";
import { sendEmailVerification }        from "firebase/auth";
import { useAuth }                      from "../context/AuthContext";
import { auth }                         from "../firebase";
import { FiCheckCircle, FiRefreshCw, FiLogOut } from "react-icons/fi";

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const navigate                = useNavigate();
  const [msg,      setMsg]      = useState("");
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // If already verified (e.g. came back after clicking link), go straight to dashboard
  useEffect(() => {
    if (currentUser?.emailVerified) navigate("/dashboard", { replace: true });
  }, [currentUser, navigate]);

  // Poll every 3s automatically so user doesn't have to click the button
  useEffect(() => {
    const id = setInterval(async () => {
      if (!auth.currentUser) return;
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate("/dashboard", { replace: true });
      }
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
      setError("");
      setCooldown(60);
    } catch {
      setError("Could not resend. Please wait a moment.");
    }
  }

  async function checkVerified() {
    setChecking(true); setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate("/dashboard");
      } else {
        setError("Not verified yet. Please click the link in your inbox first.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setChecking(false);
  }

  async function handleLogout() { await logout(); navigate("/login"); }

  return (
    <div className="auth-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="card-header">
          <div className="verify-icon">📬</div>
          <h1>Check your email</h1>
          <p>We sent a verification link to:</p>
          <div className="verify-email-chip">{currentUser?.email}</div>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.75rem", lineHeight: 1.6 }}>
            Click the link in the email to activate your account.<br />
            This page will update automatically once verified.<br />
            Don't see it? Check your spam folder.
          </p>
        </div>

        {/* Auto-checking indicator */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "0.5rem", color: "var(--muted)", fontSize: "0.78rem",
          marginBottom: "1rem",
        }}>
          <span className="spinner" style={{
            width: 12, height: 12, borderWidth: 2,
            borderColor: "rgba(245,158,11,0.2)",
            borderTopColor: "var(--accent)",
          }} />
          Checking automatically…
        </div>

        {msg   && <div className="success-banner"><FiCheckCircle />&nbsp;{msg}</div>}
        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <div className="auth-form">
          <button className="submit-btn" onClick={checkVerified} disabled={checking}>
            {checking
              ? <span className="spinner" />
              : <><FiCheckCircle />&nbsp;I've verified my email</>
            }
          </button>

          <button className="btn-ghost" onClick={resend} disabled={cooldown > 0}>
            <FiRefreshCw />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
          </button>
        </div>

        <p className="links-row" style={{ marginTop: "1rem" }}>
          <button className="logout-text-btn" onClick={handleLogout}>
            <FiLogOut /> Sign out
          </button>
        </p>
      </div>
    </div>
  );
}