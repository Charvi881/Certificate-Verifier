import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";

const INIT = { recipientName:"", recipientEmail:"", courseName:"", grade:"", issueDate:"", expiryDate:"", skills:"" };

export default function IssueCertificate() {
  const [form,    setForm]    = useState(INIT);
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [issued,  setIssued]  = useState(null);
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const onDrop = useCallback(accepted => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1
  });

  const submit = async (e) => {
  e.preventDefault();
  console.log("SUBMIT START");

  if (!file) {
    toast.error("PDF certificate is required");
    return;
  }

  setLoading(true);

  try {
    console.log("BEFORE API CALL");

    const fd = new FormData();
    fd.append("certificate", file);

    Object.entries(form).forEach(([k, v]) => {
      if (v) {
        fd.append(
          k,
          k === "skills"
            ? JSON.stringify(v.split(",").map(s => s.trim()).filter(Boolean))
            : v
        );
      }
    });

    const { data } = await api.post(
      "/university/certificates/issue",
      fd
    );

    console.log("AFTER API CALL", data);

    setIssued(data.certificate);
    toast.success("Certificate issued ✓");

  } catch (err) {
    console.log("ERROR:", err);
    toast.error(err.response?.data?.error || err.message);
  } finally {
    setLoading(false);
  }
};

  if (issued) return (
    <DashboardLayout>
      <div style={{ padding:"40px 36px", maxWidth:600 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(0,230,180,0.1)", border:"2px solid rgba(0,230,180,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>✓</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#00e6b4", margin:"0 0 6px" }}>Certificate Issued!</h2>
          <p style={{ fontSize:13, color:"rgba(232,240,254,0.4)", margin:0 }}>Blockchain hash stored. IPFS document pinned.</p>
        </div>
        <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.12)", borderRadius:14, padding:22, marginBottom:20 }}>
          {[["Certificate ID",issued.certId],["Recipient",issued.recipientName],["Course",issued.courseName],["TX Hash",issued.txHash||"Pending…"],["IPFS Hash",issued.ipfsHash||"Pending…"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize:11, color:"rgba(232,240,254,0.35)", fontFamily:"'DM Mono',monospace" }}>{k}</span>
              <span style={{ fontSize:11, color:"#00e6b4", fontFamily:"'DM Mono',monospace", maxWidth:260, wordBreak:"break-all", textAlign:"right" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => { setIssued(null); setForm(INIT); setFile(null); }} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
            Issue Another
          </button>
          <Link to="/university/certificates" style={{ flex:1, padding:"11px", borderRadius:10, border:"1px solid rgba(0,230,180,0.2)", color:"#e8f0fe", fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>
            View All
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ padding:"32px 36px", maxWidth:720 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>◈ University Module</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#fff", margin:0 }}>Issue Certificate</h1>
          <p style={{ fontSize:13, color:"rgba(232,240,254,0.4)", marginTop:4, marginBottom:0 }}>Upload the PDF + fill details. SHA-256 hash is generated and anchored to the blockchain.</p>
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* PDF Drop */}
          <div>
            <div style={{ fontSize:11, color:"rgba(232,240,254,0.4)", marginBottom:8, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Certificate PDF *</div>
            <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?"rgba(0,230,180,0.6)":file?"rgba(0,230,180,0.35)":"rgba(0,230,180,0.15)"}`, borderRadius:12, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:isDragActive?"rgba(0,230,180,0.04)":file?"rgba(0,230,180,0.03)":"transparent", transition:"all .2s" }}>
              <input {...getInputProps()} />
              {file ? (
                <>
                  <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#00e6b4", marginBottom:3 }}>{file.name}</div>
                  <div style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>{(file.size/1024).toFixed(1)} KB · Click to replace</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:28, marginBottom:8 }}>⬆</div>
                  <div style={{ fontSize:14, color:"rgba(232,240,254,0.6)", marginBottom:3 }}>Drop PDF here or click to browse</div>
                  <div style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>PDF only · max 10 MB</div>
                </>
              )}
            </div>
          </div>

          {/* Two-column fields */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Recipient Full Name *"  value={form.recipientName}  onChange={set("recipientName")}  placeholder="Dr. Aryan Sharma"       required />
            <Field label="Recipient Email *"      type="email" value={form.recipientEmail} onChange={set("recipientEmail")} placeholder="student@uni.edu" required />
            <Field label="Course / Programme *"   value={form.courseName}     onChange={set("courseName")}     placeholder="Blockchain Development"  required style={{ gridColumn:"1/-1" }} />
            <Field label="Grade Awarded *"        value={form.grade}          onChange={set("grade")}          placeholder="A+"                      required />
            <Field label="Issue Date *"           type="date" value={form.issueDate} onChange={set("issueDate")} required />
            <Field label="Expiry Date"            type="date" value={form.expiryDate} onChange={set("expiryDate")} />
            <Field label="Skills (comma-separated)" value={form.skills}       onChange={set("skills")}         placeholder="Solidity, Web3, DeFi"    style={{ gridColumn:"1/-1" }} />
          </div>

          {/* Info box */}
          <div style={{ background:"rgba(0,120,255,0.05)", border:"1px solid rgba(0,120,255,0.15)", borderRadius:10, padding:"12px 16px", fontSize:12, color:"rgba(232,240,254,0.5)", lineHeight:1.7 }}>
            ℹ️  Upon submission: SHA-256 hash of the PDF is computed locally → document is pinned to IPFS via Pinata → hash is stored on the Polygon blockchain via the CertificateRegistry smart contract.
          </div>

          <button type="submit" disabled={loading} style={{ padding:"14px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1, boxShadow:"0 0 24px rgba(0,230,180,0.2)" }}>
            {loading ? "⏳ Issuing on Blockchain…" : "⛓ Issue Certificate on Blockchain"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, style: extraStyle, ...props }) {
  return (
    <div style={extraStyle}>
      <div style={{ fontSize:10, color:"rgba(232,240,254,0.4)", marginBottom:5, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
      <input className="input-field" {...props} />
    </div>
  );
}
