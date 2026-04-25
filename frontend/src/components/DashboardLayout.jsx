import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV = {
  admin: [
    { to: "/admin",              icon: "⬡", label: "Dashboard" },
    { to: "/admin/universities", icon: "🏛", label: "Universities" },
    { to: "/admin/users",        icon: "👤", label: "Users" },
    { to: "/admin/certificates", icon: "📜", label: "Certificates" },
  ],
  university: [
    { to: "/university",              icon: "⬡", label: "Dashboard" },
    { to: "/university/issue",        icon: "✦", label: "Issue Certificate" },
    { to: "/university/certificates", icon: "📜", label: "My Certificates" },
  ],
  verifier: [
    { to: "/verifier", icon: "⬡", label: "Dashboard" },
    { to: "/verify",   icon: "🔍", label: "Verify Certificate" },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = () => { logout(); toast.success("Logged out"); navigate("/"); };

  return (
    <div className="min-h-screen flex" style={{ background: "#060b14" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{
        background: "#0c1220",
        borderRight: "1px solid rgba(0,230,180,0.08)",
        position: "sticky", top: 0, height: "100vh"
      }}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "rgba(0,230,180,0.08)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00e6b4,#0078ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔐</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>
            Secured<span style={{ color: "#00e6b4" }}>Trust</span>
          </span>
        </Link>

        {/* User pill */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(0,230,180,0.08)" }}>
          <div style={{ background: "rgba(0,230,180,0.06)", border: "1px solid rgba(0,230,180,0.1)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "rgba(0,230,180,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{user?.role}</div>
            <div style={{ fontSize: 13, color: "#e8f0fe", fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "rgba(232,240,254,0.35)" }}>{user?.email}</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map(({ to, icon, label }) => {
            const active = location.pathname === to || (to !== "/admin" && to !== "/university" && to !== "/verifier" && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`nav-link${active ? " active" : ""}`}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(0,230,180,0.08)" }}>
          <button onClick={handleLogout} className="btn-ghost w-full text-left flex items-center gap-2">
            <span>↩</span><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
