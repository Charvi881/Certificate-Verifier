import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { fmtDate, timeAgo } from "../../utils/helpers";

function StatCard({ icon, label, value, color="#00e6b4", to }) {
  const inner = (
    <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.1)", borderRadius:14, padding:22, cursor:to?"pointer":"default", transition:"border-color .2s" }}
      onMouseEnter={e => { if(to) e.currentTarget.style.borderColor="rgba(0,230,180,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(0,230,180,0.1)"; }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:10, color:"rgba(232,240,254,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Mono',monospace" }}>{label}</div>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color }}>{value ?? "—"}</div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration:"none" }}>{inner}</Link> : inner;
}

export default function UniversityDashboard() {
  const [stats,  setStats]  = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/university/stats").then(({ data }) => setStats(data.stats)).catch(()=>{});
    api.get("/university/certificates?limit=6").then(({ data }) => setRecent(data.certificates)).catch(()=>{});
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding:"32px 36px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>◈ University Module</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#fff", margin:0 }}>Certificate Dashboard</h1>
          </div>
          <Link to="/university/issue" style={{ padding:"11px 22px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, textDecoration:"none", boxShadow:"0 0 20px rgba(0,230,180,0.25)" }}>
            + Issue Certificate
          </Link>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:28 }}>
          <StatCard icon="📜" label="Issued"  value={stats?.issued}  to="/university/certificates?status=issued" />
          <StatCard icon="⏳" label="Pending" value={stats?.pending} color="#9090c0" to="/university/certificates?status=pending" />
          <StatCard icon="🚫" label="Revoked" value={stats?.revoked} color="#ff4d6d" to="/university/certificates?status=revoked" />
          <StatCard icon="🗂" label="Total"   value={stats?.total}   color="#a855f7" />
        </div>

        {/* Quick issue card */}
        <div style={{ background:"linear-gradient(135deg,rgba(0,230,180,0.05),rgba(0,120,255,0.04))", border:"1px solid rgba(0,230,180,0.12)", borderRadius:16, padding:"22px 26px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#fff", marginBottom:4 }}>Issue a New Certificate</div>
            <div style={{ fontSize:12, color:"rgba(232,240,254,0.4)" }}>Upload the PDF, fill student details — hash stored on blockchain automatically.</div>
          </div>
          <Link to="/university/issue" style={{ padding:"10px 20px", borderRadius:10, background:"rgba(0,230,180,0.1)", border:"1px solid rgba(0,230,180,0.25)", color:"#00e6b4", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, textDecoration:"none", whiteSpace:"nowrap" }}>
            Issue Now →
          </Link>
        </div>

        {/* Recent certs */}
        {recent.length > 0 && (
          <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(0,230,180,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#fff" }}>Recent Certificates</span>
              <Link to="/university/certificates" style={{ fontSize:12, color:"rgba(0,230,180,0.6)", textDecoration:"none" }}>View all →</Link>
            </div>
            {recent.map(c => (
              <div key={c._id} style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{c.recipientName}</div>
                  <div style={{ fontSize:11, color:"rgba(232,240,254,0.35)", fontFamily:"'DM Mono',monospace" }}>{c.certId} · {c.courseName}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className={`badge ${c.status==="issued"?"badge-verified":c.status==="revoked"?"badge-revoked":"badge-pending"}`} style={{ fontSize:10 }}>{c.status}</span>
                  <span style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
