import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }   from "./context/AuthContext";
import ProtectedRoute     from "./components/ProtectedRoute";
import Welcome            from "./pages/Welcome";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import VerifyEmail        from "./pages/VerifyEmail";
import ForgotPassword     from "./pages/ForgotPassword";
import VerifyOTP          from "./pages/VerifyOTP";
import ResetPassword      from "./pages/ResetPassword";
import AuthAction         from "./pages/AuthAction";
import UpdatePassword     from "./pages/UpdatePassword";
import Dashboard          from "./pages/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<Welcome />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp"      element={<VerifyOTP />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          {/* Single handler for ALL Firebase email action links */}
          <Route path="/auth/action"     element={<AuthAction />} />
          <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
          <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}