import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage       from "./pages/LandingPage";
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import VerifyPage        from "./pages/VerifyPage";
import AdminDashboard    from "./pages/admin/AdminDashboard";
import UniversityDashboard from "./pages/university/UniversityDashboard";
import IssueCertificate  from "./pages/university/IssueCertificate";
import CertificatesList  from "./pages/university/CertificatesList";
import VerifierDashboard from "./pages/verifier/VerifierDashboard";

// ─── Route Guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#060b14" }}>
      <div className="w-10 h-10 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "#00e6b4" }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && !(role === "university" && user.role === "admin")) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/verify"  element={<VerifyPage />} />
      <Route path="/verify/:certId" element={<VerifyPage />} />
      <Route path="/login"   element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <RegisterPage />} />

      {/* Admin */}
      <Route path="/admin/*" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* University */}
      <Route path="/university" element={
        <ProtectedRoute role="university">
          <UniversityDashboard />
        </ProtectedRoute>
      } />
      <Route path="/university/issue" element={
        <ProtectedRoute role="university">
          <IssueCertificate />
        </ProtectedRoute>
      } />
      <Route path="/university/certificates" element={
        <ProtectedRoute role="university">
          <CertificatesList />
        </ProtectedRoute>
      } />

      {/* Verifier */}
      <Route path="/verifier" element={
        <ProtectedRoute role="verifier">
          <VerifierDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: "#0c1220", color: "#e8f0fe", border: "1px solid rgba(0,230,180,0.15)", fontFamily: "'DM Mono', monospace", fontSize: "13px" },
        success: { iconTheme: { primary: "#00e6b4", secondary: "#060b14" } },
        error:   { iconTheme: { primary: "#ff4d6d", secondary: "#060b14" } },
      }} />
      <AppRoutes />
    </AuthProvider>
  );
}
