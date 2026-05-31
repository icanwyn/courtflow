import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Ticket, Loader2, CheckCircle2, LogIn } from "lucide-react";
import { S, GOLD, CREAM, MUTED, SERIF, MONO } from "../theme.jsx";
import { useAuth } from "../AuthProvider";
import * as api from "../api";

export default function Redeem() {
  const { user, refreshGyms, refreshAccess } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  if (!user) return (
    <main style={S.page}>
      <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 440, margin: "30px auto", textAlign: "center" }}>
        <Ticket size={28} color={GOLD} />
        <h1 style={{ fontFamily: SERIF, fontSize: 26, color: CREAM, marginTop: 12 }}>Sign in first</h1>
        <p style={{ color: MUTED, marginTop: 10 }}>Create an account or sign in, then come back to redeem your invite code.</p>
        <Link to="/login" className="cf-btn-gold" style={{ ...S.btnGold, marginTop: 18, textDecoration: "none" }}><LogIn size={16} /> Go to sign in</Link>
      </div>
    </main>
  );

  const redeem = async () => {
    if (busy || !code.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.redeemInvite(code);
      await Promise.all([refreshGyms(), refreshAccess()]);
      setDone(r);
      setTimeout(() => {
        if (r.kind === "owner") nav("/dashboard");
        else nav(`/front-office?gym=${r.gym_id}`);
      }, 1400);
    } catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <main style={S.page}>
      <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 440, margin: "30px auto" }}>
        <div style={S.eyebrow}><span style={S.dotGold} /> INVITE CODE</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, color: CREAM, margin: "10px 0 0" }}>Redeem your invite</h1>
        <p style={{ color: MUTED, fontSize: 13.5, marginTop: 8 }}>Staff codes attach you to a gym's front office. Owner codes unlock creating your own gym.</p>

        {done ? (
          <div className="cf-pop" style={{ ...S.noteBar, color: GOLD, marginTop: 18 }}>
            <CheckCircle2 size={16} />
            {done.kind === "owner" ? "You can now create a gym — taking you to the dashboard…" : `You're now front-office staff at ${done.gym_name} — taking you there…`}
          </div>
        ) : (
          <>
            <div style={{ position: "relative", marginTop: 18 }}>
              <Ticket size={16} color={MUTED} style={{ position: "absolute", left: 14, top: 15 }} />
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 4F9A2C7E" autoFocus
                style={{ ...S.input, paddingLeft: 40, fontFamily: MONO, fontSize: 16, letterSpacing: ".08em" }} onKeyDown={(e) => e.key === "Enter" && redeem()} />
            </div>
            {err && <div style={S.invalid}>{err}</div>}
            <button className="cf-btn-gold" style={{ ...S.btnGold, width: "100%", justifyContent: "center", marginTop: 16 }} disabled={busy || !code.trim()} onClick={redeem}>
              {busy ? <Loader2 size={16} className="cf-spin" /> : <Ticket size={16} />} Redeem code
            </button>
          </>
        )}
      </div>
    </main>
  );
}
