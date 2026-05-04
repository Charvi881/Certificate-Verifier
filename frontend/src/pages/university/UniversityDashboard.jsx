import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { fmtDate, timeAgo, truncateHash, copyText } from "../../utils/helpers";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV = [
  { to: "/university",              icon: "▣", label: "Dashboard"        },
  { to: "/university/issue",        icon: "✦", label: "Issue Certificate" },
  { to: "/university/certificates", icon: "📜", label: "My Certificates"  },
];

function Sidebar({ uniStatus }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 240, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      background: "#0a0f1a", borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column"
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#00e6b4,#0078ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔐</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
              Secured<span style={{ color: "#00e6b4" }}>Trust</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>UNIVERSITY</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ background: "rgba(0,230,180,0.06)", border: "1px solid rgba(0,230,180,0.1)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "rgba(0,230,180,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2, fontFamily: "'DM Mono',monospace" }}>University Rep</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{user?.email}</div>
        </div>
        {/* Approval status chip */}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 7, background: uniStatus === "approved" ? "rgba(0,230,180,0.08)" : uniStatus === "rejected" ? "rgba(255,77,109,0.08)" : "rgba(245,166,35,0.08)", border: `1px solid ${uniStatus === "approved" ? "rgba(0,230,180,0.2)" : uniStatus === "rejected" ? "rgba(255,77,109,0.2)" : "rgba(245,166,35,0.2)"}` }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: uniStatus === "approved" ? "#00e6b4" : uniStatus === "rejected" ? "#ff4d6d" : "#f5a623", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: uniStatus === "approved" ? "#00e6b4" : uniStatus === "rejected" ? "#ff4d6d" : "#f5a623", fontFamily: "'DM Mono',monospace" }}>
            {uniStatus === "approved" ? "Approved — Active" : uniStatus === "rejected" ? "Application Declined" : "Pending Admin Approval"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ to, icon, label }) => {
          const active = location.pathname === to || (to !== "/university" && location.pathname.startsWith(to));
          const locked = uniStatus !== "approved" && (to === "/university/issue" || to === "/university/certificates");
          return (
            <Link key={to} to={locked ? "/university" : to} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 9, textDecoration: "none", transition: "all 0.15s",
              background: active ? "rgba(0,230,180,0.08)" : "transparent",
              color: locked ? "rgba(255,255,255,0.2)" : active ? "#00e6b4" : "rgba(255,255,255,0.45)",
              fontSize: 13, fontWeight: active ? 600 : 400,
              border: active ? "1px solid rgba(0,230,180,0.15)" : "1px solid transparent",
              cursor: locked ? "not-allowed" : "pointer"
            }} onClick={e => locked && e.preventDefault()}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span>{label}</span>
              {locked && <span style={{ marginLeft: "auto", fontSize: 12 }}>🔒</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => { logout(); navigate("/"); }} style={{
          width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans',sans-serif"
        }}>
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Status banner (shown when not approved) ──────────────────────────────────
function StatusBanner({ status }) {
  if (status === "approved") return null;

  if (status === "rejected") return (
    <div style={{ background: "rgba(255,77,109,0.06)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 14, padding: "24px 28px", margin: "32px 36px" }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>❌</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#ff4d6d", marginBottom: 8 }}>Application Declined</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 500 }}>
        Your university registration was declined by the admin. This may be due to incomplete information or verification issues. Please contact the system administrator for more details.
      </div>
      <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)" }}>
        Contact admin to re-apply or appeal the decision
      </div>
    </div>
  );

  return (
    <div style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 14, padding: "28px", margin: "32px 36px" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Animated pending icon */}
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,166,35,0.1)", border: "2px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, animation: "pulse 2s ease infinite" }}>
          ⏳
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#f5a623", marginBottom: 8 }}>
            Awaiting Admin Approval
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 16 }}>
            Your university registration has been submitted successfully. The system admin will review your application and approve or decline it. You will be able to issue blockchain certificates once approved.
          </div>
          {/* Progress steps */}
          <div style={{ display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap" }}>
            {[
              ["✓", "Registered",   true,  "#00e6b4"],
              ["→", "",             false, "rgba(255,255,255,0.1)"],
              ["⏳", "Under Review", true,  "#f5a623"],
              ["→", "",             false, "rgba(255,255,255,0.1)"],
              ["○", "Approved",     false, "rgba(255,255,255,0.2)"],
              ["→", "",             false, "rgba(255,255,255,0.1)"],
              ["○", "Issue Certs",  false, "rgba(255,255,255,0.2)"],
            ].map(([icon, label, active, color], i) => (
              label ? (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: active ? `${color}20` : "rgba(255,255,255,0.04)", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: 9, color: active ? color : "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{label}</div>
                </div>
              ) : (
                <div key={i} style={{ width: 24, height: 2, background: color, margin: "0 2px 16px" }} />
              )
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}`}</style>
    </div>
  );
}

// ─── Issue Certificate form ───────────────────────────────────────────────────
function IssueCertificate({ uniStatus }) {
  const [form,    setForm]    = useState({ recipientName:"", recipientEmail:"", courseName:"", grade:"", issueDate:"", expiryDate:"", skills:"" });
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [issued,  setIssued]  = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: f => { if (f[0]) setFile(f[0]); },
    accept: { "application/pdf": [".pdf"] }, maxFiles: 1
  });

  if (uniStatus !== "approved") return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 14, padding: "32px", textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#f5a623", marginBottom: 8 }}>Approval Required</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          You cannot issue certificates until your university is approved by the admin. Please wait for approval notification.
        </div>
      </div>
    </div>
  );

  if (issued) return (
    <div style={{ padding: "32px 36px", maxWidth: 580 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,230,180,0.1)", border: "2px solid rgba(0,230,180,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>✓</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#00e6b4" }}>Certificate Issued!</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Stored on blockchain & IPFS</div>
      </div>
      <div style={{ background: "rgba(0,230,180,0.04)", border: "1px solid rgba(0,230,180,0.12)", borderRadius: 13, padding: 20, marginBottom: 18 }}>
        {[["Certificate ID",issued.certId],["Recipient",issued.recipientName],["Course",issued.courseName],["TX Hash",issued.txHash||"Pending…"],["IPFS Hash",issued.ipfsHash||"Pending…"]].map(([k,v])=>(
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", gap: 12 }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace", flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize:11, color:"#00e6b4", fontFamily:"'DM Mono',monospace", wordBreak:"break-all", textAlign:"right" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>{setIssued(null);setForm({recipientName:"",recipientEmail:"",courseName:"",grade:"",issueDate:"",expiryDate:"",skills:""});setFile(null);}} style={{ flex:1, padding:"12px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
          Issue Another
        </button>
        <Link to="/university/certificates" style={{ flex:1, padding:"12px", borderRadius:10, border:"1px solid rgba(0,230,180,0.2)", color:"#e8f0fe", fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>
          View All
        </Link>
      </div>
    </div>
  );

  const submit = async e => {
    e.preventDefault();
    if (!file) { toast.error("PDF certificate required"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("certificate", file);
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, k==="skills" ? JSON.stringify(v.split(",").map(s=>s.trim()).filter(Boolean)) : v); });
     const { data } = await api.post("/university/certificates/issue", fd);
setIssued(data.certificate);
      setIssued(data.certificate);
      toast.success("Certificate issued on blockchain! ✓");
    } catch (err) { toast.error(err.response?.data?.error || "Issuance failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>◈ Issue</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0 }}>Issue Certificate</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Upload PDF → fill details → hash stored on blockchain permanently.</p>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* PDF Drop */}
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Certificate PDF *</div>
          <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? "rgba(0,230,180,0.6)" : file ? "rgba(0,230,180,0.35)" : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: isDragActive || file ? "rgba(0,230,180,0.03)" : "transparent", transition: "all .2s" }}>
            <input {...getInputProps()} />
            {file ? (
              <><div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#00e6b4" }}>{file.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{(file.size/1024).toFixed(1)} KB · Click to replace</div></>
            ) : (
              <><div style={{ fontSize: 28, marginBottom: 8 }}>⬆</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Drop certificate PDF here or click to browse</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>PDF only · max 10 MB</div></>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            ["Recipient Full Name *", "recipientName", "text",  "Dr. Aryan Sharma",    false],
            ["Recipient Email *",     "recipientEmail","email", "student@uni.edu",      false],
            ["Course / Programme *",  "courseName",    "text",  "Blockchain Dev",       true ],
            ["Grade *",               "grade",         "text",  "A+",                   false],
            ["Issue Date *",          "issueDate",     "date",  "",                     false],
            ["Expiry Date",           "expiryDate",    "date",  "",                     false],
            ["Skills (comma-sep.)",   "skills",        "text",  "Solidity, Web3, DeFi", true ],
          ].map(([label, key, type, ph, full]) => (
            <div key={key} style={full ? { gridColumn: "1/-1" } : {}}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 5, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={ph} required={label.includes("*")}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e8f0fe", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,230,180,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(0,120,255,0.05)", border: "1px solid rgba(0,120,255,0.12)", borderRadius: 10, padding: "11px 15px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          ℹ️ SHA-256 hash computed from PDF → uploaded to IPFS via Pinata → stored on Polygon blockchain
        </div>

        <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#00e6b4,#0078ff)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 0 24px rgba(0,230,180,0.2)" }}>
          {loading ? "⏳ Issuing on Blockchain…" : "⛓ Issue Certificate on Blockchain"}
        </button>
      </form>
    </div>
  );
}

// ─── Certificates list ────────────────────────────────────────────────────────
function CertificatesList({ uniStatus }) {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = async () => {
    try { const { data } = await api.get("/university/certificates?limit=50"); setCerts(data.certificates); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const revoke = async (certId) => {
    const reason = prompt("Reason for revocation:");
    if (reason === null) return;
    try { await api.patch(`/university/certificates/${certId}/revoke`, { reason }); toast.success("Revoked"); load(); }
    catch (err) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const filtered = certs.filter(c => !search || c.recipientName.toLowerCase().includes(search.toLowerCase()) || c.certId.toLowerCase().includes(search.toLowerCase()));

  if (uniStatus !== "approved") return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 14, padding: "32px", textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#f5a623" }}>Approval Required</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.7 }}>No certificates yet. Get approved first to start issuing certificates.</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>◈ Records</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", margin: 0 }}>My Certificates</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none", width: 200 }} />
          <Link to="/university/issue" style={{ padding: "9px 18px", borderRadius: 9, background: "linear-gradient(135deg,#00e6b4,#0078ff)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            + Issue New
          </Link>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.2fr 1fr 1fr", gap: 12, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span>Recipient</span><span>Course</span><span>Grade</span><span>Issued</span><span>Status</span><span>Actions</span>
        </div>

        {loading ? <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>Loading…</div> :
         filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No certificates yet</div>
          </div>
        ) : filtered.map(c => (
          <div key={c._id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.2fr 1fr 1fr", gap: 12, padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e8f0fe", marginBottom: 2 }}>{c.recipientName}</div>
              <div style={{ fontSize: 10, color: "rgba(0,230,180,0.5)", fontFamily: "'DM Mono',monospace", cursor: "pointer" }} onClick={() => { copyText(c.certId); toast.success("ID copied"); }}>
                {truncateHash(c.certId, 14, 4)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{c.courseName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.grade}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{fmtDate(c.issueDate)}</div>
            <div>
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, fontFamily: "'DM Mono',monospace", background: c.status === "issued" ? "rgba(0,230,180,0.08)" : c.status === "revoked" ? "rgba(255,77,109,0.08)" : "rgba(120,120,180,0.1)", color: c.status === "issued" ? "#00e6b4" : c.status === "revoked" ? "#ff4d6d" : "#9090c0", border: `1px solid ${c.status === "issued" ? "rgba(0,230,180,0.2)" : c.status === "revoked" ? "rgba(255,77,109,0.2)" : "rgba(120,120,180,0.2)"}` }}>
                {c.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Link to={`/verify/${c.certId}`} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 5, border: "1px solid rgba(0,230,180,0.2)", color: "#00e6b4", textDecoration: "none" }}>View</Link>
              {c.status === "issued" && (
                <button onClick={() => revoke(c.certId)} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 5, border: "1px solid rgba(255,77,109,0.2)", background: "rgba(255,77,109,0.05)", color: "#ff4d6d", cursor: "pointer" }}>Revoke</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard home ───────────────────────────────────────────────────────────
function DashboardHome({ uniStatus, stats }) {
  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>◈ University</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0 }}>Dashboard</h1>
      </div>

      {uniStatus !== "approved" ? (
        <StatusBanner status={uniStatus} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              ["📜", "Issued",  stats?.issued,  "#00e6b4"],
              ["⏳", "Pending", stats?.pending, "#9090c0"],
              ["🚫", "Revoked", stats?.revoked, "#ff4d6d"],
              ["🗂", "Total",   stats?.total,   "#a855f7"],
            ].map(([icon, label, value, color]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono',monospace" }}>{label}</div>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color }}>{value ?? 0}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(0,230,180,0.05),rgba(0,120,255,0.04))", border: "1px solid rgba(0,230,180,0.12)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 4 }}>Ready to issue a certificate?</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Upload PDF → Generate hash → Store on blockchain</div>
            </div>
            <Link to="/university/issue" style={{ padding: "11px 22px", borderRadius: 10, background: "linear-gradient(135deg,#00e6b4,#0078ff)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 0 20px rgba(0,230,180,0.2)", whiteSpace: "nowrap" }}>
              + Issue Certificate
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function UniversityApp() {
  const { user } = useAuth();
  const [uniData, setUniData] = useState(null);
  const [loadingUni, setLoadingUni] = useState(true);
  const [stats,   setStats]   = useState(null);

  useEffect(() => {
    // Load university info
    if (user?.universityId) {
      api.get("/university/stats").then(({ data }) => setStats(data.stats)).catch(() => {});
    }
    // Check approval status via user's university
    api.get("/auth/me").then(({ data }) => {
      if (data.user?.universityId) {
        setUniData(data.user.universityId);
      }
    }).catch(() => {});
  }, []);

  // Determine status
  const uniStatus = uniData?.isApproved ? "approved" : uniData?.rejectedAt ? "rejected" : "pending";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060b14", color: "#e8f0fe" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <Sidebar uniStatus={uniStatus} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Routes>
          <Route index                  element={<DashboardHome uniStatus={uniStatus} stats={stats} />} />
          <Route path="issue"           element={<IssueCertificate uniStatus={uniStatus} />} />
          <Route path="certificates"    element={<CertificatesList uniStatus={uniStatus} />} />
        </Routes>
      </main>
    </div>
  );
}

// Need Routes import
import { Routes, Route } from "react-router-dom";