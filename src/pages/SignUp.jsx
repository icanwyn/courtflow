import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ScanLine, KeyRound, MapPin, LogOut, Loader2, UserPlus, X, Users, ArrowDownNarrowWide, ListOrdered } from "lucide-react";
import { S, GOLD, GOLD_BRIGHT, CREAM, MUTED, DARK, SERIF, MONO, SectionHead, Spinner } from "../theme.jsx";
import { PlayerCourtCard } from "../components.jsx";
import { estimateWaitSec } from "../logic";
import { useGym } from "../GymProvider";
import { useGymData, useNow } from "../store";
import * as api from "../api";

export default function SignUp() {
  const { gymId, setGym } = useGym();
  const [params] = useSearchParams();
  const { gym, courts, members, loading } = useGymData(gymId);
  const now = useNow();
  const [code, setCode] = useState(params.get("code") || "");
  const [me, setMe] = useState(null);          // { id, name, code }
  const [party, setParty] = useState([]);       // [{ id, name }] — includes me
  const [mate, setMate] = useState("");         // teammate passcode input
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [mateErr, setMateErr] = useState(null);
  const [autoTried, setAutoTried] = useState(false);
  const [sortWait, setSortWait] = useState(false);

  useEffect(() => { if (gym) setGym(gym.id, gym.name); }, [gym]); // eslint-disable-line

  const unlock = async (raw) => {
    const c = (raw ?? code).trim();
    if (!c || busy) return;
    setBusy(true); setErr(null);
    try {
      const m = await api.resolvePasscode(gymId, c);
      if (m) { setMe({ ...m, code: c }); setParty([{ id: m.id, name: m.name }]); }
      else setErr("That passcode isn't active. Check with the front desk.");
    } catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    const c = params.get("code");
    if (c && gymId && !me && !autoTried) { setAutoTried(true); unlock(c); }
  }, [params, gymId, me, autoTried]); // eslint-disable-line

  const names = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members]);
  const partyIds = party.map((p) => p.id);
  const onAnyCourt = (id) => courts.some((c) => c.players.includes(id) || c.queue.some((q) => q.members.includes(id)));
  const myCourt = courts.find((c) => c.players.some((id) => partyIds.includes(id)) || c.queue.some((q) => q.members.some((id) => partyIds.includes(id))));

  const addMate = async () => {
    const c = mate.trim();
    if (!c || busy) return;
    if (party.length >= 4) { setMateErr("A party can have at most 4 players."); return; }
    setBusy(true); setMateErr(null);
    try {
      const m = await api.resolvePasscode(gymId, c);
      if (!m) { setMateErr("That passcode isn't active."); return; }
      if (party.some((p) => p.id === m.id)) { setMateErr("They're already in your party."); return; }
      if (onAnyCourt(m.id)) { setMateErr(`${m.name} is already on a court — they'll need to leave it first.`); return; }
      setParty((p) => [...p, { id: m.id, name: m.name }]);
      setMate("");
    } catch (e) { setMateErr(e.message || String(e)); }
    finally { setBusy(false); }
  };
  const removeMate = (id) => setParty((p) => p.filter((x) => x.id === me.id || x.id !== id));

  const sortedCourts = useMemo(() => {
    if (!sortWait) return courts;
    return [...courts].sort((a, b) => estimateWaitSec(a, now) - estimateWaitSec(b, now));
  }, [courts, sortWait, now]);

  if (!gymId) return (
    <main style={S.page}>
      <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 460, margin: "30px auto", textAlign: "center" }}>
        <ScanLine size={28} color={GOLD} />
        <h1 style={{ fontFamily: SERIF, fontSize: 26, color: CREAM, marginTop: 12 }}>No gym selected</h1>
        <p style={{ color: MUTED, marginTop: 10 }}>Open the sign-up link from your gym, e.g. <code style={{ color: GOLD }}>/signup?gym=YOUR-GYM-ID</code>.</p>
      </div>
    </main>
  );
  if (loading && !gym) return <Spinner label="Loading courts…" />;

  if (!me) {
    return (
      <main style={S.page}>
        <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 440, margin: "30px auto" }}>
          <div style={S.eyebrow}><span style={S.dotGold} /> {gym?.name?.toUpperCase() || "COURT SIGN-UP"}</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 30, color: CREAM, margin: "10px 0 0" }}>Enter your passcode</h1>
          <p style={{ color: MUTED, fontSize: 13.5, marginTop: 8 }}>Use the code from the kiosk or the front desk to pick a court.</p>
          <div style={{ position: "relative", marginTop: 18 }}>
            <KeyRound size={16} color={MUTED} style={{ position: "absolute", left: 14, top: 15 }} />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. Falcon42" autoFocus
              style={{ ...S.input, paddingLeft: 40, fontFamily: MONO, fontSize: 16 }} onKeyDown={(e) => e.key === "Enter" && unlock()} />
          </div>
          {err && <div style={S.invalid}>{err}</div>}
          <button className="cf-btn-gold" style={{ ...S.btnGold, width: "100%", justifyContent: "center", marginTop: 16 }} disabled={busy || !code.trim()} onClick={() => unlock()}>
            {busy ? <Loader2 size={16} className="cf-spin" /> : <ScanLine size={16} />} Unlock courts
          </button>
        </div>
      </main>
    );
  }

  const lockedInGame = !!myCourt;

  return (
    <main style={S.page}>
      <div className="cf-rise" style={{ ...S.idCard, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", color: MUTED }}>SIGNED IN</div>
          <div style={{ fontFamily: SERIF, fontSize: 26, color: CREAM, marginTop: 4 }}>{me.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {myCourt ? <span style={S.locBadge}><MapPin size={14} /> {myCourt.name}</span> : <span style={{ color: MUTED, fontSize: 13 }}>Not on a court yet</span>}
          <button className="cf-btn-ghost" style={S.btnGhostSm} onClick={() => { setMe(null); setParty([]); setCode(""); }}><LogOut size={13} /> Switch</button>
        </div>
      </div>

      {/* Party builder */}
      <div className="cf-rise" style={{ ...S.panel, marginBottom: 16 }}>
        <div style={S.panelHead}>
          <span style={S.panelTitle}><Users size={13} style={{ verticalAlign: -2 }} /> Your Party · {party.length}/4</span>
          {lockedInGame && <span style={{ fontSize: 11, color: MUTED }}>locked while on a court</span>}
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ ...S.playerWrap, marginBottom: party.length ? 12 : 0 }}>
            {party.map((p) => (
              <span key={p.id} style={{ ...S.playerPill, ...(p.id === me.id ? S.playerPillMe : {}) }}>
                {p.name}{p.id === me.id ? " · you" : ""}
                {p.id !== me.id && !lockedInGame && <button className="cf-x" title="Remove" style={{ ...S.winBtn, marginLeft: 2 }} onClick={() => removeMate(p.id)}><X size={11} color={MUTED} /></button>}
              </span>
            ))}
          </div>
          {!lockedInGame && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <KeyRound size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input value={mate} onChange={(e) => setMate(e.target.value)} placeholder="Teammate's passcode" disabled={party.length >= 4}
                    style={{ ...S.input, paddingLeft: 36, fontFamily: MONO }} onKeyDown={(e) => e.key === "Enter" && addMate()} />
                </div>
                <button className="cf-btn-gold" style={S.btnGoldSm} disabled={busy || !mate.trim() || party.length >= 4} onClick={addMate}><UserPlus size={14} /> Add</button>
              </div>
              {mateErr && <div style={S.invalid}>{mateErr}</div>}
              <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>Add teammates by their passcode to sign up together — you'll always be placed on the same court and never split up.</div>
            </>
          )}
        </div>
      </div>

      <SectionHead kicker="Choose a court" title={myCourt ? "You're in — here's everything live" : "Pick where you want to play"} right={
        <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, ...(sortWait ? { borderColor: GOLD, color: CREAM, background: "rgba(201,162,74,.08)" } : {}) }} onClick={() => setSortWait((s) => !s)}>
          {sortWait ? <ArrowDownNarrowWide size={14} /> : <ListOrdered size={14} />} {sortWait ? "Shortest wait" : "Default order"}
        </button>
      } />
      {courts.length === 0 ? (
        <div style={{ ...S.panel, padding: "30px 20px", color: MUTED, fontStyle: "italic" }}>No courts are set up yet. Ask the front desk.</div>
      ) : (
        <div style={S.courtGrid}>
          {sortedCourts.map((c) => <PlayerCourtCard key={c.id} court={c} now={now} names={names} me={me} party={party} myCourt={myCourt} />)}
        </div>
      )}
    </main>
  );
}
