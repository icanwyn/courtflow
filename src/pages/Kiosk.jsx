import React, { useEffect, useRef, useState } from "react";
import { ScanLine, ArrowRight, CheckCircle2, Loader2, Monitor } from "lucide-react";
import { S, GOLD, GOLD_BRIGHT, CREAM, MUTED, DARK, SERIF, MONO, QRCode, Spinner } from "../theme.jsx";
import { useGym } from "../GymProvider";
import { useGymData } from "../store";
import * as api from "../api";

export default function Kiosk() {
  const { gymId, setGym } = useGym();
  const { gym, members, loading } = useGymData(gymId);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(null);
  const resetTimer = useRef(null);

  const current = members.find((m) => m.id === gym?.kiosk_member_id) || null;
  useEffect(() => { if (gym) setGym(gym.id, gym.name); }, [gym]); // eslint-disable-line

  // Fetch passcode once approved (anon-safe RPC, scoped to current kiosk member).
  useEffect(() => {
    let alive = true;
    if (current?.status === "confirmed" && !code) {
      api.kioskPasscode(gymId).then((d) => { if (alive && d?.passcode) setCode(d.passcode); }).catch(() => {});
    }
    if (!current) setCode(null);
    return () => { alive = false; };
  }, [current?.status, current?.id, gymId, code]);

  // Auto-reset the kiosk a few seconds after the code is shown.
  useEffect(() => {
    clearTimeout(resetTimer.current);
    if (current?.status === "confirmed" && code) {
      resetTimer.current = setTimeout(() => { api.setKiosk(gymId, null).catch(() => {}); setCode(null); setName(""); }, 7000);
    }
    return () => clearTimeout(resetTimer.current);
  }, [current?.status, code, gymId]);

  const checkIn = async () => {
    if (busy || !name.trim()) return;
    setBusy(true);
    try { await api.kioskCheckIn(gymId, name.trim()); setName(""); }
    catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  if (!gymId) return (
    <div style={S.kioskWrap}>
      <div className="cf-rise" style={{ ...S.kioskBezel, textAlign: "center", maxWidth: 460 }}>
        <Monitor size={30} color={GOLD} />
        <h1 style={S.kioskTitle}>Kiosk not linked to a gym</h1>
        <p style={{ color: MUTED, marginTop: 10, lineHeight: 1.6 }}>Open this device with the gym in the URL, e.g. <code style={{ color: GOLD }}>/kiosk?gym=YOUR-GYM-ID</code>. Owners can copy the link from the dashboard.</p>
      </div>
    </div>
  );
  if (loading && !gym) return <Spinner label="Waking the kiosk…" />;

  const signupUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?gym=${gymId}&code=${code || ""}`;

  return (
    <div style={S.kioskWrap}>
      <div style={S.kioskScreen}>
        {!current && (
          <div className="cf-pop" style={S.kioskBezel}>
            <div style={{ textAlign: "center" }}>
              <div style={S.kioskKicker}>{gym?.name?.toUpperCase() || "WELCOME"}</div>
              <h1 style={S.kioskTitle}>Welcome — let's get you on a court</h1>
              <p style={{ color: MUTED, marginTop: 10 }}>Enter your name to check in. The front desk will confirm you.</p>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={S.kioskInput} onKeyDown={(e) => e.key === "Enter" && checkIn()} autoFocus />
            <div style={{ textAlign: "center" }}>
              <button className="cf-btn-gold" style={S.kioskBtn} disabled={busy || !name.trim()} onClick={checkIn}>
                {busy ? <Loader2 size={18} className="cf-spin" /> : <ScanLine size={18} />} Check in <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {current?.status === "pending" && (
          <div className="cf-pop" style={{ ...S.kioskBezel, textAlign: "center" }}>
            <div style={S.pulseRing}><Loader2 size={32} color={GOLD} className="cf-spin" /></div>
            <h1 style={{ ...S.kioskTitle, marginTop: 22 }}>Thanks, {current.name.split(" ")[0]}!</h1>
            <p style={{ color: MUTED, marginTop: 10 }}>Please see the front desk to confirm your visit. Your court passcode will appear here in a moment<span className="cf-dots">…</span></p>
          </div>
        )}

        {current?.status === "confirmed" && code && (
          <div className="cf-pop" style={{ ...S.kioskBezel, textAlign: "center" }}>
            <div style={S.pulseRing}><CheckCircle2 size={32} color={GOLD} /></div>
            <div style={{ ...S.kioskKicker, marginTop: 18 }}>YOU'RE IN — HERE'S YOUR PASSCODE</div>
            <div className="cf-shimmer" style={S.passcode}>{code}</div>
            <p style={{ color: MUTED, fontSize: 13 }}>Joining as <span style={{ color: CREAM }}>{current.name}</span></p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <div style={{ padding: 12, borderRadius: 16, background: "#efe9d8" }}><QRCode text={signupUrl} px={168} /></div>
            </div>
            <p style={{ color: MUTED, fontSize: 12, marginTop: 14 }}>Scan to open Court Sign-Up on your phone, or go to <b style={{ color: GOLD }}>/signup</b> and enter your passcode.</p>
          </div>
        )}
      </div>
    </div>
  );
}
