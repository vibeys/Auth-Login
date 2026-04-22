import { Link } from "react-router-dom";
import { FiArrowRight, FiUserPlus } from "react-icons/fi";

export default function Welcome() {
  return (
    <div className="welcome-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="welcome-content">
        <div className="welcome-badge">
          <span className="badge-dot" />
          Secure · Firebase · Modern
        </div>

        <h1 className="welcome-title">
          Your gateway<br />to <span>everything</span><br />secure
        </h1>

        <p className="welcome-sub">
          A clean, modern auth experience powered by Firebase.
          Sign in to your account or create a new one to get started.
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
    </div>
  );
}