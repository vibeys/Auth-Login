import { useState, useEffect } from "react";
import { Link, useNavigate }   from "react-router-dom";
import { getRedirectResult }   from "firebase/auth";
import { useAuth }             from "../context/AuthContext";
import { auth }                from "../firebase";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiArrowRight } from "react-icons/fi";

const ERR = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email":        "Please enter a valid email address.",
  "auth/weak-password":        "Password must be at least 6 characters.",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
    <path fill="#34A853" d="M16.04 18.013C14.951 18.716 13.566 19.09 12 19.09c-3.134 0-5.786-2.013-6.728-4.822L1.237 17.335C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.793-2.986z"/>
    <path fill="#4A90E2" d="M19.834 20.999C21.988 19.033 23.483 16.285 23.483 12c0-.72-.093-1.495-.317-2.182H12v4.637h6.436c-.288 1.559-1.14 2.767-2.366 3.558l3.764 2.986z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.91 12c0-.818.135-1.617.368-2.375L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.444 3.73 1.237 5.335l4.04-3.067z"/>
  </svg>
);

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

function GoogleSetupStep({ googleUser, onDone, onCancel }) {
  const { updateName, linkEmailPassword } = useAuth();
  const [name,    setName]    = useState(googleUser.displayName || "");
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP,   setShowP]   = useState(false);
  const [showC,   setShowC]   = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const strength = getStrength(pass);
  const matchOk  = confirm && pass === confirm;
  const matchBad = confirm && pass !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim())     return setError("Please enter your display name.");
    if (pass !== confirm) return setError("Passwords do not match.");
    if (pass.length < 6)  return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      await updateName(name.trim());
      await linkEmailPassword(pass);
      onDone();
    } catch (err) {
      if (err.code === "auth/credential-already-in-use") {
        setError("This account already has a password. Please sign in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger one.");
      } else {
        setError("Setup failed. Please try again.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-panel-left">
        <div className="panel-blob panel-blob-1" />
        <div className="panel-blob panel-blob-2" />
        <div className="panel-blob panel-blob-3" />
        <div className="panel-dots" />
        <div className="panel-inner">
          <div className="panel-brand"><span className="panel-brand-dot" /> AuthApp</div>
          <div className="panel-illus">
            <div className="panel-illus-ring panel-illus-ring-1" />
            <div className="panel-illus-ring panel-illus-ring-2" />
            <div className="panel-illus-core">🚀</div>
          </div>
          <div className="panel-tagline">Almost <span>done!</span></div>
          <p className="panel-caption">Set your name and password to finish creating your account.</p>
        </div>
      </div>
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="card-header">
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg,var(--accent),var(--accent-dk))",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1.25rem", fontSize: "1.1rem", fontWeight: 800,
              color: "#fff", fontFamily: "var(--f-head)",
            }}>
              {googleUser.email?.[0]?.toUpperCase() || "G"}
            </div>
            <h1>Almost there!</h1>
            <p>Connected as <strong style={{ color: "var(--accent)" }}>{googleUser.email}</strong>.<br />Set your name and a password.</p>
          </div>
          {error && <div className="error-banner"><span className="error-dot" />{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <span className="input-icon"><FiUser /></span>
              <input type="text" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} required />
              <label>Display name</label>
            </div>
            <div className="input-group">
              <span className="input-icon"><FiLock /></span>
              <input type={showP ? "text" : "password"} placeholder=" " value={pass} onChange={(e) => setPass(e.target.value)} required />
              <label>Create password</label>
              <button type="button" className="toggle-password" onClick={() => setShowP(!showP)}>
                {showP ? <FiEyeOff /> : <FiEye />}
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
              <input type={showC ? "text" : "password"} placeholder=" " value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                style={matchBad ? { borderColor: "var(--error)" } : matchOk ? { borderColor: "var(--success)" } : {}} />
              <label>Confirm password</label>
              <button type="button" className="toggle-password" onClick={() => setShowC(!showC)}>
                {showC ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {matchBad && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords don't match</p>}
            {matchOk  && <p style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords match ✓</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Complete Registration</>}
            </button>
          </form>
          <p className="links-row">
            <button type="button" className="logout-text-btn" onClick={onCancel}>
              Cancel — use a different account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showP,      setShowP]      = useState(false);
  const [showC,      setShowC]      = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [gLoading,   setGLoading]   = useState(true);
  const [googleUser, setGoogleUser] = useState(null);

  const { register, updateName, loginWithGoogle, logout, hasPasswordLinked } = useAuth();
  const navigate = useNavigate();
  const strength = getStrength(password);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        if (hasPasswordLinked(result.user)) {
          navigate("/dashboard");
        } else {
          setGoogleUser(result.user);
        }
      })
      .catch(() => {})
      .finally(() => setGLoading(false));
  }, [navigate]); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      await register(email, password);
      if (name.trim()) await updateName(name.trim());
      navigate("/verify-email");
    } catch (err) {
      setError(ERR[err.code] || "Failed to create account.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(""); setGLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result?.user) return;
      if (hasPasswordLinked(result.user)) {
        await logout();
        setError("This Google account is already registered. Please sign in instead.");
        setGLoading(false);
        return;
      }
      setGoogleUser(result.user);
    } catch (err) {
      setError(ERR[err.code] || "Google sign-up failed. Try again.");
    }
    setGLoading(false);
  }

  if (googleUser) return (
    <GoogleSetupStep
      googleUser={googleUser}
      onDone={() => navigate("/verify-email")}
      onCancel={async () => { await logout(); setGoogleUser(null); }}
    />
  );

  const matchOk  = confirm && password === confirm;
  const matchBad = confirm && password !== confirm;

  return (
    <div className="auth-wrapper">
      <div className="auth-panel-left">
        <div className="panel-blob panel-blob-1" />
        <div className="panel-blob panel-blob-2" />
        <div className="panel-blob panel-blob-3" />
        <div className="panel-blob panel-blob-4" />
        <div className="panel-blob panel-blob-5" />
        <div className="panel-dots" />
        <div className="panel-inner">
          <div className="panel-brand"><span className="panel-brand-dot" /> AuthApp</div>
          <div className="panel-illus">
            <div className="panel-illus-ring panel-illus-ring-1" />
            <div className="panel-illus-ring panel-illus-ring-2" />
            <div className="panel-illus-core">✨</div>
            <div className="panel-illus-badge panel-illus-badge-1">Free forever</div>
            <div className="panel-illus-badge panel-illus-badge-2">1 min setup</div>
          </div>
          <div className="panel-tagline">Join <span>AuthApp</span> today</div>
          <p className="panel-caption">Create your account with email or Google in under a minute.</p>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="card-header">
            <div className="logo-mark"><span /></div>
            <h1>Create account</h1>
            <p>Join us — it only takes a minute</p>
          </div>

          {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

          <button className="btn-ghost" onClick={handleGoogle} disabled={gLoading}
            style={{ marginBottom: "1.25rem" }}>
            {gLoading
              ? <span className="spinner spinner-dark" />
              : <><GoogleIcon />&nbsp;Continue with Google</>}
          </button>

          <div className="auth-divider">
            <span /><small>or register with email</small><span />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <span className="input-icon"><FiUser /></span>
              <input type="text" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} required />
              <label>Full name</label>
            </div>
            <div className="input-group">
              <span className="input-icon"><FiMail /></span>
              <input type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label>Email address</label>
            </div>
            <div className="input-group">
              <span className="input-icon"><FiLock /></span>
              <input type={showP ? "text" : "password"} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} required />
              <label>Password</label>
              <button type="button" className="toggle-password" onClick={() => setShowP(!showP)}>
                {showP ? <FiEyeOff /> : <FiEye />}
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
              <input type={showC ? "text" : "password"} placeholder=" " value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                style={matchBad ? { borderColor: "var(--error)" } : matchOk ? { borderColor: "var(--success)" } : {}} />
              <label>Confirm password</label>
              <button type="button" className="toggle-password" onClick={() => setShowC(!showC)}>
                {showC ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {matchBad && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords don't match</p>}
            {matchOk  && <p style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "-0.2rem" }}>Passwords match ✓</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : <><FiArrowRight />&nbsp;Create Account</>}
            </button>
          </form>

          <p className="links-row">Already have an account?&nbsp;<Link to="/login">Sign in</Link></p>
          <p className="terms-note">
            By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}