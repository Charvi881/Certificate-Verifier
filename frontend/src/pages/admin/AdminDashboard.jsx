import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { timeAgo, fmtDate, copyText } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { to: "/admin",              icon: "▣", label: "Overview"      },
  { to: "/admin/universities", icon: "🏛", label: "Universities"  },
  { to: "/admin/users",        icon: "👤", label: "Users"         },
  { to: "/admin/certificates", icon: "📜", label: "Certificates"  },
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
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
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
              {/* Pending badge on Universities */}
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
  const [filter,  setFilter]  = useState("all"); // all | pending | approved | rejected
  const [search,  setSearch]  = useState("");
  const [selected, setSelected] = useState(null); // detail modal
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
      const { data } = await api.patch(`/admin/universities/${id}/approve`);
      toast.success(`✅ ${name} approved! University can now issue certificates.`);
      load();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setActionLoading(null); }
  };

  const reject = async (id, name) => {
    const reason = prompt(`Reason for rejecting "${name}" (optional):`);
    if (reason === null) return; // cancelled
    setActionLoading(id + "_reject");
    try {
      await api.patch(`/admin/universities/${id}/reject`, { reason });
      toast.error(`❌ ${name} rejected.`);
      load();
      setSelected(null);
    } catch { toast.error("Failed"); }
    finally { setActionLoading(null); }
  };

  const revoke = async (id, name) => {
    if (!confirm(`Revoke approval for "${name}"? They will lose certificate issuance access.`)) return;
    setActionLoading(id + "_revoke");
    try {
      await api.patch(`/admin/universities/${id}/revoke`);
      toast.success(`Approval revoked for ${name}`);
      load();
      setSelected(null);
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

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all","All"],["pending","⏳ Pending"],["approved","✅ Approved"],["rejected","❌ Rejected"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
            fontFamily: "'DM Mono',monospace", transition: "all 0.15s",
            background: filter === k ? (k === "pending" ? "rgba(245,166,35,0.15)" : k === "approved" ? "rgba(0,230,180,0.12)" : k === "rejected" ? "rgba(255,77,109,0.12)" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
            color: filter === k ? (k === "pending" ? "#f5a623" : k === "approved" ? "#00e6b4" : k === "rejected" ? "#ff4d6d" : "#fff") : "rgba(255,255,255,0.4)",
            borderWidth: 1, borderStyle: "solid",
            borderColor: filter === k ? "rgba(255,255,255,0.1)" : "transparent"
          }}>
            {l} <span style={{ opacity: 0.6 }}>({counts[k]})</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none", width: 220 }} />
      </div>

      {/* Pending alert banner */}
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

      {/* List */}
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
                  {/* Left — University info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: status === "approved" ? "rgba(0,230,180,0.12)" : status === "pending" ? "rgba(245,166,35,0.12)" : "rgba(255,77,109,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                        🏛
                      </div>
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

                  {/* Right — Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    {status === "pending" && (
                      <>
                        <button disabled={isLoading} onClick={() => approve(u._id, u.name)} style={{
                          padding: "10px 18px", borderRadius: 9, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                          background: "linear-gradient(135deg,#00e6b4,#00b890)", color: "#060b14",
                          fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                          opacity: isLoading ? 0.6 : 1, transition: "all 0.15s"
                        }}>
                          {actionLoading === u._id + "_approve" ? "Approving…" : "✓ Approve"}
                        </button>
                        <button disabled={isLoading} onClick={() => reject(u._id, u.name)} style={{
                          padding: "10px 18px", borderRadius: 9, border: "1px solid rgba(255,77,109,0.35)",
                          background: "rgba(255,77,109,0.08)", color: "#ff4d6d", cursor: isLoading ? "not-allowed" : "pointer",
                          fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                          opacity: isLoading ? 0.6 : 1, transition: "all 0.15s"
                        }}>
                          {actionLoading === u._id + "_reject" ? "Declining…" : "✕ Decline"}
                        </button>
                      </>
                    )}
                    {status === "approved" && (
                      <button disabled={isLoading} onClick={() => revoke(u._id, u.name)} style={{
                        padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(255,77,109,0.25)",
                        background: "rgba(255,77,109,0.05)", color: "#ff4d6d", cursor: "pointer",
                        fontSize: 12, fontFamily: "'DM Mono',monospace", transition: "all 0.15s"
                      }}>
                        Revoke Access
                      </button>
                    )}
                    {status === "rejected" && (
                      <button disabled={isLoading} onClick={() => approve(u._id, u.name)} style={{
                        padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(0,230,180,0.25)",
                        background: "rgba(0,230,180,0.05)", color: "#00e6b4", cursor: "pointer",
                        fontSize: 12, fontFamily: "'DM Mono',monospace", transition: "all 0.15s"
                      }}>
                        Re-approve
                      </button>
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
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard icon="⏳" label="Pending Approvals" value={stats?.pendingUnis}  color="#f5a623" alert={stats?.pendingUnis > 0} sub="Require your action" />
        <StatCard icon="🏛" label="Approved Universities" value={stats?.approvedUnis} color="#00e6b4" />
        <StatCard icon="📜" label="Certificates Issued"  value={stats?.totalCerts}   color="#0078ff" />
        <StatCard icon="👥" label="Total Users"          value={stats?.totalUsers}   color="#a855f7" />
      </div>

      {/* Pending universities — quick action */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>
              ⏳ Pending Approvals
            </div>
            <Link to="/admin/universities" style={{ fontSize: 12, color: "rgba(0,230,180,0.6)", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(u => (
              <div key={u._id} style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>{u.email} · Registered {timeAgo(u.createdAt)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/admin/universities" style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg,#00e6b4,#00b890)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent certificates */}
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
          <Route index             element={<Overview setPendingCount={setPendingCount} />} />
          <Route path="universities" element={<UniversitiesPage />} />
          <Route path="users"        element={<UsersPage />} />
          <Route path="certificates" element={<Page title="Certificates" sub="All issued certificates"><div style={{ color: "rgba(255,255,255,0.3)", padding: 32, textAlign: "center" }}>Coming soon</div></Page>} />
        </Routes>
      </main>
    </div>
  );
}