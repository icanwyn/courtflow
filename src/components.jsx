import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Settings, Crown, RefreshCw, Hourglass, Building2, Check, X,
  Monitor, ScanLine, UserCheck, Sparkles, Timer, Trophy, UserPlus, Zap, Pencil,
  ChevronRight, LogOut, LogIn, ShieldAlert, Ticket,
} from "lucide-react";
import { S, GOLD, GOLD_BRIGHT, CREAM, MUTED, DARK, SERIF, MONO, Field } from "./theme.jsx";
import { SPORTS, groupTag, ordinal, fmtClock, estimateWaitSec } from "./logic";
import * as api from "./api";
import { useAuth } from "./AuthProvider";
import { useGym } from "./GymProvider";

/* --------------------------------- TopBar -------------------------------- */
export function TopBar() {
  const { gymId, gyms: ctxGyms, setGymId } = useGym();
  const { myGyms, user, roleFor, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const gyms = myGyms.length ? myGyms : ctxGyms;
  const active = gyms.find((g) => g.id === gymId) || gyms[0] || null;
  const role = active ? roleFor(active.id) : null;
  const isOwner = role === "owner";
  const isStaff = role === "owner" || role === "front_office" || role === "member";
  const q = gymId ? `?gym=${gymId}` : "";

  const tabs = [
    { to: "/", label: "Overview", Icon: Sparkles, show: true, end: true },
    { to: `/dashboard${q}`, label: "Owner Dashboard", Icon: Settings, show: !!user },
    { to: "/admin", label: "Admin", Icon: ShieldAlert, show: isAdmin },
    { to: `/front-office${q}`, label: "Front Office", Icon: UserCheck, show: isStaff },
    { to: `/kiosk${q}`, label: "Kiosk", Icon: Monitor, show: true },
    { to: `/signup${q}`, label: "Sign-Up", Icon: ScanLine, show: true },
  ];

  return (
    <header style={S.topbar}>
      <div style={S.topbarInner}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <NavLink to="/" style={S.logo}>CF</NavLink>
          <div style={{ position: "relative" }}>
            <button className="cf-tab" style={S.gymSwitch} onClick={() => setOpen((o) => !o)}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: SERIF, fontSize: 18, color: CREAM, lineHeight: 1 }}>Court<span style={{ color: GOLD }}>Flow</span></div>
                <div style={{ fontSize: 10.5, letterSpacing: ".18em", color: MUTED, marginTop: 4, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                  {active ? active.name : "Select gym"} <ChevronRight size={11} style={{ transform: "rotate(90deg)" }} />
                </div>
              </div>
            </button>
            {open && (
              <>
                <div style={S.menuScrim} onClick={() => setOpen(false)} />
                <div className="cf-pop" style={S.gymMenu}>
                  <div style={S.gymMenuLabel}>{gyms.length ? "GYMS" : "NO GYMS YET"}</div>
                  {gyms.map((g) => (
                    <button key={g.id} className="cf-tab" style={{ ...S.gymMenuItem, ...(g.id === gymId ? S.gymMenuItemOn : {}) }}
                      onClick={() => { setGymId(g.id); setOpen(false); }}>
                      <Building2 size={14} color={g.id === gymId ? GOLD : MUTED} />
                      <span style={{ flex: 1, textAlign: "left" }}>{g.name}</span>
                      {g.role && <span style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" }}>{g.role.replace("_", " ")}</span>}
                      {g.id === gymId && <Check size={14} color={GOLD} />}
                    </button>
                  ))}
                  {user && (
                    <button className="cf-btn-gold" style={{ ...S.btnGoldSm, width: "100%", justifyContent: "center", marginTop: 8 }}
                      onClick={() => { setOpen(false); nav("/dashboard"); }}>
                      <Plus size={14} /> Manage gyms
                    </button>
                  )}
                  {user && (
                    <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, width: "100%", justifyContent: "center", marginTop: 8 }}
                      onClick={() => { setOpen(false); nav("/redeem"); }}>
                      <Ticket size={14} /> Redeem invite code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <nav style={S.nav}>
            {tabs.filter((t) => t.show).map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className="cf-tab"
                style={({ isActive }) => ({ ...S.tab, ...(isActive ? S.tabActive : {}) })}>
                <Icon size={15} /> <span className="cf-tab-label">{label}</span>
              </NavLink>
            ))}
          </nav>
          {user ? (
            <button className="cf-btn-ghost" style={S.btnGhostSm} onClick={() => signOut()}><LogOut size={14} /> <span className="cf-tab-label">Sign out</span></button>
          ) : (
            <NavLink to="/login" className="cf-btn-ghost" style={S.btnGhostSm}><LogIn size={14} /> <span className="cf-tab-label">Staff login</span></NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Live court card --------------------------- */
export function CourtCard({ court, now, names = {}, admin }) {
  const [busy, setBusy] = useState(false);
  const nameOf = (id) => names[id] || "Member";
  const isChallenge = court.mode === "challenge";
  const remaining = court.ends_at ? Math.max(0, Math.floor((court.ends_at - now) / 1000)) : 0;
  const pct = court.ends_at && court.status === "active" ? Math.max(0, Math.min(1, remaining / (court.time_limit * 60))) : (court.status === "active" ? 1 : 0);
  const statusColor = court.status === "active" ? GOLD : court.players.length > 0 ? "#7d8f74" : MUTED;
  const statusText = court.status === "active" ? (isChallenge ? "Challenge Live" : "In Play") : court.players.length > 0 ? "Forming Group" : "Open";

  const run = (fn) => async () => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { alert(e.message || String(e)); } finally { setBusy(false); } };

  return (
    <div className="cf-card" style={S.court}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...S.statusDot, background: statusColor, boxShadow: court.status === "active" ? `0 0 10px ${GOLD}` : "none" }} />
            <span style={{ fontSize: 10.5, letterSpacing: ".18em", color: statusColor, textTransform: "uppercase" }}>{statusText}</span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 21, color: CREAM, marginTop: 7 }}>{court.name}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{court.sport} · {isChallenge ? "Winners Stay" : `${court.time_limit}m`} · {court.group_size === 2 ? "Singles" : "Doubles"}</div>
        </div>
        {isChallenge ? <Crown size={16} color={GOLD} /> : <Timer size={16} color={GOLD} />}
      </div>

      {court.status === "active" && !isChallenge && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: MONO, fontSize: 30, color: remaining < 60 ? "#d9824f" : GOLD }}>{fmtClock(remaining)}</span>
            <span style={{ fontSize: 11, color: MUTED }}>remaining</span>
          </div>
          <div style={S.bar}><div style={{ ...S.barFill, width: `${pct * 100}%`, background: remaining < 60 ? "#d9824f" : GOLD }} /></div>
        </div>
      )}
      {court.status === "active" && isChallenge && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Crown size={14} color={GOLD} />
          <span style={{ fontSize: 12.5, color: CREAM }}>{court.champions.length ? `${court.champions.map(nameOf).join(" & ")} holding the court` : "First match in progress"}</span>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={S.miniLabel}>ON COURT · {court.players.length}/{court.group_size}</div>
        <div style={S.playerWrap}>
          {court.players.length === 0 && <span style={{ color: MUTED, fontSize: 12.5, fontStyle: "italic" }}>Awaiting players…</span>}
          {court.players.map((p) => {
            const champ = court.champions?.includes(p);
            return (
              <span key={p} style={{ ...S.playerPill, ...(champ ? S.playerPillChamp : {}) }}>
                {champ && <Crown size={11} color={DARK} />}{nameOf(p)}
                {isChallenge && court.status === "active" && admin && (
                  <button title="Mark as winner" style={S.winBtn} onClick={run(() => api.staffChallenge(court, p))}><Trophy size={11} color={GOLD} /></button>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {court.queue.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={S.miniLabel}>NEXT UP · {court.queue.length} {court.queue.length === 1 ? "group" : "groups"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
            {court.queue.map((qg, i) => (
              <div key={qg.id} style={S.queueRow}>
                <span style={{ ...S.queueNum, ...(i === 0 ? S.queueNumNext : {}) }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: CREAM, fontSize: 12.5 }}><span style={{ color: GOLD }}>{groupTag(i)}</span> · {qg.members.map(nameOf).join(", ")}</div>
                  {i === 0 && <div style={{ fontSize: 9.5, color: GOLD, letterSpacing: ".14em", marginTop: 2 }}>NEXT UP</div>}
                </div>
                <span style={{ ...S.intentTag, ...(qg.intent === "merge" ? S.intentMerge : {}) }}>{qg.intent === "merge" ? "merge" : "next rotation"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {admin && (court.status === "active" || court.players.length > 0) && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {!isChallenge && court.status === "active" && (
            <button className="cf-btn-ghost" style={S.btnGhostSm} disabled={busy} onClick={run(() => api.staffRotate(court))}><RefreshCw size={13} /> End & Rotate</button>
          )}
          <button className="cf-btn-ghost" style={S.btnGhostSm} disabled={busy} onClick={run(() => api.staffClear(court))}><X size={13} /> Clear Court</button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Config card -------------------------------- */
export function CourtConfigCard({ court, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const isChallenge = court.mode === "challenge";
  const occupied = court.status === "active" || court.players.length > 0 || court.queue.length > 0;
  const live = court.status === "active" ? "In Play" : court.players.length > 0 ? "Forming" : "Open";
  const liveColor = court.status === "active" ? GOLD : court.players.length > 0 ? "#7d8f74" : MUTED;
  const handleX = () => { if (occupied && !confirm) { setConfirm(true); return; } onDelete(); };
  return (
    <div className="cf-card" style={{ ...S.court, ...(confirm ? S.courtConfirm : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 21, color: CREAM }}>{court.name}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4, letterSpacing: ".06em", textTransform: "uppercase" }}>{court.sport}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isChallenge ? <Crown size={17} color={GOLD} /> : <Timer size={17} color={GOLD} />}
          <button className="cf-x" title="Delete court" style={S.xBtn} onClick={handleX}><X size={14} /></button>
        </div>
      </div>
      {confirm ? (
        <div style={S.confirmBox}>
          <span style={{ color: "#e0966b", fontSize: 12.5 }}>Delete this court? It's currently in use.</span>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="cf-btn-ghost" style={{ ...S.btnDangerSm, flex: 1, justifyContent: "center" }} onClick={onDelete}><Trash2 size={13} /> Delete</button>
            <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, flex: 1, justifyContent: "center" }} onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={S.configRows}>
            <ConfigRow label="Format" value={isChallenge ? "Challenge · winners stay" : "Timed sign-up"} />
            <ConfigRow label="Time limit" value={`${court.time_limit} min`} />
            <ConfigRow label="Group size" value={court.group_size === 2 ? "Singles · 2" : "Doubles · 4"} />
            <ConfigRow label="Live status" value={<span style={{ color: liveColor }}>{live}</span>} />
          </div>
          <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, width: "100%", justifyContent: "center", marginTop: 14 }} onClick={onEdit}><Pencil size={13} /> Edit configuration</button>
        </>
      )}
    </div>
  );
}
function ConfigRow({ label, value }) {
  return <div style={S.configRow}><span style={{ color: MUTED, fontSize: 12.5 }}>{label}</span><span style={{ color: CREAM, fontSize: 12.5 }}>{value}</span></div>;
}

/* ------------------------------ Court editor ------------------------------ */
export function CourtEditor({ court, onClose, onSave, onDelete }) {
  const isNew = !court;
  const [name, setName] = useState(court?.name || (isNew ? "Court" : "Court"));
  const [sport, setSport] = useState(court?.sport || "Badminton");
  const [mode, setMode] = useState(court?.mode || "timed");
  const [timeLimit, setTimeLimit] = useState(court?.time_limit || 20);
  const [groupSize, setGroupSize] = useState(court?.group_size || 4);
  const [count, setCount] = useState(1);
  const [startAt, setStartAt] = useState(1);

  const bulk = isNew && count > 1;
  const sample = (i) => `${name} ${startAt + i}`;
  const preview = !bulk ? name : count === 2 ? `${sample(0)}, ${sample(1)}` : `${sample(0)}, ${sample(1)}, … ${sample(count - 1)}`;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="cf-pop" style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: CREAM }}>{court ? "Edit Court" : "Add Courts"}</div>
          <button style={S.iconBtn} onClick={onClose}><X size={18} color={MUTED} /></button>
        </div>
        <div style={S.goldRule} />
        <Field label={bulk ? "Base name — number is appended" : "Court name"}>
          <input value={name} onChange={(e) => setName(e.target.value)} style={S.input} />
        </Field>
        <Field label="Sport">
          <div style={S.chipRow}>
            {SPORTS.map((s) => (
              <button key={s} onClick={() => { setSport(s); if (isNew && (name === "Court" || SPORTS.includes(name))) setName(s); }} className="cf-chip" style={{ ...S.selChip, ...(sport === s ? S.selChipOn : {}) }}>{s}</button>
            ))}
          </div>
        </Field>
        <Field label="Format">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ModeCard active={mode === "timed"} onClick={() => setMode("timed")} Icon={Timer} title="Timed Sign-Up" desc="Sessions run on the clock, then rotate to the next group." />
            <ModeCard active={mode === "challenge"} onClick={() => setMode("challenge")} Icon={Crown} title="Challenge Court" desc="Winners stay on. Challengers queue and play the kings." />
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label={`Time limit — ${timeLimit} min`}>
            <input type="range" min="5" max="120" step="5" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} style={S.range} />
          </Field>
          <Field label="Group size">
            <div style={S.chipRow}>
              {[2, 4].map((g) => (<button key={g} onClick={() => setGroupSize(g)} className="cf-chip" style={{ ...S.selChip, ...(groupSize === g ? S.selChipOn : {}) }}>{g === 2 ? "Singles · 2" : "Doubles · 4"}</button>))}
            </div>
          </Field>
        </div>
        {isNew && (
          <Field label="How many courts?">
            <div style={S.chipRow}>
              {[1, 5, 10, 25, 50].map((qq) => (<button key={qq} onClick={() => setCount(qq)} className="cf-chip" style={{ ...S.selChip, ...(count === qq ? S.selChipOn : {}) }}>{qq}</button>))}
              <input type="number" min="1" max="200" value={count} onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} style={S.numInput} />
            </div>
            {bulk && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Start numbering at</span>
                <input type="number" min="0" value={startAt} onChange={(e) => setStartAt(Math.max(0, Number(e.target.value) || 0))} style={S.numInput} />
              </div>
            )}
            <div style={S.previewBox}>
              <span style={{ color: MUTED, fontSize: 11, letterSpacing: ".1em" }}>WILL CREATE</span>
              <div style={{ color: CREAM, fontSize: 13, marginTop: 5 }}>{preview}</div>
              <div style={{ color: MUTED, fontSize: 11.5, marginTop: 4 }}>{bulk ? `${count} courts · ` : ""}{sport} · {mode === "challenge" ? "winners stay" : `${timeLimit} min`} · {groupSize === 2 ? "singles" : "doubles"}</div>
            </div>
          </Field>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
          {onDelete ? (<button className="cf-btn-ghost" style={S.btnDanger} onClick={onDelete}><Trash2 size={15} /> Delete</button>) : <span />}
          <button className="cf-btn-gold" style={S.btnGold} onClick={() => onSave({ name: name.trim() || "Court", sport, mode, timeLimit, groupSize, count: isNew ? count : 1, startAt })}>
            <Check size={16} /> {court ? "Save Court" : bulk ? `Create ${count} courts` : "Create court"}
          </button>
        </div>
      </div>
    </div>
  );
}
function ModeCard({ active, onClick, Icon, title, desc }) {
  return (
    <button onClick={onClick} className="cf-chip" style={{ ...S.modeCard, ...(active ? S.modeCardOn : {}) }}>
      <Icon size={18} color={active ? GOLD_BRIGHT : MUTED} />
      <div style={{ fontFamily: SERIF, fontSize: 15, color: active ? CREAM : MUTED, marginTop: 8 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 4 }}>{desc}</div>
    </button>
  );
}

/* --------------------------- Player court card ---------------------------- */
export function PlayerCourtCard({ court, now, names = {}, me, party = [], myCourt }) {
  const [busy, setBusy] = useState(false);
  const nameOf = (id) => names[id] || "Member";
  const partyIds = party.length ? party.map((p) => p.id) : [me.id];
  const partySize = partyIds.length;
  const inSet = (arr) => arr.some((id) => partyIds.includes(id));
  const onThis = inSet(court.players) || court.queue.some((q) => inSet(q.members));
  const myQueueIdx = court.queue.findIndex((q) => inSet(q.members));
  const lockedElsewhere = myCourt && myCourt.id !== court.id;
  const isChallenge = court.mode === "challenge";
  const gs = court.group_size;
  const remaining = court.ends_at ? Math.max(0, Math.floor((court.ends_at - now) / 1000)) : 0;
  const waitSec = estimateWaitSec(court, now);
  const tooBig = partySize > gs;
  const mergeFits = court.players.length + partySize <= gs;
  const openGroupIdx = court.queue.findIndex((q) => q.members.length + partySize <= gs);
  const openGroup = openGroupIdx >= 0 ? court.queue[openGroupIdx] : null;
  const run = (fn) => async () => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { alert(e.message || String(e)); } finally { setBusy(false); } };

  const statusText = court.status === "active" ? (isChallenge ? "Challenge live" : `${fmtClock(remaining)} left`) : court.players.length > 0 ? `Forming · ${court.players.length}/${court.group_size}` : "Open";

  return (
    <div className="cf-card" style={{ ...S.court, opacity: lockedElsewhere && !onThis ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 20, color: CREAM }}>{court.name}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{court.sport} · {isChallenge ? "Winners stay" : `${court.time_limit}m`} · {court.group_size === 2 ? "Singles" : "Doubles"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {isChallenge ? <Crown size={16} color={GOLD} /> : <Timer size={16} color={GOLD} />}
          <div style={{ fontSize: 11, color: court.status === "active" ? GOLD : MUTED, marginTop: 6, fontFamily: MONO }}>{statusText}</div>
          <div style={{ fontSize: 10.5, color: waitSec === 0 ? "#7d8f74" : MUTED, marginTop: 3 }}>{waitSec === 0 ? "play now" : `~${Math.ceil(waitSec / 60)}m wait`}</div>
        </div>

      </div>

      <div style={{ marginTop: 12 }}>
        <div style={S.miniLabel}>ON COURT · {court.players.length}/{court.group_size}</div>
        <div style={S.playerWrap}>
          {court.players.length === 0 && <span style={{ color: MUTED, fontSize: 12, fontStyle: "italic" }}>Be the first.</span>}
          {court.players.map((p) => {
            const mine = partyIds.includes(p);
            return (
              <span key={p} style={{ ...S.playerPill, ...(mine ? S.playerPillMe : {}), ...(court.champions?.includes(p) ? S.playerPillChamp : {}) }}>
                {court.champions?.includes(p) && <Crown size={10} color={DARK} />}{nameOf(p)}{p === me.id ? " · you" : mine ? " · party" : ""}
              </span>
            );
          })}
        </div>
      </div>

      {court.queue.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={S.miniLabel}>QUEUE · {court.queue.length} {court.queue.length === 1 ? "group" : "groups"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {court.queue.map((qg, i) => {
              const mine = inSet(qg.members);
              return (
                <div key={qg.id} style={{ ...S.queueRowSm, ...(mine ? S.queueRowMine : {}) }}>
                  <span style={{ ...S.queueNum, ...(i === 0 ? S.queueNumNext : {}) }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: mine ? GOLD_BRIGHT : CREAM }}><b style={{ color: mine ? GOLD_BRIGHT : GOLD }}>{groupTag(i)}</b> · {qg.members.map(nameOf).join(", ")}{mine ? " · you" : ""}</span>
                  {i === 0 && <span style={S.nextPill}>NEXT</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myQueueIdx >= 0 && (
        <div style={{ ...S.youAreNext, ...(myQueueIdx === 0 ? S.youAreNextHot : {}) }}>
          <Hourglass size={14} color={myQueueIdx === 0 ? DARK : GOLD} />
          <span>{myQueueIdx === 0 ? `You're up next in ${groupTag(0)} — get ready!` : `You're ${ordinal(myQueueIdx + 1)} in line · ${groupTag(myQueueIdx)}`}</span>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {onThis ? (
          <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, width: "100%", justifyContent: "center" }} disabled={busy} onClick={run(() => api.playerLeave(me, partyIds, court))}><X size={14} /> Leave {partySize > 1 ? "as a group" : "this court"}</button>
        ) : lockedElsewhere ? (
          <div style={{ fontSize: 11.5, color: MUTED, textAlign: "center", padding: "8px 0" }}>Leave {myCourt.name} to join</div>
        ) : tooBig ? (
          <div style={{ fontSize: 11.5, color: MUTED, textAlign: "center", padding: "8px 0" }}>Party of {partySize} is too big for {gs === 2 ? "a singles" : "this"} court</div>
        ) : court.status !== "active" ? (
          <button className="cf-btn-gold" style={{ ...S.btnGold, width: "100%", justifyContent: "center" }} disabled={busy} onClick={run(() => api.playerJoin(me, partyIds, court, "merge"))}><UserPlus size={15} /> {court.players.length === 0 ? (partySize > 1 ? `Start as group of ${partySize}` : "Start group") : (partySize > 1 ? `Join as group of ${partySize}` : "Join group")}</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mergeFits && (
              <button className="cf-btn-gold" style={{ ...S.btnGold, width: "100%", justifyContent: "center" }} disabled={busy} onClick={run(() => api.playerJoin(me, partyIds, court, "merge"))}><Zap size={14} /> Merge in{partySize > 1 ? ` (${partySize})` : ""}</button>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {openGroup && (
                <button className="cf-btn-gold" style={{ ...S.btnGoldSm, flex: 1, justifyContent: "center" }} disabled={busy} onClick={run(() => api.playerJoin(me, partyIds, court, openGroup.id))}><UserPlus size={13} /> Join {groupTag(openGroupIdx)}</button>
              )}
              <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, flex: 1, justifyContent: "center" }} disabled={busy} onClick={run(() => api.playerJoin(me, partyIds, court, "new"))}><Hourglass size={13} /> {court.queue.length ? "Own rotation" : "Next rotation"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
