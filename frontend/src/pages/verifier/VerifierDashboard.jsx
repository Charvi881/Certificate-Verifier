import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useDropzone } from "react-dropzone";
import api from "../../utils/api";
import { sha256File, fmtDate, truncateHash, copyText, STATUS_META } from "../../utils/helpers";
import toast from "react-hot-toast";

const STEPS = [
  { label:"Connecting to blockchain network" },
  { label:"Locating certificate record" },
  { label:"Fetching on-chain data" },
  { label:"Verifying cryptographic signature" },
  { label:"Consensus confirmed" },
];

export default function VerifierDashboard() {
  const [mode,   setMode]   = useState("upload");
  const [certId, setCertId] = useState("");
  const [file,   setFile]   = useState(null);
  const [phase,  setPhase]  = useState("idle");
  const [step,   setStep]   = useState(0);
  const [result, setResult] = useState(null);

  const onDrop = (accepted) => { if (accepted[0]) { setFile(accepted[0]); setResult(null); } };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept:{"application/pdf":[".pdf"]}, maxFiles:1 });

  async function runSteps() {
    setPhase("verifying"); setStep(0);
    for (let i=0; i<STEPS.length; i++) { setStep(i); await new Promise(r=>setTimeout(r,640)); }
  }

  async function verifyUpload() {
    if (!file) { toast.error("Select a PDF"); return; }
    setPhase("hashing");
    try {
      await runSteps();
      const fd = new FormData(); fd.append("certificate", file);
      const { data } = await api.post("/verifier/verify/upload", fd);
      setResult(data); setPhase("done");
    } catch { toast.error("Verification error"); setPhase("idle"); }
  }

  async function verifyId() {
    if (!certId.trim()) { toast.error("Enter certificate ID"); return; }
    await runSteps();
    try {
      const { data } = await api.get(`/verifier/verify/${certId.trim()}`);
      setResult(data); setPhase("done");
    } catch {
      setResult({ status:"NOT_FOUND", valid:false }); setPhase("done");
    }
  }

  const reset = () => { setPhase("idle"); setResult(null); setFile(null); setCertId(""); };
  const meta  = result ? (STATUS_META[result.status] || STATUS_META.NOT_FOUND) : null;
  const cert  = result?.certificate;

  return (
    <DashboardLayout>
      <div style={{ padding:"32px 36px", maxWidth:740 }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>◈ Verifier Module</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#fff", margin:0 }}>Verify Certificate</h1>
          <p style={{ fontSize:13, color:"rgba(232,240,254,0.4)", marginTop:4 }}>Upload the original PDF or enter a certificate ID for instant blockchain verification.</p>
        </div>

        {/* Mode toggle */}
        {phase==="idle" && (
          <div style={{ display:"flex", gap:6, marginBottom:18, background:"rgba(12,18,32,0.8)", border:"1px solid rgba(0,230,180,0.1)", borderRadius:10, padding:4 }}>
            {[["upload","📄  Upload PDF"],["id","🔑  Certificate ID"]].map(([m,l]) => (
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"9px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:11, background:mode===m?"rgba(0,230,180,0.09)":"transparent", color:mode===m?"#00e6b4":"rgba(232,240,254,0.4)", transition:"all .15s" }}>{l}</button>
            ))}
          </div>
        )}

        {/* Upload mode */}
        {phase==="idle" && mode==="upload" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?"rgba(0,230,180,0.5)":file?"rgba(0,230,180,0.3)":"rgba(0,230,180,0.14)"}`, borderRadius:14, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:isDragActive||file?"rgba(0,230,180,0.03)":"transparent", transition:"all .2s" }}>
              <input {...getInputProps()} />
              {file ? (
                <><div style={{fontSize:32,marginBottom:8}}>📄</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#00e6b4"}}>{file.name}</div>
                <div style={{fontSize:11,color:"rgba(232,240,254,0.3)",marginTop:3}}>{(file.size/1024).toFixed(1)} KB · Click to replace</div></>
              ) : (
                <><div style={{fontSize:32,marginBottom:8}}>⬆</div>
                <div style={{fontSize:14,color:"rgba(232,240,254,0.55)",marginBottom:3}}>Drop the original certificate PDF here</div>
                <div style={{fontSize:11,color:"rgba(232,240,254,0.28)"}}>or click to browse · PDF only</div></>
              )}
            </div>
            {file && <button onClick={verifyUpload} style={{ padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 0 20px rgba(0,230,180,0.25)" }}>Verify on Blockchain →</button>}
          </div>
        )}

        {/* ID mode */}
        {phase==="idle" && mode==="id" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input className="input-field" value={certId} onChange={e=>setCertId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyId()} placeholder="e.g. SC-2024-001-ETH" />
            <button onClick={verifyId} style={{ padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Verify by ID →</button>
          </div>
        )}

        {/* Verifying spinner */}
        {(phase==="hashing"||phase==="verifying") && (
          <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.12)", borderRadius:16, padding:36, textAlign:"center" }}>
            <div style={{ width:56, height:56, border:"3px solid rgba(0,230,180,0.15)", borderTop:"3px solid #00e6b4", borderRadius:"50%", margin:"0 auto 18px", animation:"spin 1s linear infinite" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:"#fff", marginBottom:4 }}>
              {phase==="hashing"?"Computing SHA-256…":"Querying Blockchain…"}
            </div>
            <div style={{ fontSize:12, color:"rgba(232,240,254,0.3)", marginBottom:24 }}>Scanning distributed ledger nodes</div>
            <div style={{ textAlign:"left", maxWidth:320, margin:"0 auto", display:"flex", flexDirection:"column", gap:9 }}>
              {STEPS.map((s,i) => {
                const done=i<step, active=i===step;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, opacity:i>step?.2:1 }}>
                    <div style={{ width:26,height:26,borderRadius:"50%",border:`2px solid ${done||active?"#00e6b4":"rgba(255,255,255,0.1)"}`,background:done?"#00e6b4":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:done?"#060b14":"#00e6b4",flexShrink:0 }}>
                      {done?"✓":active?"…":i+1}
                    </div>
                    <span style={{ fontSize:12, color:done?"#00e6b4":active?"#fff":"rgba(232,240,254,0.35)" }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {phase==="done" && result && (
          <div>
            <div style={{ background:meta.bg, border:`1px solid ${meta.color}30`, borderRadius:13, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:`${meta.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:meta.color,fontWeight:700 }}>{meta.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:meta.color }}>{meta.label}</div>
                  <div style={{ fontSize:11, color:"rgba(232,240,254,0.4)" }}>
                    {result.status==="VERIFIED"?"Certificate is authentic and valid":result.status==="EXPIRED"?"Certificate is expired":result.status==="REVOKED"?"Revoked by issuing institution":"No record found on any blockchain"}
                  </div>
                </div>
              </div>
              <button onClick={reset} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.03)", color:"rgba(232,240,254,0.45)", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>← Reset</button>
            </div>

            {cert && (
              <div style={{ background:"rgba(12,18,32,0.9)", border:`1px solid ${meta.color}18`, borderRadius:14, padding:22 }}>
                <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", marginBottom:3 }}>Certificate Details</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#fff", marginBottom:1 }}>{cert.recipientName}</div>
                <div style={{ fontSize:12, color:"rgba(232,240,254,0.4)", marginBottom:14 }}>has successfully completed</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#00e6b4", marginBottom:18 }}>{cert.courseName}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8 }}>
                  {[["Issued By",cert.university?.name||"—"],["Grade",cert.grade],["Issue Date",fmtDate(cert.issueDate)],["Network",cert.network||"—"]].map(([k,v])=>(
                    <div key={k} style={{ background:"rgba(0,0,0,0.2)", borderRadius:7, padding:"9px 11px" }}>
                      <div style={{ fontSize:9, color:"rgba(232,240,254,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2, fontFamily:"'DM Mono',monospace" }}>{k}</div>
                      <div style={{ fontSize:11, color:"#e8f0fe" }}>{v}</div>
                    </div>
                  ))}
                </div>
                {[["TX Hash",cert.txHash],["IPFS",cert.ipfsHash]].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"rgba(0,0,0,0.2)", borderRadius:7 }}>
                    <span style={{ fontSize:10, color:"rgba(232,240,254,0.3)", fontFamily:"'DM Mono',monospace" }}>{k}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <code style={{ fontSize:10, color:"#00e6b4", fontFamily:"'DM Mono',monospace" }}>{truncateHash(v)}</code>
                      <button onClick={()=>{copyText(v);toast.success("Copied");}} style={{ background:"transparent", border:"none", cursor:"pointer", color:"rgba(0,230,180,0.5)", fontSize:11 }}>⎘</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
