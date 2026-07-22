# Deploying Ascend (host it live)

Ascend is three pieces. You'll host each on a free service:

| Piece                      | What it is                     | Where to host (free)    |
| -------------------------- | ------------------------------ | ----------------------- |
| **Frontend** (`frontend/`) | The Next.js website users open | **Vercel**              |
| **Backend** (`backend/`)   | The Express API + AI + emails  | **Render** (or Railway) |
| **Database**               | Your users, plans, payments    | **Supabase** (mirror)   |

The AI runs on **Google Gemini** (cloud) and email on **Gmail SMTP** — both already
work from any host, no extra hosting needed.

> **Before you start:** push this repo to GitHub (Vercel and Render deploy from
> GitHub). All accounts below are free.

---

## Step 1 — Supabase (durable database) · ~5 min

Render's free disk is wiped on every redeploy, so the database lives in Supabase
and the backend syncs to it automatically.

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name, a
   strong DB password (you won't need it here), region **Mumbai/Singapore**.
2. When it's ready, open the **SQL Editor** → **New query**, paste this, **Run**:
   ```sql
   create table app_state (
     id text primary key,
     data jsonb,
     updated_at timestamptz default now()
   );
   ```
3. Go to **Project Settings → API** and copy two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role** secret key (NOT the anon key) → this is `SUPABASE_KEY`
     _(the service_role key must stay secret — it's backend-only)_

Keep these two for Step 2.

---

## Step 2 — Backend on Render · ~10 min

1. [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Instance Type:** Free
3. **Environment variables** (Add each — this is the important part):
   ```
   JWT_SECRET            = <a long random string>
   GEMINI_API_KEY        = <your Gemini key>
   GEMINI_MODEL          = gemini-3.1-flash-lite
   SMTP_HOST             = smtp.gmail.com
   SMTP_PORT             = 587
   SMTP_USER             = nikileshh2005@gmail.com
   SMTP_PASS             = <gmail app password — 16 chars, no spaces; needs 2-Step Verification ON>
   SMTP_FROM             = Ascend <nikileshh2005@gmail.com>
   ADMIN_EMAIL           = admin@ascend.app
   ADMIN_PASSWORD        = <your admin password>
   UPI_ID                = nikileshh2005@oksbi
   UPI_NAME              = Nikileshh Suriyamoorthy
   PREMIUM_PRICE         = 250
   STORE_DRIVER          = supabase
   SUPABASE_URL          = <from Step 1>
   SUPABASE_KEY          = <service_role key from Step 1>
   FRONTEND_URL          = https://TEMP        # fix in Step 4
   ```
   (Don't set `PORT` — Render sets it for you.)
4. **Create Web Service.** When the log shows `Ascend API listening…`, open the
   service URL and add `/health` — you should see `{"status":"ok"}`.
   **Copy this backend URL** (e.g. `https://ascend-api.onrender.com`) for Step 3.

---

## Step 3 — Frontend on Vercel · ~5 min

1. [vercel.com](https://vercel.com) → **Add New → Project** → import your GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework: **Next.js** (auto-detected)
3. **Environment variable:**
   ```
   NEXT_PUBLIC_API_URL = <your Render backend URL from Step 2>
   ```
4. **Deploy.** You'll get a URL like `https://ascend.vercel.app`. **Copy it.**

---

## Step 4 — Connect the two · ~2 min

1. Back in **Render → your service → Environment**, set:
   ```
   FRONTEND_URL = https://ascend.vercel.app     # your real Vercel URL
   ```
   Save (Render redeploys). This makes the links inside emails point to your live site.
2. Done. Open your Vercel URL and use the app.

---

## Post-deploy checklist

- [ ] `https://<backend>/health` returns `{"status":"ok"}`
- [ ] Register with a real Gmail → verification email arrives → code works
- [ ] Onboarding builds a plan (Gemini)
- [ ] "Forgot password?" emails a reset code that works
- [ ] Log in as admin → `/admin` loads, Premium toggle works
- [ ] In Supabase → **Table Editor → app_state**, you see one row with your data
      (proves the database is syncing to the cloud)

---

## Important limitations of the free tier

- **Render free spins down after ~15 min idle.** The first visit after that takes
  ~30–50s to wake up (cold start). Fine for launch/testing.
- **Scheduled emails need an always-on server.** The daily 6 AM plan email and the
  per-timetable-slot reminders only fire while the backend is awake — on Render
  free (which sleeps) they'll be unreliable. For dependable scheduled emails, use
  **Railway** (~$5/mo, never sleeps) or Render's paid tier. Everything else
  (signup, plans, chat, payments, password reset) works fine on free.
- **Keep secrets in the host's env vars**, never in the repo. `.env` is gitignored.

---

## Handling 100–1000 users

Good news: **you do not need anything bigger for this range.**

- The database is one JSON document. 1000 users with plans is only a few MB —
  loads into memory instantly, reads are O(1) in memory, and every change is
  mirrored to Supabase. This comfortably handles 100–1000 users on a single
  backend instance.
- **The one thing to fix for real traffic:** run a single always-on backend
  instance (Railway, or Render paid), not multiple. The whole-file sync is
  last-write-wins, so one instance avoids write races. One instance handles far
  more than 1000 users for this app's usage pattern.
- **When you outgrow this** (roughly a few thousand active users, or you want
  multiple backend instances): migrate from the single-JSON store to proper
  Supabase Postgres tables (one row per user). That's a clean, well-scoped
  change — ask when you get there.

**TL;DR for tomorrow:** Vercel + Render(or Railway) + Supabase, set the env vars
above, and you're live. Use **Railway for the backend if you want the reminder
emails to fire reliably**; Render free is fine for everything else.

---

## Custom domain (optional, later)

- **Vercel:** Project → Settings → Domains → add your domain, follow the DNS steps.
- Then update `FRONTEND_URL` on Render to your custom domain so email links match.
