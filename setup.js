// ============================================================
// setup.js — Run with: node setup.js
// Creates ALL files for Firebase Auth project
// ============================================================
const fs = require("fs");
const path = require("path");

function write(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log("  created -> " + filePath);
}

console.log("\n Firebase Auth Setup Starting...\n");

// ─── index.html ───────────────────────────────────────────────
write("index.html", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Auth App</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

// ─── .env.example ─────────────────────────────────────────────
write(".env.example", `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id`);

// ─── vite.config.js ───────────────────────────────────────────
write("vite.config.js", `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });`);

// ─── src/main.jsx ─────────────────────────────────────────────
write("src/main.jsx", `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

// ─── src/firebase.js ──────────────────────────────────────────
write("src/firebase.js", `import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            "AIzaSyAp4iZRFJDAme68sH3byHLkONkiE28CLzY",
  authDomain:        "systems-c218f.firebaseapp.com",
  projectId:         "systems-c218f",
  storageBucket:     "systems-c218f.firebasestorage.app",
  messagingSenderId: "99478334330",
  appId:             "1:99478334330:web:feb5425f9e59c7a21ac4c3",
  measurementId:     "G-CWG3SFRPRC",
};

const app = initializeApp(firebaseConfig);
export const auth          = getAuth(app);
export const db            = getFirestore(app);
export const analytics     = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
export default app;`);

// ─── src/context/AuthContext.jsx ──────────────────────────────
write("src/context/AuthContext.jsx", `import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  const login         = (email, pass)        => signInWithEmailAndPassword(auth, email, pass);
  const register      = async (email, pass)  => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    return cred;
  };
  const loginWithGoogle = ()                 => signInWithPopup(auth, googleProvider);
  const logout        = ()                   => signOut(auth);
  const resetPassword = (email)              => sendPasswordResetEmail(auth, email);
  const updateName    = (name)               => updateProfile(auth.currentUser, { displayName: name });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, register, loginWithGoogle, logout, resetPassword, updateName }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}`);

// ─── src/components/ProtectedRoute.jsx ───────────────────────
write("src/components/ProtectedRoute.jsx", `import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}`);

// ─── src/App.jsx ──────────────────────────────────────────────
write("src/App.jsx", `import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Welcome        from "./pages/Welcome";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import VerifyEmail    from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard      from "./pages/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<Welcome />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/verify-email"   element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
          <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`);

// ─── src/index.css ────────────────────────────────────────────
write("src/index.css", `/* ── Reset ─────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Variables ──────────────────────────────── */
:root {
  --bg:           #08080f;
  --card:         rgba(255,255,255,0.04);
  --card-border:  rgba(255,255,255,0.08);
  --text:         #f0f0f0;
  --muted:        #777;
  --accent:       #F59E0B;
  --accent-dk:    #D97706;
  --error:        #ef4444;
  --success:      #22c55e;
  --input-bg:     rgba(255,255,255,0.05);
  --input-bd:     rgba(255,255,255,0.1);
  --f-head:       'Syne', sans-serif;
  --f-body:       'DM Sans', sans-serif;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--f-body);
  min-height: 100vh;
}

/* ── Background Orbs ───────────────────────── */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}
.orb-1 {
  width: 550px; height: 550px; background: #F59E0B;
  top: -220px; left: -120px;
  animation: drift 13s ease-in-out infinite alternate;
}
.orb-2 {
  width: 420px; height: 420px; background: #7c3aed;
  bottom: -150px; right: -80px;
  animation: drift 16s ease-in-out infinite alternate-reverse;
}
.orb-3 {
  width: 280px; height: 280px; background: #F59E0B;
  top: 50%; left: 50%; transform: translate(-50%,-50%);
  animation: pulse-orb 9s ease-in-out infinite;
}

@keyframes drift {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(30px,20px) scale(1.08); }
}
@keyframes pulse-orb {
  0%,100% { opacity: 0.04; transform: translate(-50%,-50%) scale(1); }
  50%     { opacity: 0.1;  transform: translate(-50%,-50%) scale(1.2); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes blink {
  0%,100% { opacity: 1; } 50% { opacity: 0.3; }
}

/* ── Auth Layout ────────────────────────────── */
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  padding: 2.5rem;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s ease;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}

/* ── Card Header ────────────────────────────── */
.card-header { text-align: center; margin-bottom: 2rem; }

.logo-mark {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--accent), var(--accent-dk));
  border-radius: 14px;
  margin: 0 auto 1.25rem;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(245,158,11,0.3);
}
.logo-mark span {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.85);
  border-radius: 6px; display: block;
}

.card-header h1 {
  font-family: var(--f-head);
  font-size: 1.6rem; font-weight: 700;
  letter-spacing: -0.02em; margin-bottom: 0.35rem;
}
.card-header p { color: var(--muted); font-size: 0.875rem; }

/* ── Inputs ─────────────────────────────────── */
.auth-form { display: flex; flex-direction: column; gap: 1.1rem; }

.input-group { position: relative; }

.input-group input {
  width: 100%;
  padding: 1rem 2.75rem;
  background: var(--input-bg);
  border: 1px solid var(--input-bd);
  border-radius: 12px;
  color: var(--text);
  font-family: var(--f-body);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.input-group input:focus {
  border-color: var(--accent);
  background: rgba(245,158,11,0.05);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.input-group label {
  position: absolute;
  left: 2.75rem; top: 50%;
  transform: translateY(-50%);
  color: var(--muted); font-size: 0.875rem;
  pointer-events: none;
  transition: all 0.18s ease;
}

.input-group input:focus ~ label,
.input-group input:not(:placeholder-shown) ~ label {
  top: -0.5rem; left: 0.75rem;
  font-size: 0.7rem; color: var(--accent);
  background: #0c0c18; padding: 0 0.3rem;
  border-radius: 3px;
}

.input-icon {
  position: absolute; left: 0.875rem; top: 50%;
  transform: translateY(-50%);
  color: var(--muted); font-size: 1rem;
  display: flex; align-items: center;
  transition: color 0.2s; pointer-events: none;
}
.input-group:focus-within .input-icon { color: var(--accent); }

.toggle-password {
  position: absolute; right: 0.875rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: var(--muted); cursor: pointer;
  display: flex; align-items: center;
  font-size: 1rem; padding: 0;
  transition: color 0.2s;
}
.toggle-password:hover { color: var(--text); }

/* ── Footer Row ─────────────────────────────── */
.form-footer-row {
  display: flex; justify-content: flex-end;
  margin-top: -0.2rem;
}
.forgot-link {
  color: var(--muted); font-size: 0.8rem;
  text-decoration: none; transition: color 0.2s;
}
.forgot-link:hover { color: var(--accent); }

/* ── Buttons ────────────────────────────────── */
.submit-btn {
  width: 100%; padding: 0.875rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-dk));
  border: none; border-radius: 12px;
  color: #000; font-family: var(--f-head);
  font-size: 0.95rem; font-weight: 700;
  cursor: pointer; margin-top: 0.35rem;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  box-shadow: 0 4px 20px rgba(245,158,11,0.25);
  transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
  letter-spacing: 0.01em;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(245,158,11,0.42);
  filter: brightness(1.06);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-ghost {
  width: 100%; padding: 0.875rem;
  background: var(--card); border: 1px solid var(--card-border);
  border-radius: 12px; color: var(--text);
  font-family: var(--f-head); font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 0.5rem;
  backdrop-filter: blur(8px); text-decoration: none;
  transition: border-color 0.2s, background 0.2s, transform 0.18s;
}
.btn-ghost:hover {
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.07);
  transform: translateY(-1px);
}

/* ── Spinner ────────────────────────────────── */
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}

/* ── Banners ────────────────────────────────── */
.error-banner {
  display: flex; align-items: center; gap: 0.6rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px; padding: 0.75rem 1rem;
  color: #fca5a5; font-size: 0.84rem; margin-bottom: 1rem;
}
.error-dot {
  width: 6px; height: 6px;
  background: var(--error); border-radius: 50%; flex-shrink: 0;
}
.success-banner {
  display: flex; align-items: center; gap: 0.6rem;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 10px; padding: 0.75rem 1rem;
  color: #86efac; font-size: 0.84rem; margin-bottom: 1rem;
}

/* ── Links Row ──────────────────────────────── */
.links-row {
  text-align: center; margin-top: 1.25rem;
  color: var(--muted); font-size: 0.875rem;
}
.links-row a {
  color: var(--accent); text-decoration: none;
  font-weight: 500; transition: opacity 0.2s;
}
.links-row a:hover { opacity: 0.8; }

.terms-note {
  text-align: center; color: var(--muted);
  font-size: 0.74rem; margin-top: 0.875rem; line-height: 1.5;
}
.terms-note a { color: var(--accent); text-decoration: none; }

/* ── Welcome Page ───────────────────────────── */
.welcome-wrapper {
  min-height: 100vh; display: flex;
  align-items: center; justify-content: center;
  padding: 2rem; position: relative; overflow: hidden;
}
.welcome-content {
  text-align: center; position: relative; z-index: 1;
  animation: slideUp 0.5s ease; max-width: 500px; width: 100%;
}
.welcome-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 100px; padding: 0.3rem 0.9rem;
  font-size: 0.72rem; color: var(--accent);
  margin-bottom: 2rem; letter-spacing: 0.06em; text-transform: uppercase;
}
.badge-dot {
  width: 6px; height: 6px;
  background: var(--accent); border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}
.welcome-title {
  font-family: var(--f-head);
  font-size: clamp(2.4rem,8vw,3.5rem);
  font-weight: 800; line-height: 1.1;
  letter-spacing: -0.03em; margin-bottom: 1.25rem;
}
.welcome-title span {
  background: linear-gradient(135deg, var(--accent), #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.welcome-sub {
  color: var(--muted); font-size: 1rem; line-height: 1.65;
  margin-bottom: 2.5rem; max-width: 380px;
  margin-left: auto; margin-right: auto;
}
.welcome-actions {
  display: flex; flex-direction: column; gap: 0.875rem;
  max-width: 300px; margin: 0 auto;
}
.btn-primary {
  width: 100%; padding: 0.9rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-dk));
  border: none; border-radius: 12px;
  color: #000; font-family: var(--f-head);
  font-size: 0.95rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(245,158,11,0.28);
  transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(245,158,11,0.44); filter: brightness(1.06);
}
.btn-secondary {
  width: 100%; padding: 0.9rem;
  background: var(--card); border: 1px solid var(--card-border);
  border-radius: 12px; color: var(--text);
  font-family: var(--f-head); font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 0.5rem; text-decoration: none;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, background 0.2s, transform 0.18s;
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  transform: translateY(-1px);
}

/* ── Verify Email Page ──────────────────────── */
.verify-icon {
  width: 64px; height: 64px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 20px; font-size: 1.75rem;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.25rem;
}
.verify-email-chip {
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.15);
  border-radius: 10px; padding: 0.55rem 1rem;
  color: var(--accent); font-size: 0.84rem;
  text-align: center; margin: 0.875rem 0;
  word-break: break-all;
}
.otp-boxes { display: flex; gap: 0.55rem; justify-content: center; margin: 1.5rem 0; }
.otp-box {
  width: 44px; height: 52px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 10px;
  font-family: var(--f-head); font-size: 1.3rem; font-weight: 700;
  color: var(--accent); display: flex; align-items: center;
  justify-content: center;
}
.otp-hint { text-align: center; color: var(--muted); font-size: 0.73rem; margin-bottom: 1.25rem; }
.resend-row { text-align: center; margin-top: 0.75rem; }
.resend-btn {
  background: none; border: none; color: var(--accent);
  font-size: 0.84rem; cursor: pointer; text-decoration: underline;
  transition: opacity 0.2s;
}
.resend-btn:hover { opacity: 0.7; }
.resend-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.logout-text-btn {
  background: none; border: none; color: var(--muted);
  cursor: pointer; font-size: 0.875rem;
  display: inline-flex; align-items: center; gap: 0.35rem;
  transition: color 0.2s;
}
.logout-text-btn:hover { color: var(--text); }

/* ── Dashboard ──────────────────────────────── */
.dashboard-wrapper {
  min-height: 100vh; padding: 2rem;
  position: relative; overflow: hidden;
}
.dash-nav {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 920px; margin: 0 auto 2.5rem;
  position: relative; z-index: 1;
}
.nav-brand {
  font-family: var(--f-head); font-size: 1.1rem; font-weight: 700;
  display: flex; align-items: center; gap: 0.5rem;
}
.nav-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
.dash-logout {
  display: flex; align-items: center; gap: 0.4rem;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.18);
  border-radius: 10px; color: #fca5a5;
  font-size: 0.84rem; font-family: var(--f-body);
  cursor: pointer; padding: 0.5rem 0.875rem;
  transition: background 0.2s, border-color 0.2s;
}
.dash-logout:hover {
  background: rgba(239,68,68,0.16);
  border-color: rgba(239,68,68,0.35);
}
.dash-body { max-width: 920px; margin: 0 auto; position: relative; z-index: 1; }

.hero-card {
  background: var(--card); border: 1px solid var(--card-border);
  border-radius: 24px; padding: 2rem;
  backdrop-filter: blur(20px); margin-bottom: 1.25rem;
  display: flex; align-items: center; gap: 1.25rem;
  position: relative; overflow: hidden;
  transition: border-color 0.2s;
}
.hero-card:hover { border-color: rgba(245,158,11,0.2); }
.hero-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}
.user-avatar {
  width: 60px; height: 60px;
  background: linear-gradient(135deg, var(--accent), var(--accent-dk));
  border-radius: 18px; font-family: var(--f-head);
  font-size: 1.4rem; font-weight: 800; color: #000;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.hero-info h2 {
  font-family: var(--f-head); font-size: 1.35rem; font-weight: 700;
  margin-bottom: 0.2rem;
}
.hero-info p { color: var(--muted); font-size: 0.875rem; }
.verified-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 100px; padding: 0.18rem 0.55rem;
  font-size: 0.68rem; color: #86efac; margin-top: 0.4rem;
}

.dash-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
}
@media (max-width: 580px) { .dash-grid { grid-template-columns: 1fr; } }

.dash-card {
  background: var(--card); border: 1px solid var(--card-border);
  border-radius: 20px; padding: 1.5rem;
  backdrop-filter: blur(20px);
  transition: border-color 0.2s, transform 0.2s;
}
.dash-card:hover {
  border-color: rgba(245,158,11,0.2);
  transform: translateY(-2px);
}
.card-icon {
  width: 40px; height: 40px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 12px; color: var(--accent);
  font-size: 1.1rem; margin-bottom: 0.875rem;
  display: flex; align-items: center; justify-content: center;
}
.dash-card h3 {
  font-family: var(--f-head); font-size: 0.9rem;
  font-weight: 600; margin-bottom: 0.3rem;
}
.dash-card p { color: var(--muted); font-size: 0.8rem; line-height: 1.55; margin-bottom: 0.875rem; }
.card-action {
  display: inline-flex; align-items: center; gap: 0.35rem;
  color: var(--accent); font-size: 0.8rem; font-weight: 500;
  text-decoration: none; background: none; border: none;
  padding: 0; cursor: pointer; transition: gap 0.2s;
}
.card-action:hover { gap: 0.55rem; }`);

// ─── src/pages/Welcome.jsx ────────────────────────────────────
write("src/pages/Welcome.jsx", `import { Link } from "react-router-dom";
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
}`);

// ─── src/pages/Login.jsx ──────────────────────────────────────
write("src/pages/Login.jsx", `import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

const ERR = {
  "auth/user-not-found":    "No account found with this email.",
  "auth/wrong-password":    "Incorrect password. Try again.",
  "auth/invalid-credential":"Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait.",
  "auth/invalid-email":     "Please enter a valid email.",
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
    <path fill="#34A853" d="M16.04 18.013C14.951 18.716 13.566 19.09 12 19.09c-3.134 0-5.786-2.013-6.728-4.822L1.237 17.335C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.793-2.986z"/>
    <path fill="#4A90E2" d="M19.834 20.999C21.988 19.033 23.483 16.285 23.483 12c0-.72-.093-1.495-.317-2.182H12v4.637h6.436c-.288 1.559-1.14 2.767-2.366 3.558l3.764 2.986z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.91 12c0-.818.135-1.617.368-2.375L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.444 3.73 1.237 5.335l4.04-3.067z"/>
  </svg>
);

export default function Login() {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();

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
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
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

        <button className="btn-ghost" onClick={handleGoogle} disabled={gLoading} style={{ marginBottom: "1.25rem" }}>
          {gLoading ? <span className="spinner" style={{ borderTopColor: "var(--text)" }} /> : <><GoogleIcon /> Continue with Google</>}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <span style={{ flex:1, height:"0.5px", background:"var(--card-border)" }} />
          <span style={{ color:"var(--muted)", fontSize:"0.75rem" }}>or sign in with email</span>
          <span style={{ flex:1, height:"0.5px", background:"var(--card-border)" }} />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiMail /></span>
            <input type="email" placeholder=" " value={email}
              onChange={(e) => setEmail(e.target.value)} required />
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
            {loading ? <span className="spinner" /> : <><FiArrowRight /> Sign In</>}
          </button>
        </form>

        <p className="links-row">
          No account yet?&nbsp;<Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}`);

// ─── src/pages/Register.jsx ───────────────────────────────────
write("src/pages/Register.jsx", `import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const ERR = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email":        "Please enter a valid email address.",
  "auth/weak-password":        "Password must be at least 6 characters.",
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
    <path fill="#34A853" d="M16.04 18.013C14.951 18.716 13.566 19.09 12 19.09c-3.134 0-5.786-2.013-6.728-4.822L1.237 17.335C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.793-2.986z"/>
    <path fill="#4A90E2" d="M19.834 20.999C21.988 19.033 23.483 16.285 23.483 12c0-.72-.093-1.495-.317-2.182H12v4.637h6.436c-.288 1.559-1.14 2.767-2.366 3.558l3.764 2.986z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.91 12c0-.818.135-1.617.368-2.375L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.444 3.73 1.237 5.335l4.04-3.067z"/>
  </svg>
);

export default function Register() {
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const { register, updateName, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
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
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-up failed. Please try again.");
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
          <h1>Create account</h1>
          <p>Join us — it only takes a minute</p>
        </div>

        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <button className="btn-ghost" onClick={handleGoogle} disabled={gLoading} style={{ marginBottom: "1.25rem" }}>
          {gLoading ? <span className="spinner" style={{ borderTopColor: "var(--text)" }} /> : <><GoogleIcon /> Continue with Google</>}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <span style={{ flex:1, height:"0.5px", background:"var(--card-border)" }} />
          <span style={{ color:"var(--muted)", fontSize:"0.75rem" }}>or register with email</span>
          <span style={{ flex:1, height:"0.5px", background:"var(--card-border)" }} />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiUser /></span>
            <input type="text" placeholder=" " value={name}
              onChange={(e) => setName(e.target.value)} required />
            <label>Full name</label>
          </div>

          <div className="input-group">
            <span className="input-icon"><FiMail /></span>
            <input type="email" placeholder=" " value={email}
              onChange={(e) => setEmail(e.target.value)} required />
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

          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showConf ? "text" : "password"} placeholder=" "
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <label>Confirm password</label>
            <button type="button" className="toggle-password"
              onClick={() => setShowConf(!showConf)}>
              {showConf ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <p className="links-row">
          Already have an account?&nbsp;<Link to="/login">Sign in</Link>
        </p>
        <p className="terms-note">
          By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}`);

// ─── src/pages/VerifyEmail.jsx ────────────────────────────────
write("src/pages/VerifyEmail.jsx", `import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { FiCheckCircle, FiRefreshCw, FiLogOut } from "react-icons/fi";

const SAMPLE = ["4", "2", "8", "9", "1", "7"];

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const navigate  = useNavigate();
  const [msg,      setMsg]      = useState("");
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { if (!currentUser) navigate("/login"); }, [currentUser, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Verification email sent! Check your inbox.");
      setError("");
      setCooldown(60);
    } catch {
      setError("Could not resend. Please wait a moment.");
    }
  }

  async function checkVerified() {
    setChecking(true); setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate("/dashboard");
      } else {
        setError("Email not verified yet. Please click the link in your inbox.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setChecking(false);
  }

  async function handleLogout() { await logout(); navigate("/login"); }

  return (
    <div className="auth-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="card-header">
          <div className="verify-icon">📬</div>
          <h1>Check your email</h1>
          <p>We sent a verification link to:</p>
          <div className="verify-email-chip">{currentUser && currentUser.email}</div>
        </div>

        {msg   && <div className="success-banner"><FiCheckCircle />&nbsp;{msg}</div>}
        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <div className="otp-boxes">
          {SAMPLE.map((d, i) => (
            <div key={i} className="otp-box">{d}</div>
          ))}
        </div>
        <p className="otp-hint">Sample shown — your link is in your inbox, not a code</p>

        <div className="auth-form">
          <button className="submit-btn" onClick={checkVerified} disabled={checking}>
            {checking ? <span className="spinner" /> : <><FiCheckCircle />&nbsp;I&apos;ve verified my email</>}
          </button>
          <button className="btn-ghost" onClick={resend} disabled={cooldown > 0}>
            <FiRefreshCw />
            {cooldown > 0 ? "Resend in " + cooldown + "s" : "Resend verification email"}
          </button>
        </div>

        <p className="links-row" style={{ marginTop: "1rem" }}>
          <button className="logout-text-btn" onClick={handleLogout}>
            <FiLogOut /> Sign out
          </button>
        </p>
      </div>
    </div>
  );
}`);

// ─── src/pages/ForgotPassword.jsx ────────────────────────────
write("src/pages/ForgotPassword.jsx", `import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiSend, FiArrowLeft } from "react-icons/fi";

const ERR = {
  "auth/user-not-found": "No account found with this email.",
  "auth/invalid-email":  "Please enter a valid email address.",
};

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(ERR[err.code] || "Failed to send reset email. Try again.");
    }
    setLoading(false);
  }

  if (sent) return (
    <div className="auth-wrapper">
      <div className="bg-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="verify-icon" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          ✉️
        </div>
        <h1 style={{ fontFamily: "var(--f-head)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Email sent!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.875rem" }}>
          Check your inbox for a password reset link. If it does not appear within a few minutes, check your spam folder.
        </p>
        <div className="verify-email-chip">{email}</div>
        <Link to="/login" className="submit-btn" style={{ marginTop: "1.5rem", textDecoration: "none" }}>
          <FiArrowLeft /> Back to Sign In
        </Link>
      </div>
    </div>
  );

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
          <h1>Reset password</h1>
          <p>Enter your email and we&apos;ll send a reset link</p>
        </div>

        {error && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiMail /></span>
            <input type="email" placeholder=" " value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <label>Email address</label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : <><FiSend />&nbsp;Send Reset Link</>}
          </button>
        </form>

        <p className="links-row">
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <FiArrowLeft /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}`);

// ─── src/pages/UpdatePassword.jsx ────────────────────────────
write("src/pages/UpdatePassword.jsx", `import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";

const ERR = {
  "auth/wrong-password":      "Current password is incorrect.",
  "auth/weak-password":       "New password is too weak.",
  "auth/requires-recent-login":"Please sign out and sign back in, then try again.",
};

export default function UpdatePassword() {
  const [current,     setCurrent]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showCur,     setShowCur]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showCon,     setShowCon]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPass !== confirm) return setError("New passwords do not match.");
    if (newPass.length < 6)  return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      const user = auth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(ERR[err.code] || "Failed to update password.");
    }
    setLoading(false);
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
          <h1>Update password</h1>
          <p>Choose a new strong password for your account</p>
        </div>

        {success && <div className="success-banner"><FiCheck />&nbsp;Password updated! Redirecting...</div>}
        {error   && <div className="error-banner"><span className="error-dot" />{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showCur ? "text" : "password"} placeholder=" "
              value={current} onChange={(e) => setCurrent(e.target.value)} required />
            <label>Current password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCur(!showCur)}>
              {showCur ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showNew ? "text" : "password"} placeholder=" "
              value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
            <label>New password</label>
            <button type="button" className="toggle-password" onClick={() => setShowNew(!showNew)}>
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <span className="input-icon"><FiLock /></span>
            <input type={showCon ? "text" : "password"} placeholder=" "
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <label>Confirm new password</label>
            <button type="button" className="toggle-password" onClick={() => setShowCon(!showCon)}>
              {showCon ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={loading || success}>
            {loading ? <span className="spinner" /> : <><FiCheck />&nbsp;Update Password</>}
          </button>
        </form>

        <p className="links-row">
          <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}`);

// ─── src/pages/Dashboard.jsx ──────────────────────────────────
write("src/pages/Dashboard.jsx", `import { useNavigate, Link } from "react-router-dom";
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
}`);

// ─── Done ──────────────────────────────────────────────────────
console.log("\n All files created successfully!\n");
console.log(" Next steps:");
console.log("  1. npm install firebase react-router-dom react-icons");
console.log("  2. Copy .env.example -> .env and fill in your Firebase keys");
console.log("  3. npm run dev\n");
