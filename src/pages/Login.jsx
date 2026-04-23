import { useState, useEffect } from "react";
import { Link, useNavigate }   from "react-router-dom";
import { getRedirectResult }   from "firebase/auth";
import { useAuth }             from "../context/AuthContext";
import { auth }                from "../firebase";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

const ERR = {
  "auth/user-not-found":     "No account found with this email.",
  "auth/wrong-password":     "Incorrect password. Try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests":  "Too many attempts. Please wait a moment.",
  "auth/invalid-email":      "Please enter a valid email.",
  "auth/user-disabled":      "This account has been disabled.",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
    <path fill="#34A853" d="M16.04 18.013C14.951 18.716 13.566 19.09 12 19.09c-3.134 0-5.786-2.013-6.728-4.822L1.237 17.335C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.793-2.986z"/>
    <path fill="#4A90E2" d="M19.834 20.999C21.988 19.033 23.483 16.285 23.483 12c0-.72-.093-1.495-.317-2.182H12v4.637h6.436c-.288 1.559-1.14 2.767-2.366 3.558l3.764 2.986z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.91 12c0-.818.135-1.617.368-2.375L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.444 3.73 1.237 5.335l4.04-3.067z"/>
  </svg>
);

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(true);

  const { login, loginWithGoogle, logout, hasPasswordLinked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        if (!hasPasswordLinked(result.user)) {
          await logout();
          setError("No registered account for this Google address. Please sign up first.");
          return;
        }
        navigate("/dashboard");
      })
      .catch((err) => {
        if (err?.code) setError(ERR[err.code] || "Google sign-in failed.");
      })
      .finally(() => setGLoading(false));
  }, [navigate]); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(ERR[err.code] || "Sign in failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(""); setGLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result?.user) return;
      if (!hasPasswordLinked(result.user)) {
        await logout();
        setError("No registered account for this Google address. Please sign up first.");
        setGLoading(false);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(ERR[err.code] || "Google sign-in failed. Try again.");
    }
    setGLoading(false);
  }

  return (
    <div className="auth-wrapper">
      {/* ── Left illustration panel ───────────── */}
      <div className="auth-panel-left">
        <div className="panel-blob panel-blob-1" />
        <div className="panel-blob panel-blob-2" />
        <div className="panel-blob panel-blob-3" />
        <div className="panel-blob panel-blob-4" />
        <div className="panel-blob panel-blob-5" />
        <div className="panel-dots" />
        <div className="panel-inner">
          <div className="panel-brand">
            <span className="panel-brand-dot" /> AuthApp
          </div>
          <div className="panel-illus">
            <div className="panel-illus-ring panel-illus-ring-1" />
            <div className="panel-illus-ring panel-illus-ring-2" />
            <div className="panel-illus-core">🔐</div>
            <div className="panel-illus-badge panel-illus-badge-1">✓ Secure</div>
            <div className="panel-illus-badge panel-illus-badge-2">Firebase</div>
          </div>
          <div className="panel-tagline">
            Welcome back to <span>AuthApp</span>
          </div>
          <p className="panel-caption">
            Sign in securely with your email or continue with Google.
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────── */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="card-header">
            <div className="logo-mark"><span /></div>
            <h1>Sign in</h1>
            <p>Welcome back — enter your details to continue</p>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-dot" />{error}
            </div>
          )}

          <button className="btn-ghost" onClick={handleGoogle} disabled={gLoading}
            style={{ marginBottom: "1.25rem" }}>
            {gLoading
              ? <span className="spinner spinner-dark" />
              : <><GoogleIcon />&nbsp;Continue with Google</>}
          </button>

          <div className="auth-divider">
            <span /><small>or sign in with email</small><span />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <span className="input-icon"><FiMail /></span>
              <input type="email" placeholder=" "
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label>Email address</label>
            </div>

            <div className="input-group">
              <span className="input-icon"><FiLock /></span>
              <input type={showPass ? "text" : "password"} placeholder=" "
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <label>Password</label>
              <button type="button" className="toggle-password"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="form-footer-row">
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : <><FiArrowRight />&nbsp;Sign In</>}
            </button>
          </form>

          <p className="links-row">
            No account?&nbsp;<Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}