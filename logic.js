/* Pure court-queue logic. Operates on plain court rows (DB shape, snake_case).
   Arrays (players, queue, champions) hold member IDs (uuid strings).
   ends_at is handled here as epoch ms; the data layer converts to/from ISO. */

export const ANIMALS = ["Falcon", "Tiger", "Panther", "Cobra", "Eagle", "Wolf", "Lynx", "Bison",
  "Heron", "Otter", "Jaguar", "Raven", "Stag", "Orca", "Hawk", "Fox", "Puma", "Crane",
  "Mako", "Ibex", "Onyx", "Lark", "Vireo", "Bream"];

export const SPORTS = ["Badminton", "Tennis", "Pickleball", "Squash", "Basketball", "Volleyball", "Table Tennis"];

const rid = () => Math.random().toString(36).slice(2, 10);

export function genPasscode(existing) {
  const used = new Set(existing || []);
  for (let i = 0; i < 800; i++) {
    const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const n = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    const code = a + n;
    if (!used.has(code)) return code;
  }
  return "Guest" + Math.floor(Math.random() * 100);
}

export const groupTag = (i) => "Group " + String.fromCharCode(65 + (i % 26));
export const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
export const fmtClock = (sec) => { if (sec < 0) sec = 0; const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, "0")}`; };

const clone = (court) => ({
  players: [...(court.players || [])],
  queue: (court.queue || []).map((q) => ({ ...q, members: [...q.members] })),
  champions: [...(court.champions || [])],
  status: court.status,
  ends_at: court.ends_at,
});

const asIds = (x) => (Array.isArray(x) ? x : [x]);

/* A party (one or more member IDs) joins an active court. `target` is one of:
     "merge"   -> join the live game, but only if the WHOLE party fits
     "new"     -> start their own new waiting group (kept together)
     <groupId> -> merge into that waiting group, only if the whole party fits
   On a court that hasn't started, the party fills seats together (or queues
   together if they don't all fit). Parties never get split across groups. */
export function applyJoin(court, memberIds, target, nowMs) {
  const c = clone(court);
  const gs = court.group_size;
  const ids = asIds(memberIds);

  if (c.status !== "active") {
    if (c.players.length + ids.length <= gs) {
      c.players.push(...ids);
      if (c.players.length >= 2) {
        c.status = "active";
        c.ends_at = court.mode === "timed" ? nowMs + court.time_limit * 60000 : null;
        c.champions = [];
      }
      return c;
    }
    c.queue.push({ id: rid(), intent: "next", members: ids });
    return c;
  }

  if (target === "merge" && c.players.length + ids.length <= gs) {
    c.players.push(...ids);
    return c;
  }
  if (target && target !== "merge" && target !== "new") {
    const grp = c.queue.find((q) => q.id === target && q.members.length + ids.length <= gs);
    if (grp) { grp.members.push(...ids); return c; }
  }
  c.queue.push({ id: rid(), intent: "next", members: ids });
  return c;
}

export function applyLeave(court, memberIds) {
  const c = clone(court);
  const drop = new Set(asIds(memberIds));
  c.players = c.players.filter((p) => !drop.has(p));
  c.queue = c.queue.map((q) => ({ ...q, members: q.members.filter((m) => !drop.has(m)) })).filter((q) => q.members.length > 0);
  c.champions = c.champions.filter((x) => !drop.has(x));
  if (c.players.length === 0) { c.status = "open"; c.ends_at = null; }
  else if (c.players.length < 2 && court.mode === "timed") { c.status = "open"; c.ends_at = null; }
  return c;
}

/* Timed rotation: clear current players, promote queue (FIFO). freed = ids to release. */
export function applyRotate(court, nowMs) {
  const c = clone(court);
  const freed = [...c.players];
  c.players = []; c.champions = [];
  while (c.players.length < court.group_size && c.queue.length) {
    const g = c.queue[0];
    while (g.members.length && c.players.length < court.group_size) c.players.push(g.members.shift());
    if (g.members.length === 0) c.queue.shift(); else break;
  }
  if (c.players.length >= 2) { c.status = "active"; c.ends_at = court.mode === "timed" ? nowMs + court.time_limit * 60000 : null; }
  else { c.status = "open"; c.ends_at = null; }
  return { fields: c, freed };
}

/* Challenge: winners stay, losers freed, challengers promoted from queue. */
export function applyChallenge(court, winnerId, nowMs) {
  const c = clone(court);
  const champs = court.champions || [];
  const stay = c.players.filter((p) => p === winnerId || champs.includes(p));
  const keep = stay.length ? stay : [winnerId];
  const freed = c.players.filter((p) => !keep.includes(p));
  c.players = [...keep]; c.champions = [...keep];
  while (c.players.length < court.group_size && c.queue.length) {
    const g = c.queue[0];
    while (g.members.length && c.players.length < court.group_size) c.players.push(g.members.shift());
    if (g.members.length === 0) c.queue.shift();
  }
  c.status = c.players.length >= 2 ? "active" : "open";
  if (c.players.length < 2) { c.champions = []; c.ends_at = null; }
  else if (court.mode === "timed") c.ends_at = nowMs + court.time_limit * 60000;
  return { fields: c, freed };
}

export function clearCourtFields() {
  return { players: [], queue: [], champions: [], status: "open", ends_at: null };
}

/* Rough estimated seconds until a newly-arriving party could be playing.
   0 means "play right now" (open court, or a live game with an empty seat). */
export function estimateWaitSec(court, nowMs) {
  const gs = court.group_size;
  if (court.status !== "active" && court.players.length < gs) return 0;
  if (court.status === "active" && court.players.length < gs) return 0;
  const perRotation = court.time_limit * 60;
  const remaining = court.ends_at ? Math.max(0, Math.round((court.ends_at - nowMs) / 1000)) : perRotation;
  return remaining + court.queue.length * perRotation;
}
