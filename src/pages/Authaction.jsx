/**
 * AuthAction.jsx
 * ──────────────────────────────────────────────────────────────────
 * This page handles ALL Firebase email action links.
 * Set BOTH Firebase action URLs to: https://yourdomain.com/auth/action
 *
 * mode=verifyEmail   → applies code, shows ✅, redirects to /dashboard
 * mode=resetPassword → shows inline new-password form, then → /login
 * mode=recoverEmail  → applies code, shows success, redirects to /login
 * ──────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

function getStrength(p) {
  if (!p) return null;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return [
    { label: "Very Weak",   color: "#ef4444", pct: 10  },
    { label: "Weak",        color: "#f97316", pct: 25  },
    { label: "Fair",        color: "#eab308", pct: 50  },
    { label: "Good",        color: "#84cc16", pct: 70  },
    { label: "Strong",      color: "#22c55e", pct: 88  },
    { label: "Very Strong", color: "#10b981", pct: 100 },
  ][Math.min(s, 5)];
}

// ── Inline reset-password form ────────────────────────────────────────────────
function ResetForm({ oobCode, email }) {
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const strength = getStrength(newPass);
  const matchOk  = confirm && newPass === confirm;
  const matchBad = confirm && newPass !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPass !== confirm)            return setError("Passwords do not match.");
    if (newPass.length < 8)             return setError("Password must be at least 8 characters.");
    if (!strength || strength.pct < 25) return setError("Please choose a stronger password.");
    setError(""); setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPass);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(
        err.code === "auth/expired-action-code" ? "Reset link expired. Please request a new one." :
        err.code === "auth/invalid-action-code" ? "Reset link already used. Please request a new one." :
        err.code === "auth/weak-password"       ? "Password too weak." :
        "Failed to reset password. Please try again."
      );
    }
    setLoading(false);
  }

  if (done) return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-ok">🎉</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Password updated!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Your password has been set. Redirecting to sign in…
        </p>
        <div className="progress-wrap"><div className="progress-fill" /></div>
      </div>
    </div>
  );

  return (
    <div className="centered-wrapper">
      <div className="centered-card" style={{ textAlign: "left" }}>
        <div className="card-header">
          <div className="logo-mark"><span /></div>
          <h1>Create new password</h1>
          <p>For <strong style={{ color: "var(--accent)" }}>{email}</strong></p>
        </div>
        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showNew ? "text" : "password"} placeholder=" "
              value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
            <label>New password</label>
            <button type="button" className="toggle-password" onClick={() => setShowNew(!showNew)}>
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {strength && (
            <div className="strength-wrap">
              <div className="strength-bar"><div className="strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} /></div>
              <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showCon ? "text" : "password"} placeholder=" "
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              style={matchBad ? { borderColor: "var(--error)" } : matchOk ? { borderColor: "var(--success)" } : {}} />
            <label>Confirm password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCon(!showCon)}>
              {showCon ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {matchBad && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords don't match</p>}
          {matchOk  && <p style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords match ✓</p>}
          <button type="submit" className="submit-btn" disabled={loading || !newPass || !confirm}>
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Set New Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AuthAction() {
  const navigate = useNavigate();
  const location = useLocation();
  const params   = new URLSearchParams(location.search);
  const mode     = params.get("mode");
  const oobCode  = params.get("oobCode");

  const [phase,      setPhase]      = useState("processing");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!oobCode || !mode) { navigate("/login", { replace: true }); return; }

    async function handle() {
      if (mode === "verifyEmail") {
        try {
          await applyActionCode(auth, oobCode);
          await auth.currentUser?.reload();
          setPhase("verified");
          // After 2.5s go to dashboard (or login if not signed in)
          setTimeout(() => navigate(auth.currentUser ? "/dashboard" : "/login", { replace: true }), 2500);
        } catch {
          if (auth.currentUser?.emailVerified) {
            // Already verified — just navigate silently
            navigate("/dashboard", { replace: true });
          } else {
            setErrorMsg("This verification link has expired or already been used. Please request a new one.");
            setPhase("error");
          }
        }

      } else if (mode === "resetPassword") {
        try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          setResetEmail(email);
          setPhase("resetPassword");
        } catch {
          setErrorMsg("This reset link has expired or already been used. Please request a new code.");
          setPhase("error");
        }

      } else if (mode === "recoverEmail") {
        try {
          await applyActionCode(auth, oobCode);
          setPhase("recovered");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
        } catch {
          setErrorMsg("This recovery link is invalid or has expired.");
          setPhase("error");
        }

      } else {
        navigate("/login", { replace: true });
      }
    }
    handle();
  }, []); // eslint-disable-line

  if (phase === "processing") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 2.5, display: "block", margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Processing your request…</p>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-err">⚠️</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem", color: "var(--text)" }}>
          Link expired
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.75rem" }}>{errorMsg}</p>
        <Link to="/login" className="submit-btn" style={{ textDecoration: "none" }}>
          <FiArrowLeft />&nbsp;Back to Sign In
        </Link>
      </div>
    </div>
  );

  if (phase === "verified") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-ok">✅</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Email verified!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Your account is now active. Redirecting you in a moment…
        </p>
        <div className="progress-wrap"><div className="progress-fill" /></div>
      </div>
    </div>
  );

  if (phase === "resetPassword") return (
    <ResetForm oobCode={oobCode} email={resetEmail} />
  );

  if (phase === "recovered") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-teal">📧</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem", color: "var(--text)" }}>
          Email recovered!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Your email address has been restored. Redirecting…
        </p>
      </div>
    </div>
  );

  return null;
}