import { supabase } from "./supabaseClient";
import { applyJoin, applyLeave, applyRotate, applyChallenge, clearCourtFields } from "./logic";

const must = () => { if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."); };

const toMs = (iso) => (iso ? Date.parse(iso) : null);
const toIso = (ms) => (ms ? new Date(ms).toISOString() : null);

export const normalizeCourt = (r) => ({
  ...r,
  ends_at: toMs(r.ends_at),
  players: r.players || [],
  queue: r.queue || [],
  champions: r.champions || [],
});

const courtPayload = (fields) => ({
  players: fields.players,
  queue: fields.queue,
  champions: fields.champions,
  status: fields.status,
  ends_at: toIso(fields.ends_at),
});

/* ------------------------------- Loading -------------------------------- */
export async function fetchBundle(gymId) {
  must();
  const [gym, courts, members] = await Promise.all([
    supabase.from("gyms").select("id,name,owner_id,kiosk_member_id").eq("id", gymId).single(),
    supabase.from("courts").select("*").eq("gym_id", gymId).order("sort", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("members").select("id,gym_id,name,status,court_id,created_at,confirmed_at").eq("gym_id", gymId).order("created_at", { ascending: true }),
  ]);
  if (gym.error) throw gym.error;
  return {
    gym: gym.data,
    courts: (courts.data || []).map(normalizeCourt),
    members: members.data || [],
  };
}

/* --------------------------- Kiosk (public) ----------------------------- */
export async function kioskCheckIn(gymId, name) {
  must();
  const { data, error } = await supabase.rpc("kiosk_check_in", { p_gym_id: gymId, p_name: name });
  if (error) throw error;
  return data;
}
export async function setKiosk(gymId, memberId) {
  must();
  const { error } = await supabase.rpc("set_kiosk", { p_gym_id: gymId, p_member_id: memberId });
  if (error) throw error;
}
/* Returns the current kiosk member's code WITHOUT exposing all passcodes:
   { id, name, status, passcode } | null. Anon-safe (security-definer RPC). */
export async function kioskPasscode(gymId) {
  must();
  const { data, error } = await supabase.rpc("kiosk_passcode", { p_gym_id: gymId });
  if (error) throw error;
  return data && data.length ? data[0] : null;
}

/* ----------------------- Front office (staff) --------------------------- */
export async function approveMember(member) {
  must();
  const { data, error } = await supabase.rpc("approve_member", { p_member_id: member.id });
  if (error) throw error;
  return data; // the issued passcode
}

/* Staff-only: full member rows incl. passcode (verified inside the RPC). */
export async function fetchStaffMembers(gymId) {
  must();
  const { data, error } = await supabase.rpc("staff_members", { p_gym_id: gymId });
  if (error) throw error;
  return data || [];
}

export async function staffRotate(court) {
  must();
  const { fields, freed } = applyRotate(court, Date.now());
  await Promise.all([
    supabase.from("courts").update(courtPayload(fields)).eq("id", court.id),
    freed.length ? supabase.from("members").update({ court_id: null }).in("id", freed) : Promise.resolve(),
  ]);
}
export async function staffClear(court) {
  must();
  const involved = [...court.players, ...court.queue.flatMap((q) => q.members)];
  await Promise.all([
    supabase.from("courts").update(courtPayload(clearCourtFields())).eq("id", court.id),
    involved.length ? supabase.from("members").update({ court_id: null }).in("id", involved) : Promise.resolve(),
  ]);
}
export async function staffChallenge(court, winnerId) {
  must();
  const { fields, freed } = applyChallenge(court, winnerId, Date.now());
  await Promise.all([
    supabase.from("courts").update(courtPayload(fields)).eq("id", court.id),
    freed.length ? supabase.from("members").update({ court_id: null }).in("id", freed) : Promise.resolve(),
  ]);
}

/* ------------------------ Sign-up (passcode) ---------------------------- */
export async function resolvePasscode(gymId, code) {
  must();
  const { data, error } = await supabase.rpc("resolve_passcode", { p_gym_id: gymId, p_code: code.trim() });
  if (error) throw error;
  return data && data.length ? data[0] : null; // { id, name }
}
async function playerApply(actor, court, fields, onCourt) {
  const { error } = await supabase.rpc("player_apply_court", {
    p_member_id: actor.id,
    p_code: actor.code,
    p_court_id: court.id,
    p_court: courtPayload(fields),
    p_on_court: onCourt,
  });
  if (error) throw error;
}
export async function playerJoin(actor, partyIds, court, target) {
  must();
  const fields = applyJoin(court, partyIds, target, Date.now());
  await playerApply(actor, court, fields, true);
}
export async function playerLeave(actor, partyIds, court) {
  must();
  const fields = applyLeave(court, partyIds);
  await playerApply(actor, court, fields, false);
}

/* ----------------------------- Owner config ----------------------------- */
export async function addCourts(gymId, cfg, count, startAt, baseSort) {
  must();
  const n = Math.max(1, Math.min(200, count || 1));
  const start = Math.max(0, startAt || 1);
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      gym_id: gymId,
      name: n === 1 ? cfg.name : `${cfg.name} ${start + i}`,
      sport: cfg.sport, mode: cfg.mode, time_limit: cfg.timeLimit, group_size: cfg.groupSize,
      status: "open", ends_at: null, players: [], queue: [], champions: [],
      sort: (baseSort || 0) + i,
    });
  }
  const { error } = await supabase.from("courts").insert(rows);
  if (error) throw error;
}
export async function updateCourt(courtId, cfg) {
  must();
  const { error } = await supabase.from("courts")
    .update({ name: cfg.name, sport: cfg.sport, mode: cfg.mode, time_limit: cfg.timeLimit, group_size: cfg.groupSize })
    .eq("id", courtId);
  if (error) throw error;
}
export async function deleteCourt(courtId) {
  must();
  const { error } = await supabase.from("courts").delete().eq("id", courtId);
  if (error) throw error;
}

/* ------------------------------- Gyms ----------------------------------- */
export async function createGym(name, ownerId) {
  must();
  const { data, error } = await supabase.from("gyms").insert({ name, owner_id: ownerId }).select("id,name").single();
  if (error) throw error;
  return data;
}
export async function renameGym(gymId, name) {
  must();
  const { error } = await supabase.from("gyms").update({ name }).eq("id", gymId);
  if (error) throw error;
}
export async function deleteGym(gymId) {
  must();
  const { error } = await supabase.from("gyms").delete().eq("id", gymId);
  if (error) throw error;
}

/* --------------------------- Staff access ------------------------------- */
export async function listAccess(gymId) {
  must();
  const { data, error } = await supabase.from("gym_access").select("user_id, role, email").eq("gym_id", gymId);
  if (error) throw error;
  return data || [];
}
export async function grantAccess(gymId, email, role) {
  must();
  const { error } = await supabase.rpc("grant_access", { p_gym_id: gymId, p_email: email.trim(), p_role: role });
  if (error) throw error;
}
export async function revokeAccess(gymId, userId) {
  must();
  const { error } = await supabase.from("gym_access").delete().eq("gym_id", gymId).eq("user_id", userId);
  if (error) throw error;
}
