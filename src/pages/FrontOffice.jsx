import React, { useEffect, useMemo, useRef, useState } from "react";
import { UserCheck, Check, MapPin, Hash, Clock, Users, Activity } from "lucide-react";
import { S, GOLD, GOLD_BRIGHT, CREAM, MUTED, DARK, SERIF, MONO, SectionHead, Spinner } from "../theme.jsx";
import { CourtCard } from "../components.jsx";
import { useGym } from "../GymProvider";
import { useGymData, useNow } from "../store";
import * as api from "../api";

export default function FrontOffice() {
  const { gymId, setGym } = useGym();
  const { gym, courts, members, loading } = useGymData(gymId);
  const now = useNow();
  const [full, setFull] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const rotLock = useRef({});

  useEffect(() => { if (gym) setGym(gym.id, gym.name); }, [gym]); // eslint-disable-line
  const sig = members.map((m) => m.id + m.status).join(",");
  useEffect(() => { if (gymId) api.fetchStaffMembers(gymId).then(setFull).catch(() => {}); }, [gymId, sig]);

  const names = useMemo(() => Object.fromEntries(full.map((m) => [m.id, m.name])), [full]);
  const pending = full.filter((m) => m.status === "pending");
  const confirmed = full.filter((m) => m.status === "confirmed");

  // Best-effort auto-rotation of expired timed courts (whoever has this open).
  useEffect(() => {
    courts.forEach((c) => {
      if (c.mode === "timed" && c.status === "active" && c.ends_at && c.ends_at <= now - 200) {
        const last = rotLock.current[c.id] || 0;
        if (now - last > 5000) { rotLock.current[c.id] = now; api.staffRotate(c).catch(() => {}); }
      }
    });
  }, [now, courts]);

  const approve = async (m) => {
    if (busyId) return; setBusyId(m.id);
    try { await api.approveMember(m); const fresh = await api.fetchStaffMembers(gymId); setFull(fresh); }
    catch (e) { alert(e.message || String(e)); }
    finally { setBusyId(null); }
  };

  const locationOf = (m) => {
    for (const c of courts) {
      if (c.players.includes(m.id)) return { label: c.name, kind: "court" };
      if (c.queue.some((q) => q.members.includes(m.id))) return { label: `Queue · ${c.name}`, kind: "queue" };
    }
    return { label: "Lobby", kind: "idle" };
  };

  const activeCourts = courts.filter((c) => c.status === "active" || c.players.length > 0 || c.queue.length > 0);

  if (loading && !gym) return <Spinner label="Loading front office…" />;

  return (
    <main style={S.page}>
      <SectionHead kicker="Front Office" title={gym?.name || "Front desk"} right={
        <div style={S.fdStats}>
          <span style={S.countPill}><Users size={12} style={{ verticalAlign: -2 }} /> {confirmed.length} checked in</span>
          <span style={S.countPill}><Activity size={12} style={{ verticalAlign: -2 }} /> {courts.filter((c) => c.status === "active").length} live</span>
        </div>
      } />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Approvals */}
        <div style={S.panel}>
          <div style={S.panelHead}>
            <span style={S.panelTitle}><UserCheck size={13} style={{ verticalAlign: -2 }} /> Check-In Requests</span>
            <span style={{ ...S.countPill, ...(pending.length ? S.countPillHot : {}) }}>{pending.length} waiting</span>
          </div>
          {pending.length === 0 ? <div style={S.empty}>No one waiting. Kiosk check-ins appear here.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
              {pending.map((m) => (
                <div key={m.id} className="cf-pop" style={S.deskRow}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 17, color: CREAM }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}><Clock size={11} style={{ verticalAlign: -1 }} /> checked in {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <button className="cf-btn-gold" style={S.btnGoldSm} disabled={busyId === m.id} onClick={() => approve(m)}><Check size={14} /> Approve</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Passcodes */}
        <div style={S.panel}>
          <div style={S.panelHead}>
            <span style={S.panelTitle}><Hash size={13} style={{ verticalAlign: -2 }} /> Active Passcodes</span>
            <span style={S.countPill}>{confirmed.length}</span>
          </div>
          {confirmed.length === 0 ? <div style={S.empty}>Approved players get a passcode to sign up for courts.</div> : (
            <div style={S.codeWrap}>
              {confirmed.map((m) => (
                <div key={m.id} style={S.codeChip}>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: GOLD_BRIGHT }}>{m.passcode}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location tracking */}
      {confirmed.length > 0 && (
        <div style={{ ...S.panel, marginTop: 16 }}>
          <div style={S.panelHead}><span style={S.panelTitle}><MapPin size={13} style={{ verticalAlign: -2 }} /> Who's Where</span></div>
          <div style={S.deskGrid}>
            {confirmed.map((m) => {
              const loc = locationOf(m);
              const st = loc.kind === "court" ? S.locTag : loc.kind === "queue" ? { ...S.locTag, ...S.locTagQueue } : S.locTagIdle;
              return (
                <div key={m.id} style={S.deskRow}>
                  <span style={{ color: CREAM, fontSize: 13.5 }}>{m.name}</span>
                  <span style={st}>{loc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live courts */}
      <div style={{ ...S.sectionLabel, marginTop: 28 }}>LIVE COURTS</div>
      {activeCourts.length === 0 ? (
        <div style={{ ...S.panel, padding: "30px 20px", color: MUTED, fontStyle: "italic" }}>No active courts yet. Players join from the Sign-Up screen.</div>
      ) : (
        <div style={S.courtGrid}>
          {activeCourts.map((c) => <CourtCard key={c.id} court={c} now={now} names={names} admin />)}
        </div>
      )}
    </main>
  );
}
