import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, Mail, Lock } from "lucide-react";
import { S, GOLD, CREAM, MUTED, SERIF, Field } from "../theme.jsx";
import { useAuth } from "../AuthProvider";

export default function Login() {
  const { signIn, signUp, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const dest = loc.state?.from || "/dashboard";
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (user) { nav(dest, { replace: true }); return null; }

  const submit = async () => {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const fn = mode === "in" ? signIn : signUp;
      const { error, data } = await fn(email.trim(), password);
      if (error) throw error;
      if (mode === "up" && !data.session) { setMsg({ ok: true, text: "Account created. Check your email to confirm, then sign in." }); setMode("in"); }
      else nav(dest, { replace: true });
    } catch (e) { setMsg({ ok: false, text: e.message || String(e) }); }
    finally { setBusy(false); }
  };

  return (
    <main style={S.page}>
      <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 460, margin: "30px auto" }}>
        <div style={S.eyebrow}><span style={S.dotGold} /> {mode === "in" ? "STAFF ACCESS" : "CREATE ACCOUNT"}</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, color: CREAM, margin: "10px 0 0" }}>{mode === "in" ? "Welcome back" : "Get started"}</h1>
        <p style={{ color: MUTED, fontSize: 13.5, marginTop: 8 }}>
          {mode === "in" ? "Sign in to reach the front office or owner dashboard." : "Owners create an account here, then add their first gym."}
        </p>

        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={15} color={MUTED} style={{ position: "absolute", left: 13, top: 13 }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gym.com" autoComplete="email"
              style={{ ...S.input, paddingLeft: 38 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </Field>
        <Field label="Password">
          <div style={{ position: "relative" }}>
            <Lock size={15} color={MUTED} style={{ position: "absolute", left: 13, top: 13 }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "in" ? "current-password" : "new-password"}
              style={{ ...S.input, paddingLeft: 38 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </Field>

        {msg && <div style={msg.ok ? { ...S.noteBar, color: GOLD } : S.invalid}>{msg.text}</div>}

        <button className="cf-btn-gold" style={{ ...S.btnGold, width: "100%", justifyContent: "center", marginTop: 20 }} disabled={busy || !email || !password} onClick={submit}>
          {mode === "in" ? <><LogIn size={16} /> Sign in</> : <><UserPlus size={16} /> Create account</>}
        </button>
        <button className="cf-tab" style={{ ...S.tab, width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "New here? Create an owner account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
