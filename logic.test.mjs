import { applyJoin, applyLeave, applyRotate, applyChallenge, genPasscode, estimateWaitSec } from "./src/logic.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  \u2713 " + m); } else { fail++; console.log("  \u2717 " + m); } };
const court = (over = {}) => ({ id: "c1", gym_id: "g", mode: "timed", time_limit: 20, group_size: 4, status: "open", ends_at: null, players: [], queue: [], champions: [], ...over });
const NOW = 1000000;

console.log("\n[logic] join / start");
let c = court();
let f = applyJoin(c, "A", "merge", NOW);
ok(f.players.length === 1 && f.status === "open", "1st player: court still open");
c = { ...c, ...f };
f = applyJoin(c, "B", "merge", NOW);
ok(f.players.length === 2 && f.status === "active" && f.ends_at === NOW + 20 * 60000, "2nd player starts the timer");

console.log("\n[logic] merge vs next while active");
c = court({ status: "active", players: ["A", "B"], ends_at: NOW + 1000 });
f = applyJoin(c, "C", "merge", NOW);
ok(f.players.length === 3 && f.queue.length === 0, "merge fills the live game");
f = applyJoin(c, "C", "next", NOW);
ok(f.players.length === 2 && f.queue.length === 1 && f.queue[0].members[0] === "C", "next-rotation queues a group");

console.log("\n[logic] full game queues even on merge");
c = court({ status: "active", players: ["A", "B", "C", "D"], ends_at: NOW + 1000 });
f = applyJoin(c, "E", "merge", NOW);
ok(f.players.length === 4 && f.queue.length === 1, "merge on a full court falls back to queue");

console.log("\n[logic] rotate promotes the queue");
c = court({ status: "active", players: ["A", "B"], ends_at: NOW, queue: [{ id: "q1", intent: "next", members: ["C", "D"] }] });
let r = applyRotate(c, NOW);
ok(r.freed.join() === "A,B", "old players are freed");
ok(r.fields.players.join() === "C,D" && r.fields.status === "active", "queued group takes the court");
ok(r.fields.ends_at === NOW + 20 * 60000, "fresh timer set on rotation");

console.log("\n[logic] rotate to empty -> open");
c = court({ status: "active", players: ["A", "B"], ends_at: NOW, queue: [] });
r = applyRotate(c, NOW);
ok(r.fields.status === "open" && r.fields.players.length === 0, "no queue -> court opens");

console.log("\n[logic] challenge: winners stay");
c = court({ mode: "challenge", group_size: 2, status: "active", players: ["A", "B"], champions: [], queue: [{ id: "q", intent: "next", members: ["C"] }] });
r = applyChallenge(c, "A", NOW);
ok(r.freed.join() === "B", "loser is freed");
ok(r.fields.players.includes("A") && r.fields.players.includes("C"), "winner stays, challenger comes on");
ok(r.fields.champions.includes("A"), "winner recorded as champion");

console.log("\n[logic] queue: own group vs join an existing waiting group");
c = court({ status: "active", players: ["A", "B", "C", "D"], ends_at: NOW, queue: [{ id: "g1", intent: "next", members: ["E"] }] });
let n1 = applyJoin(c, "F", "new", NOW);
ok(n1.queue.length === 2 && n1.queue[1].members.join() === "F", '"new" starts a separate rotation group');
let n2 = applyJoin(c, "F", "g1", NOW);
ok(n2.queue.length === 1 && n2.queue[0].members.join() === "E,F", "joining by group id merges into that waiting group");
let cf = court({ status: "active", group_size: 2, players: ["A", "B"], ends_at: NOW, queue: [{ id: "g1", intent: "next", members: ["C", "D"] }] });
let n3 = applyJoin(cf, "E", "g1", NOW);
ok(n3.queue.length === 2 && n3.queue[1].members.join() === "E", "joining a FULL group falls back to a new group");

console.log("\n[logic] leave");
c = court({ status: "active", players: ["A", "B"], ends_at: NOW });
f = applyLeave(c, "A");
ok(f.players.join() === "B" && f.status === "open", "dropping below 2 reopens a timed court");

console.log("\n[logic] parties stay together");
c = court({ group_size: 4 });
let p1 = applyJoin(c, ["A", "B"], "merge", NOW);
ok(p1.players.join() === "A,B" && p1.status === "active", "a party of 2 starts a court together");
c = court({ status: "active", group_size: 4, players: ["A", "B", "C"], ends_at: NOW });
let p2 = applyJoin(c, ["D", "E"], "merge", NOW);
ok(p2.players.join() === "A,B,C" && p2.queue.length === 1 && p2.queue[0].members.join() === "D,E", "party that can't all fit the game queues together instead of splitting");
c = court({ status: "active", group_size: 4, players: ["A", "B", "C", "D"], ends_at: NOW, queue: [{ id: "g1", intent: "next", members: ["E", "F"] }] });
let p3 = applyJoin(c, ["G", "H"], "g1", NOW);
ok(p3.queue[0].members.join() === "E,F,G,H", "a party merges into a waiting group when it fits");
let p4 = applyLeave(p3, ["G", "H"]);
ok(p4.queue[0].members.join() === "E,F", "leaving as a party removes all of them");

console.log("\n[logic] wait estimate");
ok(estimateWaitSec(court({ status: "open" }), NOW) === 0, "open court = no wait");
ok(estimateWaitSec(court({ status: "active", group_size: 4, players: ["A", "B"], ends_at: NOW + 600000 }), NOW) === 0, "live game with a free seat = no wait");
const w = estimateWaitSec(court({ status: "active", group_size: 2, time_limit: 20, players: ["A", "B"], ends_at: NOW + 300000, queue: [{ id: "g", intent: "next", members: ["C", "D"] }] }), NOW);
ok(w === 300 + 1200, "wait = time left + one full rotation per waiting group");

console.log("\n[logic] passcode");
const codes = new Set(); let dupe = false;
for (let i = 0; i < 200; i++) { const p = genPasscode([...codes]); if (codes.has(p)) dupe = true; codes.add(p); }
ok(!dupe, "200 generated passcodes are unique");

console.log("\n==== LOGIC: " + pass + " passed, " + fail + " failed ====");
process.exit(fail === 0 ? 0 : 1);
