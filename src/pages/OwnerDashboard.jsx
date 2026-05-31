import React, { useEffect, useState } from "react";
import { Plus, Building2, Pencil, Trash2, Users, Shield, X, Check } from "lucide-react";
import { S, GOLD, CREAM, MUTED, DARK, SERIF, SectionHead, Field, Spinner } from "../theme.jsx";
import { CourtConfigCard, CourtEditor } from "../components.jsx";
import { useGym } from "../GymProvider";
import { useAuth } from "../AuthProvider";
import { useGymData } from "../store";
import * as api from "../api";

export default function OwnerDashboard() {
  const { gymId, setGymId, setGym } = useGym();
  const { user, myGyms, refreshGyms } = useAuth();
  const ownedGyms = myGyms.filter((g) => g.role === "owner");
  const ownsCurrent = ownedGyms.some((g) => g.id === gymId);
  const { gym, courts, loading, reload } = useGymData(ownsCurrent ? gymId : (ownedGyms[0]?.id || null));
  const [editing, setEditing] = useState(null); // "new" | court | null
  const [access, setAccess] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("front_office");
  const [busy, setBusy] = useState(false);

  const activeId = gym?.id || (ownsCurrent ? gymId : ownedGyms[0]?.id) || null;

  useEffect(() => { if (gym) setGym(gym.id, gym.name); }, [gym]); // eslint-disable-line
  useEffect(() => { if (activeId) api.listAccess(activeId).then(setAccess).catch(() => setAccess([])); }, [activeId, busy]);

  const guard = (fn) => async (...args) => { if (busy) return; setBusy(true); try { await fn(...args); } catch (e) { alert(e.message || String(e)); } finally { setBusy(false); } };

  const addGym = guard(async () => {
    const name = window.prompt("Name your new gym");
    if (!name) return;
    const g = await api.createGym(name.trim(), user.id);
    await refreshGyms();
    setGymId(g.id);
  });
  const renameGym = guard(async () => {
    const name = window.prompt("Rename gym", gym?.name || "");
    if (!name) return;
    await api.renameGym(activeId, name.trim());
    await refreshGyms();
  });
  const removeGym = guard(async () => {
    if (!window.confirm(`Delete "${gym?.name}" and all its courts? This cannot be undone.`)) return;
    await api.deleteGym(activeId);
    await refreshGyms();
    setGymId(ownedGyms.filter((g) => g.id !== activeId)[0]?.id || null);
  });

  const saveCourt = guard(async (cfg) => {
    if (editing === "new") await api.addCourts(activeId, cfg, cfg.count, cfg.startAt, courts.length);
    else await api.updateCourt(editing.id, cfg);
    setEditing(null);
    reload();
  });
  const delCourt = (id) => guard(async () => { await api.deleteCourt(id); reload(); })();

  const grant = guard(async () => { if (!email.trim()) return; await api.grantAccess(activeId, email, role); setEmail(""); });
  const revoke = (uid) => guard(async () => { await api.revokeAccess(activeId, uid); })();

  if (loading && !gym && ownedGyms.length > 0) return <Spinner label="Loading dashboard…" />;
  if (ownedGyms.length === 0) return (
    <main style={S.page}>
      <SectionHead kicker="Owner" title="Create your first gym" />
      <p style={{ color: MUTED, lineHeight: 1.7, maxWidth: 520, marginTop: -10, marginBottom: 18 }}>
        A gym holds your courts, staff, and players. Make one to get started — you'll be its owner.
      </p>
      <button className="cf-btn-gold" style={S.btnGold} disabled={busy} onClick={addGym}><Plus size={16} /> New gym</button>
    </main>
  );

  return (
    <main style={S.page}>
      <SectionHead kicker="Owner Dashboard" title={gym?.name || "Gym"} right={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cf-btn-ghost" style={S.btnGhostSm} onClick={renameGym}><Pencil size={13} /> Rename</button>
          <button className="cf-btn-ghost" style={S.btnDangerSm} onClick={removeGym}><Trash2 size={13} /> Delete gym</button>
        </div>
      } />

      {/* Gyms */}
      <div style={S.gymBar}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, textTransform: "uppercase", marginRight: 4 }}><Building2 size={13} style={{ verticalAlign: -2 }} /> Gyms</span>
          {ownedGyms.map((g) => (
            <button key={g.id} onClick={() => setGymId(g.id)} style={{ ...S.gymChip, ...(g.id === activeId ? S.gymChipOn : {}) }}>{g.name}</button>
          ))}
        </div>
        <button style={S.gymChipAdd} onClick={addGym}><Plus size={13} /> Add gym</button>
      </div>

      {/* Staff access */}
      <div style={{ ...S.panel, marginBottom: 20 }}>
        <div style={S.panelHead}>
          <span style={S.panelTitle}><Shield size={13} style={{ verticalAlign: -2 }} /> Staff Access</span>
          <span style={S.countPill}>{access.length} {access.length === 1 ? "person" : "people"}</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@email.com (must have an account)" style={{ ...S.input, flex: 1, minWidth: 220 }} />
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...S.input, width: 170 }}>
              <option value="front_office">Front office</option>
              <option value="member">Member</option>
            </select>
            <button className="cf-btn-gold" style={S.btnGoldSm} disabled={busy} onClick={grant}><Plus size={14} /> Grant</button>
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>Members and front-office staff can both open the Front Office. Only owners see this dashboard.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {access.length === 0 && <div style={{ color: MUTED, fontSize: 13, fontStyle: "italic" }}>No staff added yet.</div>}
            {access.map((a) => (
              <div key={a.user_id} style={S.deskRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Users size={15} color={GOLD} />
                  <div>
                    <div style={{ color: CREAM, fontSize: 13.5 }}>{a.email || a.user_id}</div>
                    <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em" }}>{a.role.replace("_", " ")}</div>
                  </div>
                </div>
                <button className="cf-x" title="Revoke" style={S.xBtn} onClick={() => revoke(a.user_id)}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courts */}
      <div style={S.sectionLabel}>COURTS · {courts.length}</div>
      <div style={S.courtGrid}>
        {courts.map((c) => (
          <CourtConfigCard key={c.id} court={c} onEdit={() => setEditing(c)} onDelete={() => delCourt(c.id)} />
        ))}
        <button className="cf-card" style={S.addCourtCard} onClick={() => setEditing("new")}>
          <div style={S.addCircle}><Plus size={24} color={GOLD} /></div>
          <div style={{ fontFamily: SERIF, fontSize: 18, color: CREAM, marginTop: 14 }}>Add courts</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>One, or fifty at once</div>
        </button>
      </div>

      {editing && (
        <CourtEditor
          court={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveCourt}
          onDelete={editing !== "new" ? () => { delCourt(editing.id); setEditing(null); } : null}
        />
      )}
    </main>
  );
}
