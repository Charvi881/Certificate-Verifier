import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Email"    type="email"    value={form.email}    onChange={set("email")}    placeholder="you@email.com" />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
        <Btn loading={loading} label="Sign In →" loadingLabel="Signing in…" />
      </form>
      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        No account? <Link to="/register" style={{ color: "#00e6b4", textDecoration: "none" }}>Register</Link>
      </p>
    </AuthPageWrapper>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "verifier",
    universityName: "", shortName: "", location: "", website: ""
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password min 8 characters"); return; }
    if (form.role === "university" && !form.universityName.trim()) { toast.error("University name required"); return; }
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === "university") {
        toast("Registration submitted! Awaiting admin approval.", { icon: "⏳", duration: 5000 });
      } else {
        toast.success("Account created!");
      }
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthPageWrapper title="Create Account" sub="Join the SecuredTrust network">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Basic fields */}
        <Field label="Full Name" value={form.name}  onChange={set("name")}  placeholder="Dr. Aryan Sharma" />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" />

        {/* Role selector */}
        <div>
          <div style={labelStyle}>Role</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["verifier",   "🔍 Verifier",   "Verify certificates"],
              ["university", "🏛 University",  "Issue certificates"],
            ].map(([r, l, d]) => (
              <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))} style={{
                padding: "10px 12px", borderRadius: 10, textAlign: "left",
                border: `1px solid ${form.role === r ? "rgba(0,230,180,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: form.role === r ? "rgba(0,230,180,0.08)" : "rgba(255,255,255,0.02)",
                color: form.role === r ? "#00e6b4" : "rgba(255,255,255,0.4)",
                cursor: "pointer", transition: "all 0.15s"
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 10, opacity: 0.6, fontFamily: "'DM Mono',monospace" }}>{d}</div>
              </button>
            ))}
          </div>
        </div>

        {/* University-specific fields */}
        {form.role === "university" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "rgba(0,230,180,0.03)", border: "1px solid rgba(0,230,180,0.1)", borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(0,230,180,0.6)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              ◈ University Details
            </div>

            <Field label="University Full Name *" value={form.universityName} onChange={set("universityName")} placeholder="e.g. Uttarakhand University" required />
            <Field label="Short Name / Abbreviation" value={form.shortName} onChange={set("shortName")} placeholder="e.g. UU (auto-generated if blank)" />
            <Field label="Location" value={form.location} onChange={set("location")} placeholder="e.g. Dehradun, India" />
            <Field label="Website" value={form.website} onChange={set("website")} placeholder="https://university.edu" />

            <div style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "rgba(245,166,35,0.8)", lineHeight: 1.6 }}>
              ⚠️ Your university registration will be <strong>reviewed by admin</strong> before you can issue certificates. You will see the status in your dashboard.
            </div>
          </div>
        )}

        <Btn loading={loading} label="Create Account →" loadingLabel="Creating…" />
      </form>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        Have an account? <Link to="/login" style={{ color: "#00e6b4", textDecoration: "none" }}>Sign in</Link>
      </p>
    </AuthPageWrapper>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
const labelStyle = { fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" };

function Field({ label, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input {...props} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e8f0fe", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none", transition: "border-color 0.2s", ...(props.style || {}) }}
        onFocus={e => e.target.style.borderColor = "rgba(0,230,180,0.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
    </div>
  );
}

function Btn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading} style={{ marginTop: 4, padding: "13px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#00e6b4,#0078ff)", color: "#060b14", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}>
      {loading ? loadingLabel : label}
    </button>
  );
}

function AuthPageWrapper({ title, sub, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#060b14", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ position: "absolute", top: "-10%", left: "20%", width: "40%", height: "40%", background: "radial-gradient(ellipse,rgba(0,230,180,0.05),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#00e6b4,#0078ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 14px", boxShadow: "0 0 24px rgba(0,230,180,0.35)" }}>🔐</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", margin: "0 0 6px" }}>{title}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>{sub}</p>
        </div>
        <div style={{ background: "rgba(12,18,32,0.95)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28, backdropFilter: "blur(16px)" }}>
          {children}
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Link to="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;