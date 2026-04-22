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

  const { login, loginWithGoogle, emailExists } = useAuth();
  const navigate = useNavigate();

  // Catch redirect result on page reload (Google redirect fallback)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) navigate("/dashboard");
      })
      .catch((err) => {
        if (err?.code) setError(ERR[err.code] || "Google sign-in failed. Try again.");
      })
      .finally(() => setGLoading(false));
  }, [navigate]);

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
      if (!result?.user) return; // redirect flow — page will reload

      const user = result.user;

      // ── Check if this Google account exists in Firebase ──────
      const exists = await emailExists(user.email);
      if (!exists) {
        // Account was just created by the Google sign-in — delete it and block
        await user.delete();
        setError("No account found for this Google account. Please register first.");
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
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="card-header">
          <div className="logo-mark"><span /></div>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <button
          className="btn-ghost"
          onClick={handleGoogle}
          disabled={gLoading}
          style={{ marginBottom: "1.25rem" }}
        >
          {gLoading
            ? <span className="spinner" style={{ borderTopColor: "var(--text)" }} />
            : <><GoogleIcon />&nbsp;Continue with Google</>
          }
        </button>

        <div className="auth-divider">
          <span /><small>or sign in with email</small><span />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiMail /></span>
            <input
              type="email" placeholder=" "
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
            <label>Email address</label>
          </div>

          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input
              type={showPass ? "text" : "password"} placeholder=" "
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
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
            {loading ? <span className="spinner" /> : <><FiArrowRight /> Sign In</>}
          </button>
        </form>

        <p className="links-row">
          No account yet?&nbsp;<Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}