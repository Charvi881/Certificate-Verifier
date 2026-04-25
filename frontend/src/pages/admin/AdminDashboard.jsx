import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../utils/api";
import { fmtDate, timeAgo, STATUS_META } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color="#00e6b4", sub }) {
  return (
    <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.1)", borderRadius:14, padding:22 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:11, color:"rgba(232,240,254,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Mono',monospace" }}>{label}</div>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:32, color, marginBottom:4 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>{sub}</div>}
    </div>
  );
}

// ─── Universities management tab ──────────────────────────────────────────────
function UniversitiesTab() {
  const [unis,    setUnis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", shortName:"", email:"", walletAddress:"", location:"" });

  const load = async () => {
    try { const { data } = await api.get("/admin/universities"); setUnis(data.universities); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try { await api.patch(`/admin/universities/${id}/approve`); toast.success("University approved"); load(); }
    catch { toast.error("Failed"); }
  };
  const revoke = async (id) => {
    try { await api.patch(`/admin/universities/${id}/revoke`); toast.success("Approval revoked"); load(); }
    catch { toast.error("Failed"); }
  };
  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/admin/universities", form); toast.success("University created"); setShowForm(false); setForm({ name:"", shortName:"", email:"", walletAddress:"", location:"" }); load(); }
    catch (err) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const filtered = unis.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#fff", margin:0 }}>Universities</h2>
        <div style={{ display:"flex", gap:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="input-field" style={{ width:180, padding:"8px 12px", fontSize:12 }} />
          <button onClick={()=>setShowForm(!showForm)} style={{ padding:"9px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={create} style={{ background:"rgba(0,230,180,0.04)", border:"1px solid rgba(0,230,180,0.15)", borderRadius:14, padding:20, marginBottom:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["name","University Name"],["shortName","Short Name"],["email","Email"],["walletAddress","Wallet Address"],["location","Location"]].map(([k,l]) => (
            <div key={k}>
              <div style={{ fontSize:10, color:"rgba(232,240,254,0.4)", marginBottom:4, fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>{l}</div>
              <input className="input-field" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} required={["name","email","walletAddress"].includes(k)} />
            </div>
          ))}
          <div style={{ gridColumn:"1/-1", display:"flex", gap:10 }}>
            <button type="submit" style={{ padding:"10px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>Create University</button>
            <button type="button" onClick={()=>setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {loading ? <div style={{ textAlign:"center", padding:32, color:"rgba(232,240,254,0.3)" }}>Loading…</div> :
        filtered.length === 0 ? <div style={{ textAlign:"center", padding:32, color:"rgba(232,240,254,0.3)" }}>No universities found</div> :
        filtered.map(u => (
          <div key={u._id} style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:600, color:"#fff", marginBottom:2 }}>{u.name}</div>
              <div style={{ fontSize:11, color:"rgba(232,240,254,0.35)", fontFamily:"'DM Mono',monospace" }}>{u.email} · {u.walletAddress?.slice(0,14)}…</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className={`badge ${u.isApproved ? "badge-verified" : "badge-pending"}`}>{u.isApproved ? "Approved" : "Pending"}</span>
              <span style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>📜 {u.totalIssued}</span>
              {u.isApproved
                ? <button onClick={()=>revoke(u._id)} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid rgba(255,77,109,0.3)", background:"rgba(255,77,109,0.05)", color:"#ff4d6d", fontSize:11, cursor:"pointer" }}>Revoke</button>
                : <button onClick={()=>approve(u._id)} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"rgba(0,230,180,0.1)", color:"#00e6b4", fontSize:11, cursor:"pointer" }}>Approve</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
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

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#fff", marginBottom:20 }}>System Users</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {loading ? <div style={{ textAlign:"center", padding:32, color:"rgba(232,240,254,0.3)" }}>Loading…</div> :
        users.map(u => (
          <div key={u._id} style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.07)", borderRadius:11, padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,#00e6b4,#0078ff)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#060b14", fontWeight:700 }}>{u.name[0]}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{u.name}</div>
                <div style={{ fontSize:11, color:"rgba(232,240,254,0.35)" }}>{u.email} · {timeAgo(u.createdAt)}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, padding:"3px 8px", borderRadius:4, background:"rgba(0,120,255,0.1)", color:"#6090ff", fontFamily:"'DM Mono',monospace", border:"1px solid rgba(0,120,255,0.2)" }}>{u.role}</span>
              <span className={`badge ${u.isActive ? "badge-verified" : "badge-revoked"}`}>{u.isActive ? "Active" : "Inactive"}</span>
              <button onClick={()=>toggle(u._id)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.03)", color:"rgba(232,240,254,0.5)", fontSize:11, cursor:"pointer" }}>
                {u.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => { setStats(data.stats); setRecent(data.recentCerts); }).catch(()=>{});
  }, []);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>◈ Admin Panel</div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#fff", margin:0 }}>System Dashboard</h1>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:28 }}>
        <StatCard icon="🏛" label="Total Universities"   value={stats?.totalUnis}      sub={`${stats?.approvedUnis} approved`} />
        <StatCard icon="📜" label="Certificates Issued"  value={stats?.totalCerts}     color="#0078ff" />
        <StatCard icon="👥" label="System Users"         value={stats?.totalUsers}     color="#a855f7" />
        <StatCard icon="⛓" label="Blockchain Network"   value="Polygon"               sub="Mumbai Testnet" color="#f5a623" />
      </div>

      {recent.length > 0 && (
        <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(0,230,180,0.06)", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#fff" }}>Recent Certificates</div>
          {recent.map(c => (
            <div key={c._id} style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{c.recipientName}</div>
                <div style={{ fontSize:11, color:"rgba(232,240,254,0.35)" }}>{c.courseName} · {c.university?.name}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span className="badge badge-verified">Issued</span>
                <span style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div style={{ padding:"32px 36px" }}>
        <Routes>
          <Route index              element={<AdminHome />} />
          <Route path="universities" element={<UniversitiesTab />} />
          <Route path="users"        element={<UsersTab />} />
          <Route path="certificates" element={<div style={{color:"rgba(232,240,254,0.4)",padding:32}}>Certificate management coming soon.</div>} />
        </Routes>
      </div>
    </DashboardLayout>
  );
}
