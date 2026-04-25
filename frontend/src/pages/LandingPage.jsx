import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

function ParticleBg() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let raf;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35, r: Math.random()*1.5+.5
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width)  p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,230,180,0.35)"; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y, d = Math.hypot(dx,dy);
        if (d < 110) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle = `rgba(0,230,180,${.12*(1-d/110)})`; ctx.lineWidth=.7; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

const FEATURES = [
  { icon: "⛓", title: "On-Chain Immutability",   desc: "Every certificate hash is permanently stored on Ethereum / Polygon — impossible to alter." },
  { icon: "🔐", title: "Cryptographic Integrity", desc: "SHA-256 fingerprinting ensures any document modification is instantly detected." },
  { icon: "🌐", title: "Decentralised Storage",   desc: "Full documents pinned to IPFS via Pinata for censorship-resistant, permanent access." },
  { icon: "⚡", title: "Instant Verification",    desc: "Upload a PDF and get a definitive answer in seconds — no human in the loop." },
  { icon: "🔏", title: "Revocation Support",      desc: "Universities can revoke certificates on-chain; verifiers always see current status." },
  { icon: "🏛", title: "Multi-Institution",       desc: "Governed admin layer approves and manages universities across the network." },
];

const STEPS = [
  { n:"01", role:"University", color:"#00e6b4", title:"Upload & Issue",  desc:"Upload the certificate PDF. System generates SHA-256 hash, pins to IPFS, stores hash on blockchain." },
  { n:"02", role:"Blockchain", color:"#0078ff", title:"Hash Stored",     desc:"The immutable ledger records the certificate ID, cryptographic hash, and issuer wallet address." },
  { n:"03", role:"Verifier",   color:"#a855f7", title:"Upload & Verify", desc:"Anyone uploads the certificate. System regenerates the hash and compares with the blockchain record." },
];

export default function LandingPage() {
  return (
    <div style={{ background:"#060b14", color:"#e8f0fe", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .65s ease both; }
        .fu1{animation-delay:.1s} .fu2{animation-delay:.2s} .fu3{animation-delay:.3s}
        .fcard:hover { border-color: rgba(0,230,180,0.3)!important; transform:translateY(-3px); }
        .fcard { transition: all .25s; }
      `}</style>

      {/* Nav */}
      <nav style={{ position:"sticky", top:0, zIndex:50, backdropFilter:"blur(16px)", background:"rgba(6,11,20,0.85)", borderBottom:"1px solid rgba(0,230,180,0.08)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:"linear-gradient(135deg,#00e6b4,#0078ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🔐</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:"#fff" }}>Secured<span style={{ color:"#00e6b4" }}>Trust</span></span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link to="/verify" style={{ padding:"8px 16px", borderRadius:8, fontSize:13, color:"rgba(232,240,254,0.6)", textDecoration:"none", transition:"color .2s" }}>Verify</Link>
            <Link to="/login"  style={{ padding:"8px 16px", borderRadius:8, fontSize:13, border:"1px solid rgba(0,230,180,0.2)", color:"#00e6b4", textDecoration:"none" }}>Sign In</Link>
            <Link to="/register" style={{ padding:"8px 16px", borderRadius:8, fontSize:13, background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontWeight:700, textDecoration:"none" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"88vh", display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", top:"-25%", left:"-10%", width:"55%", height:"55%", background:"radial-gradient(ellipse,rgba(0,230,180,0.07) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-20%", right:"-5%",  width:"50%", height:"50%", background:"radial-gradient(ellipse,rgba(0,120,255,0.06) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
        <ParticleBg />
        <div style={{ position:"relative", zIndex:2, maxWidth:1100, margin:"0 auto", padding:"80px 24px", textAlign:"center" }}>
          <div className="fu" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(0,230,180,0.07)", border:"1px solid rgba(0,230,180,0.18)", borderRadius:20, padding:"6px 16px", fontSize:12, color:"#00e6b4", fontFamily:"'DM Mono',monospace", marginBottom:28 }}>
            ⛓ Powered by Ethereum · Polygon · IPFS
          </div>
          <h1 className="fu fu1" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(36px,6vw,68px)", lineHeight:1.08, letterSpacing:"-1.5px", color:"#fff", margin:"0 0 20px" }}>
            Certificates You Can<br />
            <span style={{ background:"linear-gradient(90deg,#00e6b4,#0078ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Trust Forever</span>
          </h1>
          <p className="fu fu2" style={{ fontSize:"clamp(15px,2vw,18px)", color:"rgba(232,240,254,0.5)", maxWidth:560, margin:"0 auto 36px", lineHeight:1.7 }}>
            SecuredTrust anchors academic credentials to the blockchain. Tamper-proof issuance, instant verification, zero fraud.
          </p>
          <div className="fu fu3" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/verify" style={{ padding:"14px 28px", borderRadius:12, background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, textDecoration:"none", boxShadow:"0 0 28px rgba(0,230,180,0.3)" }}>
              Verify a Certificate →
            </Link>
            <Link to="/register" style={{ padding:"14px 28px", borderRadius:12, border:"1px solid rgba(0,230,180,0.2)", color:"#e8f0fe", fontSize:15, textDecoration:"none" }}>
              Issue Certificates
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display:"flex", justifyContent:"center", gap:48, marginTop:60, flexWrap:"wrap" }}>
            {[["12,847","Certificates Issued"],["3","Blockchain Networks"],["100%","Tamper-Proof"],["<2s","Verification Time"]].map(([n,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#00e6b4" }}>{n}</div>
                <div style={{ fontSize:11, color:"rgba(232,240,254,0.3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding:"80px 24px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.6)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>◈ How It Works</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(26px,4vw,40px)", color:"#fff", margin:0 }}>Three Steps to Trustless Verification</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ background:"rgba(12,18,32,0.8)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:16, padding:28, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:16, right:20, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:48, color:s.color, opacity:0.06 }}>{s.n}</div>
              <div style={{ display:"inline-flex", padding:"4px 10px", borderRadius:6, background:`${s.color}15`, border:`1px solid ${s.color}30`, fontSize:10, fontFamily:"'DM Mono',monospace", color:s.color, marginBottom:14 }}>{s.role}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#fff", margin:"0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize:13, color:"rgba(232,240,254,0.45)", lineHeight:1.7, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:"60px 24px 80px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"rgba(0,230,180,0.6)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>◈ Key Advantages</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(24px,4vw,38px)", color:"#fff", margin:0 }}>Built for the Future of Credentials</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="fcard" style={{ background:"rgba(12,18,32,0.7)", border:"1px solid rgba(0,230,180,0.08)", borderRadius:14, padding:"22px 22px" }}>
              <div style={{ fontSize:26, marginBottom:12 }}>{f.icon}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:"#fff", margin:"0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize:12, color:"rgba(232,240,254,0.4)", lineHeight:1.65, margin:0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"60px 24px 80px", textAlign:"center" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(0,230,180,0.06),rgba(0,120,255,0.06))", border:"1px solid rgba(0,230,180,0.12)", borderRadius:20, padding:"52px 32px", maxWidth:620, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(22px,4vw,34px)", color:"#fff", margin:"0 0 14px" }}>Start Verifying Today</h2>
          <p style={{ fontSize:14, color:"rgba(232,240,254,0.45)", margin:"0 0 28px", lineHeight:1.7 }}>Upload any certificate and get an instant blockchain-backed verification result. Free, open, and trustless.</p>
          <Link to="/verify" style={{ display:"inline-block", padding:"14px 32px", borderRadius:12, background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, textDecoration:"none", boxShadow:"0 0 32px rgba(0,230,180,0.3)" }}>
            Verify a Certificate Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid rgba(0,230,180,0.06)", padding:"24px", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"rgba(232,240,254,0.2)" }}>© 2024 SecuredTrust · Blockchain Certificate Verification · Powered by Ethereum, Polygon & IPFS</div>
      </footer>
    </div>
  );
}
