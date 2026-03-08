# Noi — Shared Mental Load App

**Noi** (short for *nosotros*) is a shared task and mental load management app for two people — Juli and Gino. It runs as a **Progressive Web App (PWA)** — install it directly from Safari or Chrome to your home screen, no App Store required.

---

## Features

- ✅ Name-based auth (Juli / Gino) — choice saved on device, never asked again
- ✅ Task feed with urgency sorting (overdue → today → this week → this month)
- ✅ Timeline badges: Overdue / Today / This week / This month / Custom date
- ✅ Add & edit tasks: title, timeline, assignee, category tag, priority, recurring, notes
- ✅ Custom tag creation (beyond the 6 presets)
- ✅ Status actions: "I'm on it" / unclaim, "Mark as Done", "Waiting on…", "Snooze"
- ✅ Subtasks (Steps) — per-task sub-steps, each with assignee and status; progress shown on feed cards
- ✅ Recurring tasks — on completion, next instance created automatically
- ✅ Snooze — pushes due date +7 days, warns after 3 snoozes
- ✅ Emoji reactions (❤️ 😂 👍 👀 ✅ 🙏) — one per user per card
- ✅ Comments — per-card thread with timestamps, real-time sync
- ✅ Grocery list — real-time shared checklist grouped by category, delete with undo toast
- ✅ "Add to grocery list" shortcut on Groceries-tagged cards
- ✅ Dashboard — tasks by category, fairness overview, upcoming 7 days, weekly trend, recently completed
- ✅ Push notifications via Web Push (VAPID) — no Expo, no App Store
- ✅ Scheduled notifications: 9 AM daily reminders, overdue escalation, Sunday digest
- ✅ Do Not Disturb: all pushes suppressed 10 PM – 8 AM
- ✅ Real-time sync via Socket.io
- ✅ Offline support — failed mutations queued in localStorage, auto-synced on reconnect
- ✅ Offline banner when connection is lost

---

## Project Structure

```
mental-load/
├── backend/               # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── db.js          # PostgreSQL connection pool
│   │   ├── migrate.js     # Runs all SQL migrations in order
│   │   ├── notifications.js  # Web Push (VAPID)
│   │   ├── scheduler.js   # node-cron scheduled jobs
│   │   ├── migrations/
│   │   │   ├── 001_init.sql
│   │   │   └── 002_subtasks.sql
│   │   └── routes/
│   │       ├── users.js   # Auth + VAPID key + push subscription
│   │       ├── cards.js   # Cards + subtasks + comments + reactions
│   │       ├── grocery.js
│   │       └── stats.js
│   ├── package.json
│   ├── .env.example
│   └── railway.toml
├── frontend/              # Vite + React PWA
│   ├── public/
│   │   ├── manifest.json  # PWA manifest
│   │   ├── sw.js          # Service worker (cache + push)
│   │   └── icons/         # icon-192.png, icon-512.png (add manually)
│   ├── src/
│   │   ├── main.tsx       # React entry + SW registration
│   │   ├── App.tsx        # Router + auth guard + offline banner
│   │   ├── index.css      # Global styles + CSS variables
│   │   ├── types/
│   │   ├── lib/           # api.ts, socket.ts, notifications.ts, offlineQueue.ts, storage.ts
│   │   ├── hooks/         # useAuth.ts, useCards.ts
│   │   ├── components/    # CardItem, TabBar, TimelineBadge, CommentsSection, ReactionsSection, SubtasksSection
│   │   └── pages/         # AuthPage, FeedPage, GroceryPage, DashboardPage, CardDetailPage, CardFormPage
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── railway.toml
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A Railway project with a PostgreSQL service

### 1. Database setup

1. Create a project on [Railway](https://railway.app)
2. Add a **PostgreSQL** service to it
3. Go to the PostgreSQL service → **Connect** tab → enable **Public Network**
4. Copy the **external** connection URL (looks like `postgresql://user:pass@roundhouse.proxy.rlwy.net:XXXXX/railway`)

> **Why external URL?** The default `DATABASE_URL` shown in Railway Variables is an *internal* URL — it only works within Railway's private network. You need the external URL to connect from your Mac.

### 2. Backend — local server

```bash
cd backend
cp .env.example .env
# Paste the external DATABASE_URL from step above
# Fill in other vars (see Environment Variables below)
npm install
npm run migrate      # creates all tables — safe to run multiple times
npm run dev          # starts on http://localhost:3000
```

### 3. Frontend — Vite dev server

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000
# Set VITE_VAPID_PUBLIC_KEY (generate VAPID keys first — see below)
npm install
npm run dev          # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Deploying to Railway

You need **two Railway services**: one for the backend, one for the frontend.

### Before first deploy: generate VAPID keys

Run this **once** on your Mac (requires the backend node_modules):

```bash
cd backend
npx web-push generate-vapid-keys
```

Copy the output — you'll add these to both services' environment variables.

### Service 1: Backend

1. In your Railway project, add a service → **Deploy from GitHub repo** → select this repo
2. Set **Root directory**: `backend`
3. Railway uses `railway.toml` which runs `node src/migrate.js && node src/index.js` on start — **migrations run automatically on every deploy, no manual step needed**
4. Connect the PostgreSQL service to this service (Railway auto-injects `DATABASE_URL`)
5. Add these environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-noi-frontend.railway.app` *(your frontend URL — set after frontend deploy)* |
| `TIMEZONE` | Your IANA timezone, e.g. `America/Argentina/Buenos_Aires` |
| `VAPID_SUBJECT` | `mailto:your@email.com` |
| `VAPID_PUBLIC_KEY` | *(from `npx web-push generate-vapid-keys`)* |
| `VAPID_PRIVATE_KEY` | *(from `npx web-push generate-vapid-keys`)* |

6. Go to **Settings → Networking → Generate Domain** to get your public URL (e.g. `https://noi-backend.railway.app`)

### Service 2: Frontend

1. Add another service → **Deploy from GitHub repo** → same repo
2. Set **Root directory**: `frontend`
3. Railway uses `frontend/railway.toml` which runs `npm install && npm run build` then `npm start` (`npx serve -s dist`)
4. Add these environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://noi-backend.railway.app` *(your backend URL from step above)* |
| `VITE_VAPID_PUBLIC_KEY` | *(same public key from VAPID generation)* |

5. Go to **Settings → Networking → Generate Domain** to get your frontend URL
6. Go back to the **backend** service and update `FRONTEND_URL` to this frontend URL

### App icons (required for PWA install)

Add two PNG image files to `frontend/public/icons/`:
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

Any square image works. Without these, the PWA install prompt won't show an icon.

---

## Install the App (PWA)

### iOS (iPhone/iPad)

1. Open your frontend URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

The app now opens full-screen like a native app. Push notifications work on **iOS 16.4+**.

### Android

1. Open your frontend URL in **Chrome**
2. Tap the three-dot menu → **Add to Home Screen** (or Chrome may show an install banner automatically)

---

## Push Notifications

### How they work

Notifications use the **Web Push API** (VAPID) — no Expo, no App Store required.

- The frontend subscribes the device with the browser's push manager
- The subscription is stored in the backend database
- The backend sends pushes via `web-push` (VAPID)
- The service worker (`public/sw.js`) shows the notification even when the app is closed

### Requirements

| Platform | Requirement |
|----------|-------------|
| iOS | Safari, iOS 16.4+, **must be installed to Home Screen** |
| Android | Chrome, any modern version |
| Desktop | Chrome or Edge |

### Granting permission

On first open after install, the Tasks screen shows a banner: **"Enable notifications to stay in sync"**. Tap **Enable** and allow the permission prompt.

> On iOS, the permission prompt only appears after the PWA is added to the Home Screen. Opening in Safari without installing will not show the prompt.

### Notification types

| Type | When | Recipients |
|------|------|-----------|
| Due today | 9:00 AM, day of | Assigned person (or both) |
| Overdue — was Today/Custom | 9:00 AM, daily | Assigned person (or both) |
| Overdue — was This week | 9:00 AM, every 2 days | Assigned person (or both) |
| Overdue — was This month | 9:00 AM, every Monday | Assigned person (or both) |
| Task assigned | Immediately | Assignee only |
| "I'm on it" claimed | Immediately | Other person |
| Grocery list (3+ items) | Immediately | Other person |
| Weekly digest | Sunday 10:00 AM | Both |

All notifications respect **Do Not Disturb (10 PM – 8 AM)** in the configured `TIMEZONE`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Railway auto-injects on deploy; use external URL for local dev) |
| `PORT` | — | Server port (Railway sets automatically; defaults to 3000 locally) |
| `NODE_ENV` | — | `production` on Railway, `development` locally |
| `FRONTEND_URL` | ✅ | Allowed CORS origin — your Railway frontend URL |
| `TIMEZONE` | ✅ | IANA timezone, e.g. `America/Argentina/Buenos_Aires` |
| `VAPID_SUBJECT` | ✅ | `mailto:you@example.com` |
| `VAPID_PUBLIC_KEY` | ✅ | From `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | ✅ | From `npx web-push generate-vapid-keys` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend URL — Railway URL in production, `http://localhost:3000` in dev |
| `VITE_VAPID_PUBLIC_KEY` | ✅ | Same VAPID public key as backend |

---

## Database Migrations

Migrations live in `backend/src/migrations/` as numbered SQL files (`001_init.sql`, `002_subtasks.sql`, …). All use `IF NOT EXISTS` so they're safe to run multiple times.

**On Railway:** migrations run automatically when the backend starts (the start command is `node src/migrate.js && node src/index.js`). Nothing to do manually.

**For local dev:** run once with the external DATABASE_URL in your `.env`:
```bash
cd backend && npm run migrate
```

---

## Card Schema

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `title` | TEXT | Required |
| `timeline` | ENUM | `today`, `this_week`, `this_month`, `custom` |
| `custom_date` | DATE | Only when `timeline = 'custom'` |
| `assigned_to` | ENUM | `either`, `juli`, `gino`, `together` |
| `tag` | TEXT | Preset or custom category |
| `priority` | ENUM | `urgent`, `normal`, `low` |
| `status` | ENUM | `pending`, `on_it`, `waiting`, `done`, `snoozed` |
| `status_user_id` | VARCHAR | Who claimed/completed |
| `status_note` | TEXT | Note for "Waiting on…" |
| `is_recurring` | BOOLEAN | |
| `recurring_frequency` | ENUM | `daily`, `weekly`, `biweekly`, `monthly` |
| `notes` | TEXT | Free text |
| `snooze_count` | INTEGER | Increments on each snooze |
| `created_by` | VARCHAR | `juli` or `gino` |

## Recurring Task Behaviour

When a recurring card is marked **Done**, the backend creates the next instance:

| Frequency | Next due |
|-----------|----------|
| Daily | Tomorrow |
| Weekly | +7 days |
| Every 2 weeks | +14 days |
| Monthly | +1 calendar month |

## Snooze Behaviour

- Snooze pushes the due date forward **+7 days**
- Original timeline preserved in `original_timeline`
- At 3+ snoozes, a gentle prompt suggests reassigning

## Offline Behaviour

- Offline banner shown when socket disconnects
- Card creates and grocery adds that fail are saved to a local queue (localStorage)
- Queue replays automatically when the connection restores
- Status updates (on it, done, snooze) require a live connection

---

## Known Limitations

- Push notifications on iOS require iOS 16.4+ and the PWA installed to Home Screen
- Offline queue covers card creates and grocery adds only — status updates need a live connection
- No photo attachments on cards (future feature)
