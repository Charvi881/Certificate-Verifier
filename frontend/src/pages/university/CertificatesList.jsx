import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../utils/api";
import { fmtDate, timeAgo, truncateHash, copyText } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function CertificatesList() {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [revoking, setRevoking] = useState(null);
  const [params]  = useSearchParams();

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 15, ...(statusFilter !== "all" && { status: statusFilter }), ...(search && { search }) });
      const { data } = await api.get(`/university/certificates?${q}`);
      setCerts(data.certificates); setPages(data.pages);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { const s = params.get("status"); if (s) setStatusFilter(s); }, []);
  useEffect(() => { load(); }, [page, statusFilter, search]);

  const revoke = async (certId) => {
    const reason = prompt("Reason for revocation (optional):");
    if (reason === null) return;
    setRevoking(certId);
    try { await api.patch(`/university/certificates/${certId}/revoke`, { reason }); toast.success("Certificate revoked"); load(); }
    catch (err) { toast.error(err.response?.data?.error || "Failed to revoke"); }
    finally { setRevoking(null); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding:"32px 36px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>◈ University Module</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#fff", margin:0 }}>Certificates</h1>
          </div>
          <Link to="/university/issue" style={{ padding:"10px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, textDecoration:"none" }}>
            + Issue New
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search name, ID, course…" className="input-field" style={{ width:220, padding:"8px 12px", fontSize:12 }} />
          <div style={{ display:"flex", gap:6 }}>
            {["all","issued","revoked","pending"].map(s => (
              <button key={s} onClick={()=>{setStatusFilter(s);setPage(1);}} style={{ padding:"6px 12px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:"capitalize", background:statusFilter===s?"rgba(0,230,180,0.12)":"rgba(255,255,255,0.04)", color:statusFilter===s?"#00e6b4":"rgba(232,240,254,0.4)", transition:"all .15s" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:14, overflow:"hidden" }}>
          {/* Header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1.2fr 1fr 1fr", gap:12, padding:"11px 20px", borderBottom:"1px solid rgba(0,230,180,0.08)", fontSize:10, color:"rgba(232,240,254,0.3)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            <span>Recipient</span><span>Course</span><span>Grade</span><span>Issued</span><span>Status</span><span>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:"rgba(232,240,254,0.3)" }}>Loading certificates…</div>
          ) : certs.length === 0 ? (
            <div style={{ padding:40, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
              <div style={{ color:"rgba(232,240,254,0.3)", fontSize:13 }}>No certificates found</div>
            </div>
          ) : (
            certs.map(c => (
              <div key={c._id} style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1.2fr 1fr 1fr", gap:12, padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(0,230,180,0.025)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e8f0fe", marginBottom:2 }}>{c.recipientName}</div>
                  <div style={{ fontSize:10, color:"rgba(0,230,180,0.5)", fontFamily:"'DM Mono',monospace", cursor:"pointer" }} onClick={()=>{ copyText(c.certId); toast.success("ID copied"); }}>
                    {truncateHash(c.certId, 14, 4)}
                  </div>
                </div>
                <div style={{ fontSize:12, color:"rgba(232,240,254,0.6)" }}>{c.courseName}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{c.grade}</div>
                <div style={{ fontSize:11, color:"rgba(232,240,254,0.4)" }}>{fmtDate(c.issueDate)}</div>
                <div>
                  <span className={`badge ${c.status==="issued"?"badge-verified":c.status==="revoked"?"badge-revoked":"badge-pending"}`} style={{ fontSize:10 }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <Link to={`/verify/${c.certId}`} style={{ fontSize:10, padding:"4px 8px", borderRadius:5, border:"1px solid rgba(0,230,180,0.2)", color:"#00e6b4", textDecoration:"none" }}>View</Link>
                  {c.status === "issued" && (
                    <button disabled={revoking===c.certId} onClick={()=>revoke(c.certId)} style={{ fontSize:10, padding:"4px 8px", borderRadius:5, border:"1px solid rgba(255,77,109,0.25)", background:"rgba(255,77,109,0.05)", color:"#ff4d6d", cursor:"pointer" }}>
                      {revoking===c.certId ? "…" : "Revoke"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:16 }}>
            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} style={{ width:32, height:32, borderRadius:7, border:"none", background:page===p?"linear-gradient(135deg,#00e6b4,#0078ff)":"rgba(255,255,255,0.05)", color:page===p?"#060b14":"rgba(232,240,254,0.5)", fontSize:12, cursor:"pointer" }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
