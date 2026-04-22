import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

function getStrength(p) {
  if (!p) return null;
  let s = 0;
  if (p.length >= 8)          s++;
  if (p.length >= 12)         s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return [
    { label: "Very Weak",  color: "#ef4444", pct: 10  },
    { label: "Weak",       color: "#f97316", pct: 25  },
    { label: "Fair",       color: "#eab308", pct: 50  },
    { label: "Good",       color: "#84cc16", pct: 70  },
    { label: "Strong",     color: "#22c55e", pct: 88  },
    { label: "Very Strong",color: "#10b981", pct: 100 },
  ][Math.min(s, 5)];
}

function Orbs() {
  return (
    <div className="bg-orbs">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
    </div>
  );
}

// ── Processing screen ─────────────────────────────────────────
function Processing() {
  return (
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
        <span className="spinner" style={{
          display: "block", margin: "0 auto 1.25rem",
          width: 36, height: 36, borderWidth: 3,
          borderColor: "rgba(245,158,11,0.15)",
          borderTopColor: "var(--accent)",
        }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Processing your request…</p>
      </div>
    </div>
  );
}

// ── Email verified success ─────────────────────────────────────
function EmailVerifiedScreen() {
  return (
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 1.25rem",
        }}>✅</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Email verified!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>
          Your account is now active.<br />Redirecting you in a moment…
        </p>
        <div style={{
          width: "100%", height: 3, background: "rgba(255,255,255,0.06)",
          borderRadius: 2, marginTop: "1.75rem", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", background: "var(--accent)", borderRadius: 2,
            animation: "progressBar 2.5s linear forwards",
          }} />
        </div>
        <style>{`
          @keyframes progressBar {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.75rem", margin: "0 auto 1.25rem",
        }}>⚠️</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Link expired
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "1.75rem" }}>
          {message}
        </p>
        <Link to="/login" className="submit-btn" style={{ textDecoration: "none" }}>
          <FiArrowLeft />&nbsp;Back to Sign In
        </Link>
      </div>
    </div>
  );
}

// ── Reset password form ───────────────────────────────────────
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
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 1.25rem",
        }}>🎉</div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Password updated!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Redirecting you to sign in…
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card">
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
              <div className="strength-bar">
                <div className="strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}

          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showCon ? "text" : "password"} placeholder=" "
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              style={matchBad ? { borderColor:"var(--error)" } : matchOk ? { borderColor:"var(--success)" } : {}}
            />
            <label>Confirm password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCon(!showCon)}>
              {showCon ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {matchBad && <p style={{ color:"var(--error)", fontSize:"0.75rem", marginTop:"-0.5rem" }}>Passwords don't match</p>}
          {matchOk  && <p style={{ color:"var(--success)", fontSize:"0.75rem", marginTop:"-0.5rem" }}>Passwords match ✓</p>}

          <button type="submit" className="submit-btn" disabled={loading || !newPass || !confirm}>
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Set New Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
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
    if (!oobCode || !mode) {
      navigate("/login", { replace: true });
      return;
    }

    async function handle() {
      if (mode === "verifyEmail") {
        try {
          await applyActionCode(auth, oobCode);
          await auth.currentUser?.reload();
          setPhase("verified");
          setTimeout(() => {
            navigate(auth.currentUser ? "/dashboard" : "/login", { replace: true });
          }, 2500);
        } catch {
          if (auth.currentUser?.emailVerified) {
            // Already verified — just go to dashboard silently
            navigate("/dashboard", { replace: true });
          } else {
            setErrorMsg("This verification link has expired or already been used. Please request a new one from the sign-in page.");
            setPhase("error");
          }
        }

      } else if (mode === "resetPassword") {
        try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          setResetEmail(email);
          setPhase("resetPassword");
        } catch {
          setErrorMsg("This reset link has expired or already been used. Please go back and request a new code.");
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

  if (phase === "processing")   return <Processing />;
  if (phase === "error")        return <ErrorScreen message={errorMsg} />;
  if (phase === "verified")     return <EmailVerifiedScreen />;
  if (phase === "resetPassword") return <ResetForm oobCode={oobCode} email={resetEmail} />;
  if (phase === "recovered")    return (
    <div className="auth-wrapper">
      <Orbs />
      <div className="auth-card" style={{ textAlign:"center" }}>
        <div style={{ fontSize:"2rem", marginBottom:"1rem" }}>📧</div>
        <h1 style={{ fontFamily:"var(--f-head)", fontSize:"1.5rem", fontWeight:700, marginBottom:"0.5rem" }}>
          Email recovered!
        </h1>
        <p style={{ color:"var(--muted)", fontSize:"0.875rem" }}>
          Your email address has been restored. Redirecting…
        </p>
      </div>
    </div>
  );

  return null;
}