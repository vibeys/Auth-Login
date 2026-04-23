import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

const ERR = {
  "auth/wrong-password":        "Current password is incorrect.",
  "auth/invalid-credential":    "Current password is incorrect.",
  "auth/weak-password":         "New password is too weak.",
  "auth/requires-recent-login": "Session expired. Please sign out and sign in again.",
  "auth/too-many-requests":     "Too many attempts. Please wait.",
};

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

export default function UpdatePassword() {
  const { currentUser, changePassword } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength  = getStrength(newPass);
  const isGoogleOnly = currentUser?.providerData?.every(p => p.providerId === "google.com");

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPass !== confirm)            return setError("New passwords do not match.");
    if (newPass.length < 8)             return setError("Password must be at least 8 characters.");
    if (!strength || strength.pct < 25) return setError("Please choose a stronger password.");
    setError(""); setLoading(true);
    try {
      if (isGoogleOnly) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(auth.currentUser, provider);
      } else {
        const cred = EmailAuthProvider.credential(currentUser.email, current);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await changePassword(newPass);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(ERR[err.code] || "Failed to update password. Please try again.");
    }
    setLoading(false);
  }

  const matchOk  = confirm && newPass === confirm;
  const matchBad = confirm && newPass !== confirm;

  return (
    <div className="centered-wrapper">
      <div className="centered-card" style={{ textAlign: "left" }}>
        <div className="card-header">
          <div className="logo-mark"><span /></div>
          <h1>Update password</h1>
          <p>
            {isGoogleOnly
              ? "You'll be asked to verify your Google account first"
              : "Enter your current password, then choose a new one"}
          </p>
        </div>

        {success && <div className="success-banner"><FiCheck />&nbsp;Password updated! Redirecting to dashboard…</div>}
        {error   && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isGoogleOnly && (
            <div className="input-group">
              <span className="input-icon"><FiLock /></span>
              <input type={showCur ? "text" : "password"} placeholder=" "
                value={current} onChange={(e) => setCurrent(e.target.value)} required />
              <label>Current password</label>
              <button type="button" className="toggle-password" onClick={() => setShowCur(!showCur)}>
                {showCur ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          )}
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
            <label>Confirm new password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCon(!showCon)}>
              {showCon ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {matchBad && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords don't match</p>}
          {matchOk  && <p style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords match ✓</p>}
          <button type="submit" className="submit-btn" disabled={loading || success}>
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Update Password</>}
          </button>
        </form>

        <p className="links-row">
          <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            <FiArrowLeft />&nbsp;Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}