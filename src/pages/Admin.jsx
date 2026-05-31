import React, { useEffect, useState, useCallback } from "react";
import { Shield, Building2, Users, Activity, Ticket, Plus, Trash2, Copy, X, Check, Crown, UserMinus } from "lucide-react";
import { S, GOLD, GOLD_BRIGHT, CREAM, MUTED, DARK, SERIF, MONO, SectionHead, Spinner } from "../theme.jsx";
import * as api from "../api";

function Stat({ icon: Icon, label, value }) {
  return (
    <div style={S.stat}>
      <Icon size={18} color={GOLD} />
      <div>
        <div style={{ fontFamily: SERIF, fontSize: 24, color: CREAM, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: MUTED, letterSpacing: ".08em", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [ov, setOv] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [copied, setCopied] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [o, g, u, i] = await Promise.all([api.adminOverview(), api.adminGyms(), api.adminUsers(), api.listOwnerInvites()]);
      setOv(o); setGyms(g); setUsers(u); setInvites(i);
    } catch (e) { alert(e.message || String(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const guard = (fn) => async () => { if (busy) return; setBusy(true); try { await fn(); await reload(); } catch (e) { alert(e.message || String(e)); } finally { setBusy(false); } };
  const copy = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };

  const newInvite = guard(async () => { await api.createOwnerInvite(1, null); });
  const grantOwner = guard(async () => { if (!grantEmail.trim()) return; await api.adminGrantOwner(grantEmail); setGrantEmail(""); });

  if (loading) return <Spinner label="Loading admin…" />;

  return (
    <main style={S.page}>
      <SectionHead kicker="Platform Admin" title="Operator console" />

      <div style={S.statRow}>
        <Stat icon={Building2} label="GYMS" value={ov?.gyms ?? 0} />
        <Stat icon={Crown} label="OWNERS" value={ov?.owners ?? 0} />
        <Stat icon={Activity} label="COURTS" value={ov?.courts ?? 0} />
        <Stat icon={Users} label="PLAYERS" value={ov?.members ?? 0} />
        <Stat icon={Ticket} label="OWNER GRANTS" value={ov?.owner_grants ?? 0} />
      </div>

      {/* Owner invite codes */}
      <div style={{ ...S.panel, marginTop: 28 }}>
        <div style={S.panelHead}>
          <span style={S.panelTitle}><Ticket size={13} style={{ verticalAlign: -2 }} /> Owner Invite Codes</span>
          <button className="cf-btn-gold" style={S.btnGoldSm} disabled={busy} onClick={newInvite}><Plus size={14} /> New code</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="Grant owner access by email (account must exist)" style={{ ...S.input, flex: 1, minWidth: 240 }} />
            <button className="cf-btn-ghost" style={S.btnGhostSm} disabled={busy} onClick={grantOwner}><Crown size={13} /> Grant owner</button>
          </div>
          {invites.length === 0 ? <div style={{ color: MUTED, fontSize: 13, fontStyle: "italic" }}>No owner codes yet. Generate one to let a gym owner sign up free.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invites.map((c) => (
                <div key={c.code} style={S.deskRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 15, color: c.active ? GOLD_BRIGHT : MUTED, letterSpacing: ".08em", textDecoration: c.active ? "none" : "line-through" }}>{c.code}</span>
                    <button className="cf-btn-ghost" style={{ ...S.btnGhostSm, padding: "5px 9px" }} onClick={() => copy(c.code)}>{copied === c.code ? <Check size={12} /> : <Copy size={12} />}</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: MUTED }}>{c.uses}/{c.max_uses} used{c.active ? "" : " · revoked"}</span>
                    {c.active && <button className="cf-x" title="Revoke" style={S.xBtn} onClick={guard(() => api.revokeInvite(c.code))}><X size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gyms */}
      <div style={{ ...S.panel, marginTop: 20 }}>
        <div style={S.panelHead}><span style={S.panelTitle}><Building2 size={13} style={{ verticalAlign: -2 }} /> All Gyms</span><span style={S.countPill}>{gyms.length}</span></div>
        {gyms.length === 0 ? <div style={S.empty}>No gyms yet.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
            {gyms.map((g) => (
              <div key={g.id} style={S.deskRow}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 17, color: CREAM }}>{g.name}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{g.owner_email || "—"} · {g.courts} courts · {g.members} players</div>
                </div>
                <button className="cf-x" title="Delete gym" style={S.xBtn} onClick={guard(async () => { if (window.confirm(`Delete "${g.name}" and all its data?`)) await api.adminRemoveGym(g.id); })}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users */}
      <div style={{ ...S.panel, marginTop: 20 }}>
        <div style={S.panelHead}><span style={S.panelTitle}><Users size={13} style={{ verticalAlign: -2 }} /> Accounts</span><span style={S.countPill}>{users.length}</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
          {users.map((u) => (
            <div key={u.user_id} style={S.deskRow}>
              <div>
                <div style={{ color: CREAM, fontSize: 13.5 }}>{u.email}{u.is_admin && <span style={{ ...S.locTag, marginLeft: 8 }}>ADMIN</span>}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{u.gyms} gyms{u.can_own ? " · can create gyms" : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {u.can_own
                  ? <button className="cf-btn-ghost" style={S.btnGhostSm} disabled={u.is_admin} onClick={guard(() => api.adminRevokeOwner(u.user_id))}><UserMinus size={13} /> Revoke owner</button>
                  : <button className="cf-btn-ghost" style={S.btnGhostSm} onClick={guard(() => api.adminGrantOwner(u.email))}><Crown size={13} /> Make owner</button>}
                {!u.is_admin && <button className="cf-x" title="Delete account" style={S.xBtn} onClick={guard(async () => { if (window.confirm(`Permanently delete ${u.email} and all their gyms?`)) await api.adminDeleteUser(u.user_id); })}><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
