# CourtFlow

Court queueing for gyms — a lobby **Kiosk**, a staff **Front Office**, and a player **Court Sign‑Up**, all kept in sync in real time. Built with Vite + React + React Router and a Supabase (Postgres + Realtime + Auth) backend, ready to deploy on Vercel.

## The three surfaces (tabs)

| Route | Who | What it does |
|-------|-----|--------------|
| `/kiosk?gym=<id>` | Public lobby device | Walk‑ins type their name to check in. After the front desk approves them, their passcode + a QR to sign‑up appears, then the kiosk resets. |
| `/front-office` | Staff (signed in) | Approve check‑ins, issue passcodes, see who's where, and control every court live — end & rotate, clear, crown challenge winners. Expired timed courts auto‑rotate. |
| `/signup?gym=<id>` | Public player | Unlock with a passcode (or arrive via the kiosk QR), then join a court, merge into a live game, or take the next rotation. |
| `/dashboard` | Owner | Create courts (one or 50 at a time), pick timed vs. challenge format, manage multiple gyms, and grant staff access. |
| `/` | Anyone | Overview / landing. |
| `/login` | — | Email + password sign in / sign up. |

## Roles

Access is **per gym**:

- **Owner** — the account that created the gym. Sees the Owner Dashboard and everything else.
- **Front office** — can open the Front Office and run the desk.
- **Member** — also granted Front‑Office access (per your requirement). Members and front‑office staff reach the same desk; only the owner sees the dashboard.

The owner grants access from **Dashboard → Staff Access** by email. The person must have **signed up first** (so their account exists), then the owner adds them and picks a role. Kiosk and Sign‑Up are **public** and need no login — they are scoped to a gym by the `?gym=<id>` URL parameter, which is how you point a specific lobby tablet or QR at a specific gym.

---

## 1. Run it locally

```bash
git clone <your-repo-url> courtflow && cd courtflow
npm install
cp .env.example .env        # then fill in the two values (step 2)
npm run dev                 # http://localhost:5173
```

## 2. Create the Supabase backend

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the tables, row‑level‑security policies, the RPCs, and enables realtime.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Put both into your `.env` (local) and into Vercel (production, step 4).
5. **Auth → Providers**: keep *Email* enabled. For the fastest start you can turn **Confirm email** off (Auth → Providers → Email) so new accounts can sign in immediately; leave it on for production and add your domain in Auth → URL Configuration.

## 3. First run

1. Go to `/login`, **Create an owner account**, and sign in.
2. On the **Owner Dashboard**, click **Add gym** and name it. You're now the owner of that gym.
3. Add courts — use the count control to make 1 or up to 200 at once, numbered automatically.
4. Note the gym's id (it's in the URL as `?gym=...` once selected). Open the lobby device at `/(kiosk)?gym=<id>` and players at `/signup?gym=<id>`. The kiosk QR encodes the sign‑up URL with the player's code, so most players just scan.
5. To add staff: have them sign up, then add their email under **Staff Access** with the **Front office** (or **Member**) role.

## 4. Deploy to GitHub + Vercel

```bash
git init && git add . && git commit -m "CourtFlow"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

In Vercel: **Add New → Project → import the repo**. Framework preset auto‑detects **Vite**.

- Build command `npm run build`, output `dist` (defaults are correct).
- Add the two **Environment Variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for Production (and Preview).
- Deploy. Client‑side routes (`/kiosk`, `/front-office`, …) are handled by `vercel.json`, which rewrites everything to `index.html`.

Finally, in Supabase **Auth → URL Configuration**, add your Vercel URL(s) to **Site URL / Redirect URLs** so confirmation and password links resolve correctly.

---

## How it stays in sync

Each surface subscribes to Supabase **Realtime** for its gym's `courts`, `members`, and `gyms` rows; any change triggers a fast reload, so the kiosk, front office, and every player's phone update within a moment of each other.

## Security model

- **Passcodes never reach the browser in bulk.** They live in a separate `member_secrets` table that has no public/anon access and is **not** in the realtime publication. Players, court occupancy, and names are public‑readable; codes are not.
- Public actions go through **security‑definer RPCs**: `kiosk_check_in`, `set_kiosk`, `kiosk_passcode` (returns only the current kiosk member's code), `resolve_passcode`, and `player_apply_court`.
- **Player court actions are passcode‑gated** — `player_apply_court` re‑verifies the member's passcode server‑side before writing.
- **Staff/owner actions are gated by RLS** using `is_gym_staff()` / `is_gym_owner()`. Issuing a passcode (`approve_member`) and reading the staff member list (`staff_members`) are staff‑only RPCs.
- The court rotation/merge/challenge **rules run client‑side** (the pure functions in `src/logic.js`, unit‑tested) and the resulting state is persisted through the gated writes above. If you later want fully server‑authoritative rules, port `src/logic.js` into `player_apply_court` / the staff RPCs — the data model is already shaped for it.

## Auto‑rotation

Whoever has the **Front Office** open rotates expired timed courts (debounced, with a short lock to avoid double‑fires). For rotation that doesn't depend on a tab being open, schedule it server‑side with Supabase **pg_cron** / an Edge Function that calls a rotate routine on a timer — a natural next step.

---

## Project structure

```
src/
  main.jsx              app entry
  App.jsx               providers, router, protected routes
  AuthProvider.jsx      Supabase auth + per‑gym roles
  GymProvider.jsx       active‑gym resolution (URL ?gym= / localStorage / owned)
  supabaseClient.js     client + isConfigured flag
  api.js                all data calls + court actions
  store.js              useGymData() realtime hook + useNow()
  logic.js              pure court rules (join / leave / rotate / challenge)
  theme.jsx             design tokens, styles, texture, QR, shared UI
  components.jsx        TopBar, CourtCard, CourtConfigCard, CourtEditor, PlayerCourtCard
  pages/                Overview, Login, OwnerDashboard, FrontOffice, Kiosk, SignUp
supabase/schema.sql     tables, RLS, RPCs, realtime
vercel.json             SPA rewrite
```

## Scripts & tests

```bash
npm run dev       # local dev server
npm run build     # production build (outputs dist/)
npm run preview   # serve the production build locally
node logic.test.mjs   # unit tests for the court rules (no deps)
```

## Notes

- Built for **Node 18+**.
- Gym add/rename/delete uses simple browser prompts for now — easy to swap for a modal later.
- `member`/`front_office` are the two grantable roles; `owner` is implied by gym ownership.
