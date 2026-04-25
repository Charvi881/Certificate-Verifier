import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import api from "../utils/api";
import { sha256File, truncateHash, fmtDate, copyText, STATUS_META } from "../utils/helpers";
import toast from "react-hot-toast";

const STEPS = [
  { icon:"⛓", label:"Connecting to blockchain network" },
  { icon:"🔍", label:"Locating certificate record" },
  { icon:"📦", label:"Fetching on-chain data" },
  { icon:"🔐", label:"Verifying cryptographic signature" },
  { icon:"✅", label:"Consensus confirmed" },
];

export default function VerifyPage() {
  const { certId: paramId } = useParams();
  const [mode,   setMode]   = useState("upload"); // upload | id
  const [certId, setCertId] = useState(paramId || "");
  const [file,   setFile]   = useState(null);
  const [phase,  setPhase]  = useState("idle");  // idle | hashing | verifying | done
  const [step,   setStep]   = useState(0);
  const [result, setResult] = useState(null);

  // Auto-verify if certId param present
  useEffect(() => { if (paramId) { setMode("id"); verifyById(paramId); } }, []);

  const onDrop = useCallback(accepted => {
    if (accepted[0]) { setFile(accepted[0]); setResult(null); }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1 });

  async function runSteps() {
    setPhase("verifying"); setStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 650));
    }
  }

  async function verifyByUpload() {
    if (!file) { toast.error("Please select a PDF"); return; }
    setPhase("hashing");
    try {
      const hash = await sha256File(file);
      await runSteps();
      const form = new FormData();
      form.append("certificate", file);
      const { data } = await api.post("/verifier/verify/upload", form);
      setResult({ ...data, localHash: hash });
      setPhase("done");
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed");
      setPhase("idle");
    }
  }

  async function verifyById(id = certId) {
    if (!id.trim()) { toast.error("Enter a certificate ID"); return; }
    await runSteps();
    try {
      const { data } = await api.get(`/verifier/verify/${id.trim()}`);
      setResult(data);
      setPhase("done");
    } catch (err) {
      setResult({ status: "NOT_FOUND", valid: false });
      setPhase("done");
    }
  }

  const reset = () => { setPhase("idle"); setResult(null); setFile(null); };
  const meta  = result ? (STATUS_META[result.status] || STATUS_META.NOT_FOUND) : null;
  const cert  = result?.certificate;

  return (
    <div style={{ minHeight:"100vh", background:"#060b14", color:"#e8f0fe", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        .fu{animation:fadeUp .55s ease both}
        .spin{animation:spin 1s linear infinite}
        .step-row{animation:slideIn .35s ease both}
        .dropzone{transition:all .2s}
        .dropzone:hover{border-color:rgba(0,230,180,0.45)!important;background:rgba(0,230,180,0.04)!important}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(0,230,180,0.08)", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#00e6b4,#0078ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🔐</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>Secured<span style={{ color:"#00e6b4" }}>Trust</span></span>
        </Link>
        <Link to="/login" style={{ fontSize:12, color:"rgba(232,240,254,0.35)", textDecoration:"none" }}>Sign In →</Link>
      </div>

      <div style={{ maxWidth:740, margin:"0 auto", padding:"40px 20px 60px" }}>
        <div className="fu" style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.6)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>◈ Blockchain Verification</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(24px,5vw,40px)", margin:"0 0 10px", color:"#fff" }}>
            Verify a Certificate
          </h1>
          <p style={{ fontSize:14, color:"rgba(232,240,254,0.4)", margin:0 }}>Upload the original PDF or enter a certificate ID for instant on-chain verification.</p>
        </div>

        {/* Mode tabs */}
        {phase === "idle" && (
          <div className="fu" style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(12,18,32,0.8)", border:"1px solid rgba(0,230,180,0.1)", borderRadius:12, padding:5 }}>
            {[["upload","📄  Upload PDF"],["id","🔑  Certificate ID"]].map(([m,l]) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"9px", borderRadius:9, border:"none", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:12, transition:"all .2s", background: mode===m ? "rgba(0,230,180,0.1)" : "transparent", color: mode===m ? "#00e6b4" : "rgba(232,240,254,0.4)", borderColor: mode===m ? "rgba(0,230,180,0.25)" : "transparent" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Upload mode */}
        {phase === "idle" && mode === "upload" && (
          <div className="fu">
            <div {...getRootProps()} className="dropzone" style={{ border:`2px dashed ${isDragActive ? "rgba(0,230,180,0.6)" : "rgba(0,230,180,0.18)"}`, borderRadius:16, padding:"44px 24px", textAlign:"center", cursor:"pointer", background: isDragActive ? "rgba(0,230,180,0.05)" : "transparent" }}>
              <input {...getInputProps()} />
              <div style={{ fontSize:40, marginBottom:12 }}>{file ? "📄" : "⬆"}</div>
              {file ? (
                <>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#00e6b4", marginBottom:4 }}>{file.name}</div>
                  <div style={{ fontSize:11, color:"rgba(232,240,254,0.3)" }}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#fff", marginBottom:6 }}>Drop your certificate PDF here</div>
                  <div style={{ fontSize:12, color:"rgba(232,240,254,0.35)" }}>or click to browse · PDF only · max 10 MB</div>
                </>
              )}
            </div>
            {file && (
              <button onClick={verifyByUpload} style={{ width:"100%", marginTop:14, padding:"14px", borderRadius:12, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, boxShadow:"0 0 24px rgba(0,230,180,0.25)" }}>
                Verify on Blockchain →
              </button>
            )}
          </div>
        )}

        {/* ID mode */}
        {phase === "idle" && mode === "id" && (
          <div className="fu" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input className="input-field" value={certId} onChange={e => setCertId(e.target.value)} onKeyDown={e => e.key==="Enter" && verifyById()} placeholder="e.g. SC-2024-001-ETH" style={{ fontSize:14 }} />
            <button onClick={() => verifyById()} style={{ padding:"14px", borderRadius:12, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15 }}>
              Verify by ID →
            </button>
          </div>
        )}

        {/* Verification animation */}
        {(phase === "hashing" || phase === "verifying") && (
          <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.12)", borderRadius:16, padding:36, textAlign:"center" }} className="fu">
            <div style={{ width:60, height:60, border:"3px solid rgba(0,230,180,0.15)", borderTop:"3px solid #00e6b4", borderRadius:"50%", margin:"0 auto 20px" }} className="spin" />
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#fff", marginBottom:4 }}>
              {phase==="hashing" ? "Computing SHA-256 Hash…" : "Querying Blockchain…"}
            </div>
            <div style={{ fontSize:12, color:"rgba(232,240,254,0.35)", marginBottom:28 }}>Scanning distributed ledger nodes</div>
            <div style={{ textAlign:"left", maxWidth:340, margin:"0 auto", display:"flex", flexDirection:"column", gap:10 }}>
              {STEPS.map((s,i) => {
                const done = i < step, active = i === step;
                return (
                  <div key={i} className={i<=step?"step-row":""} style={{ animationDelay:`${i*.04}s`, display:"flex", alignItems:"center", gap:12, opacity:i>step?.2:1 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${done||active?"#00e6b4":"rgba(255,255,255,0.1)"}`, background:done?"#00e6b4":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0, color:done?"#060b14":"#00e6b4", transition:"all .25s" }}>
                      {done ? "✓" : active ? <span className="spin" style={{ display:"block", width:9, height:9, border:"2px solid transparent", borderTop:"2px solid #00e6b4", borderRadius:"50%" }} /> : i+1}
                    </div>
                    <span style={{ fontSize:13, color:done?"#00e6b4":active?"#fff":"rgba(232,240,254,0.35)" }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <div style={{ animation:"fadeUp .6s ease both" }}>
            {/* Status banner */}
            <div style={{ background:meta.bg, border:`1px solid ${meta.color}35`, borderRadius:14, padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:`${meta.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:meta.color, fontWeight:700 }}>{meta.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:meta.color }}>{meta.label}</div>
                  <div style={{ fontSize:12, color:"rgba(232,240,254,0.4)" }}>
                    {result.status==="VERIFIED" ? "Certificate is authentic and currently valid" : result.status==="EXPIRED" ? "Certificate was valid but has expired" : result.status==="REVOKED" ? "Certificate has been revoked by the issuer" : "No matching record found on any blockchain network"}
                  </div>
                </div>
              </div>
              <button onClick={reset} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(232,240,254,0.5)", fontSize:12, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
                ← New Search
              </button>
            </div>

            {cert && (
              <>
                {/* Certificate details */}
                <div style={{ background:"rgba(12,18,32,0.9)", border:`1px solid ${meta.color}20`, borderRadius:16, padding:24, marginBottom:14 }}>
                  <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Certificate of Completion</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(18px,3vw,26px)", color:"#fff", marginBottom:2 }}>{cert.recipientName}</div>
                  <div style={{ fontSize:13, color:"rgba(232,240,254,0.4)", marginBottom:16 }}>has successfully completed</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:"#00e6b4", marginBottom:20 }}>{cert.courseName}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
                    {[
                      ["Issued By",    cert.university?.name || "—"],
                      ["Grade",        cert.grade],
                      ["Issue Date",   fmtDate(cert.issueDate)],
                      ["Expiry Date",  fmtDate(cert.expiryDate)],
                      ["Network",      cert.network || "—"],
                      ["Verified",     result.verifications?.toLocaleString() + "×" || "—"],
                    ].map(([k,v]) => (
                      <div key={k} style={{ background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"rgba(232,240,254,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3, fontFamily:"'DM Mono',monospace" }}>{k}</div>
                        <div style={{ fontSize:12, color:"#e8f0fe" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {cert.skills?.length > 0 && (
                    <div style={{ marginTop:16, display:"flex", flexWrap:"wrap", gap:6 }}>
                      {cert.skills.map(s => <span key={s} style={{ display:"inline-flex", padding:"3px 10px", borderRadius:4, background:"rgba(0,230,180,0.07)", border:"1px solid rgba(0,230,180,0.15)", fontSize:11, color:"#00e6b4", fontFamily:"'DM Mono',monospace" }}>{s}</span>)}
                    </div>
                  )}
                </div>

                {/* On-chain proof */}
                <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid rgba(0,230,180,0.07)", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"11px 18px", borderBottom:"1px solid rgba(0,230,180,0.06)", fontSize:11, color:"rgba(0,230,180,0.55)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.1em" }}>⛓ On-Chain Proof</div>
                  {[
                    ["Certificate ID", cert.certId],
                    ["TX Hash",        cert.txHash],
                    ["IPFS Hash",      cert.ipfsHash],
                    ["Block #",        cert.blockNumber],
                  ].filter(([,v]) => v).map(([k,v]) => (
                    <HashRow key={k} label={k} value={String(v)} />
                  ))}
                  {result.localHash && <HashRow label="Uploaded SHA-256" value={result.localHash} />}
                </div>
              </>
            )}

            {result.status === "NOT_FOUND" && (
              <div style={{ textAlign:"center", padding:"32px 20px" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#fff", marginBottom:8 }}>No Record Found</div>
                <div style={{ fontSize:13, color:"rgba(232,240,254,0.4)", maxWidth:380, margin:"0 auto" }}>This document has no matching record on any supported blockchain. It may be tampered, counterfeit, or not registered.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HashRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await copyText(value); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div style={{ padding:"11px 18px", borderBottom:"1px solid rgba(255,255,255,0.02)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:11, color:"rgba(232,240,254,0.3)", minWidth:100, fontFamily:"'DM Mono',monospace" }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, justifyContent:"flex-end" }}>
        <code style={{ fontSize:11, color:"#00e6b4", background:"rgba(0,230,180,0.05)", padding:"2px 8px", borderRadius:4, fontFamily:"'DM Mono',monospace" }}>{truncateHash(value)}</code>
        <button onClick={copy} style={{ background:"transparent", border:"none", cursor:"pointer", color:"rgba(0,230,180,0.6)", fontSize:13, padding:"3px 6px", borderRadius:4 }}>{copied?"✓":"⎘"}</button>
      </div>
    </div>
  );
}
