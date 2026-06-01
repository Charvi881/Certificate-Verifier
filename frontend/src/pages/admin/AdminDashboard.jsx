// ── CHANGES FROM ORIGINAL ──────────────────────────────────────────────────
//  1. Added "Ledger" and "Network" to NAV array
//  2. Imported LedgerPage and NetworkPage from LedgerNetworkPages.jsx
//  3. Added two new <Route> entries in AdminDashboard
//  All other code is unchanged.
// ───────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { timeAgo, fmtDate, copyText } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ── NEW: import the two new pages ──────────────────────────────────────────
import { LedgerPage, NetworkPage } from "./LedgerNetworkPages";

// ─── Sidebar nav items  (⬡ and ⛓ added) ─────────────────────────────────────
const NAV = [
  { to: "/admin",              icon: "▣",  label: "Overview"      },
  { to: "/admin/universities", icon: "🏛", label: "Universities"  },
  { to: "/admin/users",        icon: "👤", label: "Users"         },
  { to: "/admin/certificates", icon: "📜", label: "Certificates"  },
  { to: "/admin/ledger",       icon: "⛓", label: "Ledger"        }, // NEW
  { to: "/admin/network",      icon: "⬡",  label: "Network"       }, // NEW
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ pendingCount }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 240, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      background: "#0a0f1a", borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#00e6b4,#0078ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🔐</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.3px" }}>
              Secured<span style={{ color: "#00e6b4" }}>Trust</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ background: "rgba(0,230,180,0.06)", border: "1px solid rgba(0,230,180,0.1)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "rgba(0,230,180,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2, fontFamily: "'DM Mono',monospace" }}>Signed in as</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{user?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(({ to, icon, label }) => {
          const active = location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 9, textDecoration: "none", transition: "all 0.15s",
              background: active ? "rgba(0,230,180,0.08)" : "transparent",
              color: active ? "#00e6b4" : "rgba(255,255,255,0.45)",
              fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
              border: active ? "1px solid rgba(0,230,180,0.15)" : "1px solid transparent",
              position: "relative"
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span>{label}</span>
              {label === "Universities" && pendingCount > 0 && (
                <span style={{ marginLeft: "auto", background: "#ff4d6d", color: "#fff", fontSize: 9, fontFamily: "'DM Mono',monospace", fontWeight: 700, padding: "2px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => { logout(); navigate("/"); toast.success("Signed out"); }} style={{
          width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13,
          fontFamily: "'DM Sans',sans-serif", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
          transition: "all 0.15s"
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,77,109,0.08)"; e.currentTarget.style.color = "#ff4d6d"; e.currentTarget.style.borderColor = "rgba(255,77,109,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
function Page({ title, sub, actions, children }) {
  return (
    <div style={{ padding: "32px 36px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>◈ Admin</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>{title}</h1>
          {sub && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>{sub}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = "#00e6b4", sub, alert }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${alert ? "rgba(255,77,109,0.25)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden"
    }}>
      {alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff4d6d,#ff9a3c)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono',monospace" }}>{label}</div>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color: alert ? "#ff4d6d" : color }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── University status badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved: { label: "Approved",  bg: "rgba(0,230,180,0.1)",  color: "#00e6b4", border: "rgba(0,230,180,0.25)",  dot: "#00e6b4" },
    pending:  { label: "Pending",   bg: "rgba(245,166,35,0.1)", color: "#f5a623", border: "rgba(245,166,35,0.25)", dot: "#f5a623" },
    rejected: { label: "Rejected",  bg: "rgba(255,77,109,0.1)", color: "#ff4d6d", border: "rgba(255,77,109,0.25)", dot: "#ff4d6d" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 11, color: s.color, fontFamily: "'DM Mono',monospace" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

// ─── Universities management ──────────────────────────────────────────────────
function UniversitiesPage() {
  const [unis,    setUnis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/universities");
      setUnis(data.universities);
    } catch { toast.error("Failed to load universities"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id, name) => {
    setActionLoading(id + "_approve");
    try {
      await api.patch(`/admin/universities/${id}/approve`);
      toast.success(`✅ ${name} approved!`);
      load(); setSelected(null);
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setActionLoading(null); }
  };

  const reject = async (id, name) => {
    const reason = prompt(`Reason for rejecting "${name}" (optional):`);
    if (reason === null) return;
    setActionLoading(id + "_reject");
    try {
      await api.patch(`/admin/universities/${id}/reject`, { reason });
      toast.error(`❌ ${name} rejected.`);
      load(); setSelected(null);
    } catch { toast.error("Failed"); }
    finally { setActionLoading(null); }
  };

  const revoke = async (id, name) => {
    if (!confirm(`Revoke approval for "${name}"?`)) return;
    setActionLoading(id + "_revoke");
    try {
      await api.patch(`/admin/universities/${id}/revoke`);
      toast.success(`Approval revoked for ${name}`);
      load(); setSelected(null);
    } catch { toast.error("Failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = unis.filter(u => {
    const matchFilter = filter === "all" ||
      (filter === "approved" && u.isApproved) ||
      (filter === "pending"  && !u.isApproved && !u.rejectedAt) ||
      (filter === "rejected" && u.rejectedAt && !u.isApproved);
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatus = u => u.isApproved ? "approved" : u.rejectedAt ? "rejected" : "pending";

  const counts = {
    all:      unis.length,
    pending:  unis.filter(u => !u.isApproved && !u.rejectedAt).length,
    approved: unis.filter(u => u.isApproved).length,
    rejected: unis.filter(u => u.rejectedAt && !u.isApproved).length,
  };

  return (
    <Page title="Universities" sub="Review registration requests and manage university access">
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all","All"],["pending","⏳ Pending"],["approved","✅ Approved"],["rejected","❌ Rejected"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
            fontFamily: "'DM Mono',monospace", transition: "all 0.15s",
            background: filter === k ? (k === "pending" ? "rgba(245,166,35,0.15)" : k === "approved" ? "rgba(0,230,180,0.12)" : k === "rejected" ? "rgba(255,77,109,0.12)" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
            color: filter === k ? (k === "pending" ? "#f5a623" : k === "approved" ? "#00e6b4" : k === "rejected" ? "#ff4d6d" : "#fff") : "rgba(255,255,255,0.4)",
            borderWidth: 1, borderStyle: "solid", borderColor: filter === k ? "rgba(255,255,255,0.1)" : "transparent"
          }}>
            {l} <span style={{ opacity: 0.6 }}>({counts[k]})</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none", width: 220 }} />
      </div>

      {counts.pending > 0 && (
        <div style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f5a623" }}>{counts.pending} university registration{counts.pending > 1 ? "s" : ""} awaiting your review</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Review and approve or decline each request below</div>
          </div>
          <button onClick={() => setFilter("pending")} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(245,166,35,0.3)", background: "rgba(245,166,35,0.1)", color: "#f5a623", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
            Review Now →
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading universities…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No universities found</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(u => {
            const status = getStatus(u);
            const isLoading = actionLoading?.startsWith(u._id);
            return (
              <div key={u._id} style={{
                background: "rgba(255,255,255,0.02)", border: `1px solid ${status === "pending" ? "rgba(245,166,35,0.15)" : status === "approved" ? "rgba(0,230,180,0.08)" : "rgba(255,77,109,0.1)"}`,
                borderRadius: 14, padding: "18px 22px", transition: "all 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: status === "approved" ? "rgba(0,230,180,0.12)" : status === "pending" ? "rgba(245,166,35,0.12)" : "rgba(255,77,109,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏛</div>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>{u.shortName}</div>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 12 }}>
                      {[
                        ["📧 Email",    u.email],
                        ["📍 Location", u.location || "Not specified"],
                        ["🌐 Website",  u.website  || "Not specified"],
                        ["📜 Issued",   `${u.totalIssued || 0} certificates`],
                        ["📅 Registered", timeAgo(u.createdAt)],
                        ...(u.approvedAt ? [["✅ Approved", fmtDate(u.approvedAt)]] : []),
                        ...(u.rejectedAt ? [["❌ Rejected", fmtDate(u.rejectedAt)]] : []),
                        ...(u.rejectReason ? [["📝 Reason", u.rejectReason]] : []),
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 7, padding: "7px 10px" }}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, fontFamily: "'DM Mono',monospace" }}>{k}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    {status === "pending" && (
                      <>
                        <button disabled={isLoading} onClick={() => approve(u._id, u.name)} style={{ padding: "10px 18px", borderRadius: 9, border: "none", cursor: isLoading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#00e6b4,#00b890)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, opacity: isLoading ? 0.6 : 1 }}>
                          {actionLoading === u._id + "_approve" ? "Approving…" : "✓ Approve"}
                        </button>
                        <button disabled={isLoading} onClick={() => reject(u._id, u.name)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid rgba(255,77,109,0.35)", background: "rgba(255,77,109,0.08)", color: "#ff4d6d", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, opacity: isLoading ? 0.6 : 1 }}>
                          {actionLoading === u._id + "_reject" ? "Declining…" : "✕ Decline"}
                        </button>
                      </>
                    )}
                    {status === "approved" && (
                      <button disabled={isLoading} onClick={() => revoke(u._id, u.name)} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(255,77,109,0.25)", background: "rgba(255,77,109,0.05)", color: "#ff4d6d", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>Revoke Access</button>
                    )}
                    {status === "rejected" && (
                      <button disabled={isLoading} onClick={() => approve(u._id, u.name)} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(0,230,180,0.25)", background: "rgba(0,230,180,0.05)", color: "#00e6b4", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>Re-approve</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}

// ─── Users page ───────────────────────────────────────────────────────────────
function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get("/admin/users"); setUsers(data.users); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try { const { data } = await api.patch(`/admin/users/${id}/toggle`); toast.success(data.message); load(); }
    catch { toast.error("Failed"); }
  };

  const roleColor = { admin: "#a855f7", university: "#00e6b4", verifier: "#0078ff" };

  return (
    <Page title="System Users" sub="Manage all registered users across roles">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading…</div> :
          users.map(u => (
            <div key={u._id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${roleColor[u.role] || "#00e6b4"},#0078ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#060b14", fontWeight: 700, flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>
                    {u.email}
                    {u.universityId && <span style={{ marginLeft: 8, color: "#00e6b4" }}>· {u.universityId.name || "University linked"}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: `${roleColor[u.role]}15`, color: roleColor[u.role], fontFamily: "'DM Mono',monospace", border: `1px solid ${roleColor[u.role]}30` }}>{u.role}</span>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, fontFamily: "'DM Mono',monospace", background: u.isActive ? "rgba(0,230,180,0.08)" : "rgba(255,77,109,0.08)", color: u.isActive ? "#00e6b4" : "#ff4d6d", border: `1px solid ${u.isActive ? "rgba(0,230,180,0.2)" : "rgba(255,77,109,0.2)"}` }}>{u.isActive ? "Active" : "Inactive"}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{timeAgo(u.createdAt)}</span>
                <button onClick={() => toggle(u._id)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
                  {u.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
      </div>
    </Page>
  );
}

// ─── Overview / Home ──────────────────────────────────────────────────────────
function Overview({ setPendingCount }) {
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => {
      setStats(data.stats);
      setRecent(data.recentCerts || []);
      setPending(data.pendingUniList || []);
      setPendingCount(data.stats?.pendingUnis || 0);
    }).catch(() => {});
  }, []);

  return (
    <Page title="Overview" sub="System-wide statistics and pending actions">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard icon="⏳" label="Pending Approvals"    value={stats?.pendingUnis}  color="#f5a623" alert={stats?.pendingUnis > 0} sub="Require your action" />
        <StatCard icon="🏛" label="Approved Universities" value={stats?.approvedUnis} color="#00e6b4" />
        <StatCard icon="📜" label="Certificates Issued"  value={stats?.totalCerts}   color="#0078ff" />
        <StatCard icon="👥" label="Total Users"          value={stats?.totalUsers}   color="#a855f7" />
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>⏳ Pending Approvals</div>
            <Link to="/admin/universities" style={{ fontSize: 12, color: "rgba(0,230,180,0.6)", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(u => (
              <div key={u._id} style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>{u.email} · Registered {timeAgo(u.createdAt)}</div>
                </div>
                <Link to="/admin/universities" style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg,#00e6b4,#00b890)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 12 }}>Recent Certificates</div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
            {recent.map((c, i) => (
              <div key={c._id} style={{ padding: "12px 18px", borderBottom: i < recent.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.recipientName}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.courseName} · {c.university?.name}</div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{timeAgo(c.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}

// ─── Certificates page ────────────────────────────────────────────────────────
function CertStatusBadge({ status }) {
  const map = {
    issued:  { label: "Issued",  bg: "rgba(0,230,180,0.1)",  color: "#00e6b4", border: "rgba(0,230,180,0.25)"  },
    revoked: { label: "Revoked", bg: "rgba(255,77,109,0.1)", color: "#ff4d6d", border: "rgba(255,77,109,0.25)" },
    pending: { label: "Pending", bg: "rgba(245,166,35,0.1)", color: "#f5a623", border: "rgba(245,166,35,0.25)" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 10, color: s.color, fontFamily: "'DM Mono',monospace" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
      {s.label.toUpperCase()}
    </span>
  );
}

function CertificatesPage() {
  const [certs,    setCerts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const PER_PAGE = 12;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/certificates");
      setCerts(data.certificates || []);
    } catch { toast.error("Failed to load certificates"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (cert) => {
    const reason = prompt(`Reason for revoking certificate for "${cert.recipientName}" (optional):`);
    if (reason === null) return;
    setRevoking(cert._id);
    try {
      await api.patch(`/admin/certificates/${cert._id}/revoke`, { reason });
      toast.success("Certificate revoked");
      load(); setSelected(null);
    } catch (err) { toast.error(err.response?.data?.error || "Failed to revoke"); }
    finally { setRevoking(null); }
  };

  const filtered = certs.filter(c => {
    const matchFilter = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.recipientName?.toLowerCase().includes(q) ||
      c.recipientEmail?.toLowerCase().includes(q) ||
      c.courseName?.toLowerCase().includes(q) ||
      c.certId?.toLowerCase().includes(q) ||
      c.university?.name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all:     certs.length,
    issued:  certs.filter(c => c.status === "issued").length,
    revoked: certs.filter(c => c.status === "revoked").length,
    pending: certs.filter(c => c.status === "pending").length,
  };

  return (
    <Page title="Certificates" sub="All certificates issued across the network">
      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total",   value: counts.all,     color: "#fff"     },
          { label: "Issued",  value: counts.issued,  color: "#00e6b4"  },
          { label: "Revoked", value: counts.revoked, color: "#ff4d6d"  },
          { label: "Pending", value: counts.pending, color: "#f5a623"  },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {["all","issued","revoked","pending"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 11, fontFamily: "'DM Mono',monospace", textTransform: "uppercase",
            background: filter === f
              ? (f === "issued" ? "rgba(0,230,180,0.12)" : f === "revoked" ? "rgba(255,77,109,0.12)" : f === "pending" ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.1)")
              : "rgba(255,255,255,0.04)",
            color: filter === f
              ? (f === "issued" ? "#00e6b4" : f === "revoked" ? "#ff4d6d" : f === "pending" ? "#f5a623" : "#fff")
              : "rgba(255,255,255,0.4)",
            borderWidth: 1, borderStyle: "solid",
            borderColor: filter === f ? "rgba(255,255,255,0.12)" : "transparent"
          }}>
            {f} <span style={{ opacity: 0.5 }}>({counts[f]})</span>
          </button>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, course, cert ID…"
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none", width: 260 }}
        />
        <button onClick={load} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,230,180,0.2)", background: "rgba(0,230,180,0.06)", color: "#00e6b4", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📜</div>Loading certificates…
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No certificates found</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.4fr 1.2fr 100px 90px 80px", gap: 0, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            {["Recipient", "Course", "University", "Issued", "Status", ""].map(h => (
              <div key={h} style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {paginated.map((c, i) => (
            <div
              key={c._id}
              onClick={() => setSelected(selected?._id === c._id ? null : c)}
              style={{
                display: "grid", gridTemplateColumns: "1.8fr 1.4fr 1.2fr 100px 90px 80px",
                gap: 0, padding: "13px 18px",
                borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                cursor: "pointer", transition: "background 0.12s",
                background: selected?._id === c._id ? "rgba(0,230,180,0.04)" : "transparent",
                alignItems: "center",
              }}
              onMouseEnter={e => { if (selected?._id !== c._id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (selected?._id !== c._id) e.currentTarget.style.background = "transparent"; }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.recipientName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{c.recipientEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{c.courseName}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Grade: {c.grade}</div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{c.university?.shortName || c.university?.name || "—"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>
                {c.issueDate ? new Date(c.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
              <CertStatusBadge status={c.status} />
              <div style={{ textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                {selected?._id === c._id ? "▲" : "▼"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded detail panel */}
      {selected && (
        <div style={{ marginTop: 16, background: "rgba(0,230,180,0.03)", border: "1px solid rgba(0,230,180,0.12)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>{selected.recipientName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>{selected.certId}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <CertStatusBadge status={selected.status} />
              {selected.status === "issued" && (
                <button
                  onClick={() => handleRevoke(selected)}
                  disabled={revoking === selected._id}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,77,109,0.3)", background: "rgba(255,77,109,0.08)", color: "#ff4d6d", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace", opacity: revoking === selected._id ? 0.5 : 1 }}
                >
                  {revoking === selected._id ? "Revoking…" : "Revoke"}
                </button>
              )}
              <button onClick={() => setSelected(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>✕ Close</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              ["Recipient Name",  selected.recipientName],
              ["Recipient Email", selected.recipientEmail],
              ["Course",          selected.courseName],
              ["Grade",           selected.grade],
              ["University",      selected.university?.name || "—"],
              ["Issue Date",      selected.issueDate ? new Date(selected.issueDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—"],
              ["Expiry Date",     selected.expiryDate ? new Date(selected.expiryDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "No expiry"],
              ["Network",         selected.network || "—"],
              ["Verifications",   selected.verifications ?? 0],
              ["Block Number",    selected.blockNumber ?? "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{String(v)}</div>
              </div>
            ))}
          </div>

          {/* Hashes */}
          {[
            ["Cert Hash",  selected.certHash,  "#00e6b4"],
            ["Tx Hash",    selected.txHash,    "rgba(168,85,247,0.8)"],
            ["IPFS Hash",  selected.ipfsHash,  "#4da6ff"],
          ].filter(([, v]) => v).map(([label, hash, color]) => (
            <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, width: 80 }}>{label}</div>
              <code style={{ flex: 1, fontSize: 11, fontFamily: "'DM Mono',monospace", color, wordBreak: "break-all" }}>{hash}</code>
              <button
                onClick={() => { (copyText?.(hash) ?? navigator.clipboard.writeText(hash)); toast.success("Copied!"); }}
                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", fontFamily: "'DM Mono',monospace", flexShrink: 0 }}
              >copy</button>
            </div>
          ))}

          {selected.status === "revoked" && selected.revokeReason && (
            <div style={{ marginTop: 10, background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,77,109,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Revoke Reason</div>
              <div style={{ fontSize: 13, color: "#ff4d6d" }}>{selected.revokeReason}</div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 22 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: page === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>← Prev</button>
          <span style={{ padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: page === totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>Next →</button>
        </div>
      )}
    </Page>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060b14", color: "#e8f0fe" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(0,230,180,0.2); }
      `}</style>
      <Sidebar pendingCount={pendingCount} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Routes>
          <Route index               element={<Overview setPendingCount={setPendingCount} />} />
          <Route path="universities" element={<UniversitiesPage />} />
          <Route path="users"        element={<UsersPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          {/* ── NEW ROUTES ── */}
          <Route path="ledger"       element={<LedgerPage />} />
          <Route path="network"      element={<NetworkPage />} />
        </Routes>
      </main>
    </div>
  );
}