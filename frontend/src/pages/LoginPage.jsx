// LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function LoginPage() {
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthPageWrapper title="Sign In" sub="Access your SecuredTrust dashboard">
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Email" type="email"     value={form.email}    onChange={set("email")}    placeholder="you@university.edu" />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
        <button type="submit" disabled={loading} style={{
          marginTop:4, padding:"13px", borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer",
          background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14",
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </form>
      <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"rgba(232,240,254,0.35)" }}>
        No account? <Link to="/register" style={{ color:"#00e6b4", textDecoration:"none" }}>Register</Link>
      </p>
    </AuthPageWrapper>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"verifier" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password min 8 characters"); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success("Account created!");
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthPageWrapper title="Create Account" sub="Join the SecuredTrust network">
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Full Name"  value={form.name}     onChange={set("name")}     placeholder="Dr. Aryan Sharma" />
        <Field label="Email"      type="email" value={form.email}    onChange={set("email")}    placeholder="you@university.edu" />
        <Field label="Password"   type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
        <div>
          <div style={{ fontSize:11, color:"rgba(232,240,254,0.4)", marginBottom:6, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>Role</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {["verifier","university"].map(r => (
              <button key={r} type="button" onClick={() => setForm(p=>({...p,role:r}))} style={{
                padding:"10px", borderRadius:10, border:`1px solid ${form.role===r ? "rgba(0,230,180,0.5)" : "rgba(0,230,180,0.12)"}`,
                background: form.role===r ? "rgba(0,230,180,0.08)" : "transparent",
                color: form.role===r ? "#00e6b4" : "rgba(232,240,254,0.4)",
                fontFamily:"'DM Mono',monospace", fontSize:12, cursor:"pointer", textTransform:"capitalize"
              }}>{r}</button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} style={{
          marginTop:4, padding:"13px", borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer",
          background:"linear-gradient(135deg,#00e6b4,#0078ff)", color:"#060b14",
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, opacity:loading?0.7:1
        }}>
          {loading ? "Creating…" : "Create Account →"}
        </button>
      </form>
      <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"rgba(232,240,254,0.35)" }}>
        Have an account? <Link to="/login" style={{ color:"#00e6b4", textDecoration:"none" }}>Sign in</Link>
      </p>
    </AuthPageWrapper>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function AuthPageWrapper({ title, sub, children }) {
  return (
    <div style={{ minHeight:"100vh", background:"#060b14", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ position:"absolute", top:"-10%", left:"20%", width:"40%", height:"40%", background:"radial-gradient(ellipse,rgba(0,230,180,0.05),transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#00e6b4,#0078ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, margin:"0 auto 14px", boxShadow:"0 0 24px rgba(0,230,180,0.35)" }}>🔐</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#fff", margin:"0 0 6px" }}>{title}</h1>
          <p style={{ fontSize:13, color:"rgba(232,240,254,0.35)", margin:0 }}>{sub}</p>
        </div>
        <div style={{ background:"rgba(12,18,32,0.9)", border:"1px solid rgba(0,230,180,0.1)", borderRadius:18, padding:28, backdropFilter:"blur(16px)" }}>
          {children}
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <Link to="/" style={{ fontSize:12, color:"rgba(232,240,254,0.25)", textDecoration:"none" }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <div style={{ fontSize:11, color:"rgba(232,240,254,0.4)", marginBottom:6, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
      <input className="input-field" {...props} />
    </div>
  );
}

export default LoginPage;
