import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  confirmPasswordReset,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from "firebase/auth";
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
    { label: "Very Weak", color: "#ef4444", pct: 10 },
    { label: "Weak", color: "#f97316", pct: 25 },
    { label: "Fair", color: "#eab308", pct: 50 },
    { label: "Good", color: "#84cc16", pct: 70 },
    { label: "Strong", color: "#22c55e", pct: 88 },
    { label: "Very Strong", color: "#10b981", pct: 100 },
  ][Math.min(s, 5)];
}

function readFlow() {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeFlow(data) {
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(data));
}

function clearFlow() {
  sessionStorage.removeItem(FLOW_KEY);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const continueUrl = params.get("continueUrl");

  const savedFlow = readFlow();
  const stateEmail = location.state?.email || savedFlow?.email || "";
  const fromOtp = location.state?.fromOtp || savedFlow?.step === "otp-verified";

  const [phase, setPhase] = useState("init"); // init | waiting | form | done | error
  const [email, setEmail] = useState(stateEmail);
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sentOnceRef = useRef(false);
  const strength = getStrength(newPass);

  useEffect(() => {
    const handleActionLink = async () => {
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

      if (fromOtp && stateEmail) {
        setPhase("waiting");
        return;
      }

      navigate("/forgot-password", { replace: true });
    };

    handleActionLink();
  }, [mode, oobCode, fromOtp, stateEmail, navigate]);

  useEffect(() => {
    if (phase !== "waiting" || !email || sentOnceRef.current) return;

    const sendResetLink = async () => {
      sentOnceRef.current = true;
      setSending(true);
      setError("");

      try {
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: true,
        });

        writeFlow({ email, step: "reset-link-sent", sentAt: Date.now() });
        setSent(true);
      } catch (err) {
        console.error("Reset email failed:", err);
        setError("I could not send the reset link. Please try again.");
        sentOnceRef.current = false;
      } finally {
        setSending(false);
      }
    };

    sendResetLink();
  }, [phase, email, sent]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (newPass !== confirm) return setError("Passwords do not match.");
    if (newPass.length < 8) return setError("Password must be at least 8 characters.");
    if (!strength || strength.pct < 25) return setError("Please choose a stronger password.");
    if (!oobCode) return setError("Reset code is missing. Please open the email link again.");

    setError("");
    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPass);
      clearFlow();
      setPhase("done");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      if (err.code === "auth/expired-action-code") {
        setError("Reset link expired. Please request a new one.");
      } else if (err.code === "auth/invalid-action-code") {
        setError("Invalid reset link. Please start over.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger one.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (phase === "waiting") {
    return (
      <div className="auth-wrapper">
        <div className="bg-orbs">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
        </div>

        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="verify-icon">✅</div>
          <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.45rem", fontWeight: 700, margin: "0.75rem 0 0.4rem" }}>
            Identity verified!
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "0.75rem" }}>
            Your OTP was correct. We are sending the Firebase reset link now.
            When you open that email, it will return here to set your new password.
          </p>

          <div className="verify-email-chip">{email}</div>

          {error && (
            <div className="error-banner" style={{ marginTop: "1rem" }}>
              <span className="error-dot" />
              {error}
            </div>
          )}

          {sending && (
            <div className="success-banner" style={{ marginTop: "1rem" }}>
              <span className="spinner" style={{ borderTopColor: "var(--text)" }} />
              &nbsp;Sending reset email…
            </div>
          )}

          {sent && !sending && !error && (
            <div className="success-banner" style={{ marginTop: "1rem" }}>
              📬 Reset link sent! Open it to continue here.
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "1rem", lineHeight: 1.6 }}>
            Your Firebase email template must point to your custom action URL, not the default Firebase handler.
          </p>

          <p className="links-row" style={{ marginTop: "1rem" }}>
            <Link to="/forgot-password" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <FiArrowLeft /> Start over
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="auth-wrapper">
        <div className="bg-orbs">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>

        <div className="auth-card" style={{ textAlign: "center" }}>
          <div
            className="verify-icon"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            ⚠️
          </div>
          <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.3rem", fontWeight: 700, margin: "0.75rem 0 0.5rem" }}>
            Link invalid
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <Link to="/forgot-password" className="submit-btn" style={{ textDecoration: "none" }}>
            <FiArrowLeft />
            &nbsp;Start Over
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="auth-wrapper">
        <div className="bg-orbs">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
        </div>

        <div className="auth-card" style={{ textAlign: "center" }}>
          <div
            className="verify-icon"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            🎉
          </div>
          <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.5rem", fontWeight: 700, margin: "0.75rem 0 0.4rem" }}>
            Password reset!
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Your password has been updated. Redirecting to sign in…
          </p>
        </div>
      </div>
    );
  }

  if (phase === "init") {
    return (
      <div className="auth-wrapper">
        <div className="bg-orbs">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>

        <div className="auth-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <span
            className="spinner"
            style={{
              display: "block",
              margin: "0 auto 1rem",
              width: 32,
              height: 32,
              borderWidth: 3,
              borderColor: "rgba(245,158,11,0.2)",
              borderTopColor: "var(--accent)",
            }}
          />
          <p style={{ color: "var(--muted)" }}>Verifying reset link…</p>
        </div>
      </div>
    );
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
          <h1>Create new password</h1>
          <p>
            {email
              ? (
                <>
                  Choose a new strong password for{" "}
                  <strong style={{ color: "var(--accent)" }}>{email}</strong>
                </>
              )
              : "Choose a new strong password"}
          </p>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-dot" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon">
              <FiLock />
            </span>
            <input
              type={showNew ? "text" : "password"}
              placeholder=" "
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
            <label>New password</label>
            <button type="button" className="toggle-password" onClick={() => setShowNew(!showNew)}>
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {strength && (
            <div className="strength-wrap">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{ width: `${strength.pct}%`, background: strength.color }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}

          <div className="input-group">
            <span className="input-icon">
              <FiLock />
            </span>
            <input
              type={showCon ? "text" : "password"}
              placeholder=" "
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={
                confirm
                  ? newPass === confirm
                    ? { borderColor: "var(--success)" }
                    : { borderColor: "var(--error)" }
                  : {}
              }
            />
            <label>Confirm password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCon(!showCon)}>
              {showCon ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {confirm && newPass !== confirm && (
            <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.5rem" }}>
              Passwords do not match
            </p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !newPass || !confirm || !oobCode}
          >
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Set New Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}