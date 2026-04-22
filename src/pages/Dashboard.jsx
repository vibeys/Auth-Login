import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLogOut, FiShield, FiUser, FiMail, FiLock, FiArrowRight, FiSettings } from "react-icons/fi";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const name     = currentUser && currentUser.displayName;
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser && currentUser.email
    ? currentUser.email[0].toUpperCase()
    : "U";
  const firstName = name ? name.split(" ")[0] : "User";

  async function handleLogout() { await logout(); navigate("/login"); }

  return (
    <div className="dashboard-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <nav className="dash-nav">
        <div className="nav-brand">
          <span className="nav-dot" /> AuthApp
        </div>
        <button className="dash-logout" onClick={handleLogout}>
          <FiLogOut /> Sign Out
        </button>
      </nav>

      <div className="dash-body">
        <div className="hero-card">
          <div className="user-avatar">{initials}</div>
          <div className="hero-info">
            <h2>Hello, {firstName} 👋</h2>
            <p>{currentUser && currentUser.email}</p>
            {currentUser && currentUser.emailVerified && (
              <span className="verified-chip">✓ Verified</span>
            )}
          </div>
        </div>

        <div className="dash-grid">
          <div className="dash-card">
            <div className="card-icon"><FiUser /></div>
            <h3>Your Profile</h3>
            <p>View and manage your personal account information.</p>
            <span className="card-action">View profile <FiArrowRight /></span>
          </div>

          <div className="dash-card">
            <div className="card-icon"><FiLock /></div>
            <h3>Update Password</h3>
            <p>Keep your account secure by updating your password regularly.</p>
            <Link to="/update-password" className="card-action">
              Change password <FiArrowRight />
            </Link>
          </div>

          <div className="dash-card">
            <div className="card-icon"><FiMail /></div>
            <h3>Email Address</h3>
            <p>{currentUser && currentUser.email}</p>
            <span className="card-action">
              {currentUser && currentUser.emailVerified ? "Verified ✓" : "Not verified"}
            </span>
          </div>

          <div className="dash-card">
            <div className="card-icon"><FiShield /></div>
            <h3>Security</h3>
            <p>Your account is protected with Firebase Authentication.</p>
            <span className="card-action">All good <FiArrowRight /></span>
          </div>
        </div>
      </div>
    </div>
  );
}