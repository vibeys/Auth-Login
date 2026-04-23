import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { confirmPasswordReset, sendPasswordResetEmail, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

const FLOW_KEY = "passwordResetFlow";

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

function readFlow() {
  try { return JSON.parse(sessionStorage.getItem(FLOW_KEY) || "null"); } catch { return null; }
}

export default function ResetPassword() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const mode      = params.get("mode");
  const oobCode   = params.get("oobCode");

  const savedFlow  = readFlow();
  const stateEmail = location.state?.email || savedFlow?.email || "";
  const fromOtp    = location.state?.fromOtp || savedFlow?.step === "otp-verified";

  const [phase,   setPhase]   = useState("init");
  const [email,   setEmail]   = useState(stateEmail);
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const sentOnceRef = useRef(false);
  const strength = getStrength(newPass);

  useEffect(() => {
    async function handle() {
      // Case 1: came from Firebase email link with oobCode
      if (oobCode && (mode === "resetPassword" || !mode)) {
        try {
          const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
          setEmail(emailFromCode);
          setPhase("form");
        } catch {
          setError("This reset link is invalid or has expired. Please start over.");
          setPhase("error");
        }
        return;
      }
      // Case 2: came from OTP verification
      if (fromOtp && stateEmail) { setPhase("waiting"); return; }
      navigate("/forgot-password", { replace: true });
    }
    handle();
  }, []); // eslint-disable-line

  // Send Firebase password reset email once "waiting"
  useEffect(() => {
    if (phase !== "waiting" || !email || sentOnceRef.current) return;
    sentOnceRef.current = true;
    async function send() {
      setSending(true); setError("");
      try {
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: true,
        });
        sessionStorage.setItem(FLOW_KEY, JSON.stringify({ email, step: "reset-link-sent", sentAt: Date.now() }));
        setSent(true);
      } catch (err) {
        console.error("Reset email failed:", err);
        setError("Could not send the reset link. Please try again.");
        sentOnceRef.current = false;
      } finally { setSending(false); }
    }
    send();
  }, [phase, email]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPass !== confirm)            return setError("Passwords do not match.");
    if (newPass.length < 8)             return setError("Password must be at least 8 characters.");
    if (!strength || strength.pct < 25) return setError("Please choose a stronger password.");
    if (!oobCode)                       return setError("Reset code missing. Please open the email link again.");
    setError(""); setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPass);
      sessionStorage.removeItem(FLOW_KEY);
      setPhase("done");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(
        err.code === "auth/expired-action-code" ? "Reset link expired. Please request a new one." :
        err.code === "auth/invalid-action-code" ? "Reset link already used. Please start over." :
        err.code === "auth/weak-password"       ? "Password too weak." :
        "Failed to reset password. Please try again."
      );
    } finally { setLoading(false); }
  }

  if (phase === "init") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 2.5, display: "block", margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Verifying reset link…</p>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-err">⚠️</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem", color: "var(--text)" }}>
          Link invalid
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.75rem" }}>{error}</p>
        <Link to="/forgot-password" className="submit-btn" style={{ textDecoration: "none" }}>
          <FiArrowLeft />&nbsp;Start Over
        </Link>
      </div>
    </div>
  );

  if (phase === "waiting") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-ok">✅</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Identity verified!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          Your OTP was correct. We're sending a password reset email now — open it to set your new password.
        </p>
        <span className="email-chip">{email}</span>

        {error && <div className="error-banner" style={{ marginTop: "1rem" }}><span className="error-dot" />{error}</div>}
        {sending && (
          <div className="info-banner" style={{ marginTop: "0.75rem" }}>
            <span className="spinner spinner-dark" style={{ width: 14, height: 14, borderWidth: 2 }} />&nbsp;Sending reset email…
          </div>
        )}
        {sent && !sending && !error && (
          <div className="success-banner" style={{ marginTop: "0.75rem" }}>
            📬 Reset link sent! Check your inbox and click the link.
          </div>
        )}
        <p style={{ color: "var(--muted)", fontSize: "0.74rem", marginTop: "1rem", lineHeight: 1.6 }}>
          Make sure your Firebase "Password reset" action URL is set to:<br />
          <code style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 500 }}>{window.location.origin}/reset-password</code>
        </p>
        <p className="links-row" style={{ marginTop: "1.25rem" }}>
          <Link to="/forgot-password" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            <FiArrowLeft />&nbsp;Start over
          </Link>
        </p>
      </div>
    </div>
  );

  if (phase === "done") return (
    <div className="centered-wrapper">
      <div className="centered-card">
        <div className="status-icon si-ok">🎉</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.4rem", color: "var(--text)" }}>
          Password reset!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Your password has been updated. Redirecting to sign in…
        </p>
        <div className="progress-wrap"><div className="progress-fill" /></div>
      </div>
    </div>
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  const matchOk  = confirm && newPass === confirm;
  const matchBad = confirm && newPass !== confirm;

  return (
    <div className="centered-wrapper">
      <div className="centered-card" style={{ textAlign: "left" }}>
        <div className="card-header">
          <div className="logo-mark"><span /></div>
          <h1>Create new password</h1>
          <p>{email ? <>For <strong style={{ color: "var(--accent)" }}>{email}</strong></> : "Choose a new strong password"}</p>
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
          <button type="submit" className="submit-btn" disabled={loading || !newPass || !confirm || !oobCode}>
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Set New Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}