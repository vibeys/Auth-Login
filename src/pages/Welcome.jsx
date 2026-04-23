import { Link } from "react-router-dom";
import { FiArrowRight, FiUserPlus } from "react-icons/fi";

export default function Welcome() {
  return (
    <div className="welcome-wrapper">
      {/* ── Left: CTA ─────────────────────────── */}
      <div className="welcome-left">
        <div className="welcome-eyebrow">
          <span className="eyebrow-dot" />
          Secure · Firebase · Modern
        </div>
        <h1 className="welcome-title">
          Your gateway<br />to <span>everything</span><br />secure
        </h1>
        <p className="welcome-sub">
          A clean authentication experience powered by Firebase.
          Sign in or create a new account to get started in seconds.
        </p>
        <div className="welcome-actions">
          <Link to="/login" className="btn-primary">
            <FiArrowRight /> Sign In
          </Link>
          <Link to="/register" className="btn-secondary">
            <FiUserPlus /> Create Account
          </Link>
        </div>
      </div>

      {/* ── Right: Decorative ─────────────────── */}
      <div className="welcome-right">
        <div className="panel-blob panel-blob-1" />
        <div className="panel-blob panel-blob-2" />
        <div className="panel-blob panel-blob-3" />
        <div className="panel-dots" />
        <div className="welcome-right-inner">
          <div className="welcome-cards">
            <div className="welcome-stat-card">
              <div className="wsc-icon">🔐</div>
              <div>
                <div className="wsc-label">Security</div>
                <div className="wsc-value">Firebase Auth</div>
              </div>
            </div>
            <div className="welcome-stat-card">
              <div className="wsc-icon">✉️</div>
              <div>
                <div className="wsc-label">Verification</div>
                <div className="wsc-value">Email + OTP</div>
              </div>
            </div>
            <div className="welcome-stat-card">
              <div className="wsc-icon">🚀</div>
              <div>
                <div className="wsc-label">Sign In With</div>
                <div className="wsc-value">Google OAuth</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}