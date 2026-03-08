# Noi — Shared Mental Load App

**Noi** (short for *nosotros*) is a shared task and mental load management app for two people — Juli and Gino. It helps them stay on top of shared responsibilities in a warm, calm, and non-stressful way.

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase 1 — Project Setup & Auth | ✅ Complete |
| Phase 2 — Core Card System | ✅ Complete |
| Phase 3 — Card Interactions | ✅ Complete |
| Phase 4 — Grocery List | ✅ Complete |
| Phase 5 — Notifications | ✅ Complete |
| Phase 6 — Dashboard | ✅ Complete |
| Phase 7 — Polish & Deployment | ✅ Complete |

---

## Features Implemented

- ✅ Backend: Express + Socket.io server (Railway-ready)
- ✅ Database: PostgreSQL schema with all tables (cards, comments, reactions, grocery items, push tokens)
- ✅ Name-based auth: Juli / Gino selector on first launch
- ✅ User stored in AsyncStorage (no re-selection on subsequent opens)
- ✅ Push notification token registration (Expo Push Notifications)
- ✅ Socket.io real-time sync between both devices
- ✅ Tab navigation: Tasks / Groceries / Stats
- ✅ Card feed with urgency sorting (overdue → today → this week → this month)
- ✅ Add card form with all fields (title, timeline, assigned, tag, priority, recurring, notes)
- ✅ Custom tag creation (type your own category beyond the 6 presets)
- ✅ Card detail view with all fields displayed
- ✅ Status actions: "I'm on it" / unclaim, "Mark as Done", "Waiting on...", "Snooze"
- ✅ Push notifications on assignment and "I'm on it" claim
- ✅ Delete card with confirmation
- ✅ Real-time feed updates via Socket.io
- ✅ Edit card — pre-filled form for all fields, supports custom tags
- ✅ Snooze — pushes due date +7 days, tracks snooze count, warns after 3 snoozes
- ✅ Comments — per-card thread with author name + timestamp, real-time sync
- ✅ Emoji reactions — 6 options (❤️ 😂 👍 👀 ✅ 🙏), one per user per card, real-time sync
- ✅ Recurring tasks — on completion, next instance auto-created at correct frequency
- ✅ Grocery list — real-time shared checklist, grouped by category
- ✅ Grocery quick-add (name only) and expanded-add (+ quantity + category)
- ✅ Check off items — strikethrough, moved to "In the basket" section
- ✅ Delete with 3-second undo toast
- ✅ "Clear checked" with confirmation
- ✅ Push notification when 3+ items added at once
- ✅ "Add to grocery list" shortcut on Groceries-tagged task cards
- ✅ Scheduled notifications via node-cron (timezone-aware)
- ✅ 9 AM daily: "due today" reminder + overdue escalation
- ✅ Sunday 10 AM: weekly digest (completed by whom, pending count, coming up)
- ✅ Do Not Disturb: all pushes suppressed between 10 PM – 8 AM
- ✅ Overdue escalation rules: daily (Today/Custom), every 2 days (This week), Mondays only (This month)
- ✅ Snoozed cards excluded from overdue reminders until snooze expires
- ✅ Dashboard with "This Month" / "All Time" toggle
- ✅ Tasks by category — horizontal bar chart (done teal / pending orange), no external lib
- ✅ Fairness overview — side-by-side panels + proportional balance bar (non-gamified)
- ✅ Upcoming — next 7 days list, tappable to open card detail
- ✅ Activity trend — vertical bar chart, past 4 weeks (done vs pending stacked)
- ✅ Recently completed — last 5 done tasks with who completed them and when
- ✅ Subtasks (steps) — each task can have sub-steps, each with its own assignee and status (on it / done)
- ✅ Subtask progress shown on feed cards (e.g. "2/5 ✓")
- ✅ Offline support — failed mutations queued in AsyncStorage, auto-synced on reconnect
- ✅ Offline banner — shown when socket connection is lost
- ✅ Timezone-safe date display — custom dates parsed as local time (no UTC-offset artefacts)

---

## Project Structure

```
mental-load/
├── backend/               # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── db.js          # PostgreSQL connection pool
│   │   ├── migrate.js     # Run DB migrations
│   │   ├── notifications.js
│   │   ├── scheduler.js   # node-cron scheduled jobs
│   │   ├── migrations/
│   │   │   └── 001_init.sql
│   │   └── routes/
│   │       ├── users.js
│   │       ├── cards.js
│   │       ├── grocery.js
│   │       └── stats.js
│   ├── package.json
│   ├── .env.example
│   └── railway.toml
├── frontend/              # Expo (React Native)
│   ├── app/
│   │   ├── _layout.tsx    # Root layout + auth guard + offline banner
│   │   ├── index.tsx      # Auth screen (name selector)
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx      # Tasks feed
│   │       ├── grocery.tsx    # Grocery list
│   │       └── dashboard.tsx  # Stats
│   ├── components/
│   │   ├── CardItem.tsx
│   │   ├── TimelineBadge.tsx
│   │   ├── CommentsSection.tsx
│   │   └── ReactionsSection.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCards.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   ├── storage.ts
│   │   ├── notifications.ts
│   │   └── offlineQueue.ts
│   ├── types/
│   │   └── index.ts
│   ├── package.json
│   ├── app.json
│   └── .env.example
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Expo Go app on your phone (iOS or Android)
- A Railway account with a PostgreSQL database

### 1. Database — Railway PostgreSQL

1. Create a new project on [Railway](https://railway.app)
2. Add a **PostgreSQL** service to your project
3. Go to the PostgreSQL service → **Variables** tab → copy `DATABASE_URL`

Then run the migration locally:

```bash
cd backend
cp .env.example .env
# Paste your DATABASE_URL into .env
npm install
npm run migrate
```

### 2. Backend — local server

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:3000`.

### 3. Frontend — Expo Go

```bash
cd frontend
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your local IP (see below)
npm install
npx expo start
```

**Finding your local IP:** run `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux). Use this IP in your `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

Scan the QR code with Expo Go on each phone.

---

## Deployment to Railway

### Backend

1. Push your repo to GitHub
2. In your Railway project, add a **new service** → **Deploy from GitHub repo** → select this repo
3. Set the **Root directory** to `backend`
4. Railway will auto-detect `railway.toml` and use `npm start`
5. Go to the service → **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | *(Railway auto-injects this if you connect the PostgreSQL service)* |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `*` *(or your Expo build URL)* |
| `TIMEZONE` | Your IANA timezone, e.g. `America/Argentina/Buenos_Aires` |

6. Go to the service → **Settings** → **Networking** → **Generate Domain** to get your public URL (e.g. `https://noi-backend.railway.app`)
7. **Run migrations** — from your local machine with the Railway `DATABASE_URL` in your `.env`:
   ```bash
   cd backend && npm run migrate
   ```
   This runs all SQL files in `src/migrations/` in order (`001_init.sql`, `002_subtasks.sql`, …). Safe to run multiple times — tables use `IF NOT EXISTS`.

### Frontend — Expo builds

For running on physical devices outside of Expo Go (recommended for push notifications):

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. In `frontend/`, initialise EAS:
   ```bash
   cd frontend
   eas build:configure
   ```

3. Set your production API URL in `frontend/.env`:
   ```
   EXPO_PUBLIC_API_URL=https://noi-backend.railway.app
   ```

4. Build for iOS (TestFlight) or Android (APK/AAB):
   ```bash
   eas build --platform ios --profile preview
   # or
   eas build --platform android --profile preview
   ```

5. Install the resulting build on each phone.

> **Note:** Push notifications only work in EAS builds or standalone apps — not in Expo Go.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (from Railway) |
| `PORT` | — | Server port (Railway sets this automatically; default 3000 locally) |
| `NODE_ENV` | — | `production` on Railway, `development` locally |
| `FRONTEND_URL` | — | Allowed CORS origin (can be `*` for open access) |
| `TIMEZONE` | ✅ | IANA timezone name — controls scheduled jobs and DND window |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | ✅ | Backend URL — Railway public URL in production, local IP in dev |

---

## Card Schema

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `title` | TEXT | Required |
| `timeline` | ENUM | `today`, `this_week`, `this_month`, `custom` |
| `custom_date` | DATE | Only when timeline = `custom` |
| `assigned_to` | ENUM | `either`, `juli`, `gino`, `together` |
| `tag` | TEXT | Preset or custom category |
| `priority` | ENUM | `urgent`, `normal`, `low` |
| `status` | ENUM | `pending`, `on_it`, `waiting`, `done`, `snoozed` |
| `status_user_id` | VARCHAR | Who claimed/completed |
| `status_updated_at` | TIMESTAMPTZ | When status changed |
| `status_note` | TEXT | Note for "Waiting on..." |
| `is_recurring` | BOOLEAN | |
| `recurring_frequency` | ENUM | `daily`, `weekly`, `biweekly`, `monthly` |
| `notes` | TEXT | Free text |
| `snooze_count` | INTEGER | Increments on each snooze |
| `created_by` | VARCHAR | `juli` or `gino` |

## Recurring Task Behaviour

When a recurring card is marked **Done**, the backend automatically creates the next instance with a `custom` timeline date set to:

| Frequency | Next due |
|-----------|----------|
| Daily | Tomorrow |
| Weekly | +7 days |
| Every 2 weeks | +14 days |
| Monthly | +1 calendar month |

The new card inherits all fields (title, tag, priority, assigned_to, notes, frequency) from the completed one.

## Snooze Behaviour

- Snooze pushes the card's due date forward by **7 days** (stored as a `custom` date)
- Original timeline is preserved in `original_timeline` for display
- `snooze_count` increments on every snooze
- At 3+ snoozes, a gentle prompt appears: *"This has been snoozed a few times — want to tackle it together or reassign it?"*

## Offline Behaviour

- When the connection is lost, a soft banner appears at the top of the screen
- Card creates and grocery adds that fail due to network errors are saved to the device's local queue (AsyncStorage)
- When the connection restores, the queue is replayed automatically in the background
- Status updates (on it, done, snooze) are not queued — these require a live connection

---

## Notification Types

| Type | When | Recipients |
|------|------|-----------|
| Due today | 9:00 AM, day of | Assigned person (or both) |
| Overdue — was Today/Custom | 9:00 AM, every day | Assigned person (or both) |
| Overdue — was This week | 9:00 AM, every 2 days | Assigned person (or both) |
| Overdue — was This month | 9:00 AM, every Monday | Assigned person (or both) |
| Task assigned | Immediately | Assignee only |
| "I'm on it" claimed | Immediately | Other person |
| Grocery list (3+ items) | Immediately | Other person |
| Weekly digest | Sunday 10:00 AM | Both |

All real-time and scheduled notifications respect **Do Not Disturb (10 PM – 8 AM)** in the configured timezone.

## Setting the Timezone

Set `TIMEZONE` in `backend/.env` to your [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones):

```
TIMEZONE=America/Argentina/Buenos_Aires
```

This controls when scheduled jobs fire (9 AM, Sunday 10 AM) and the DND window.

## Testing Notifications

Notifications only work on **physical devices with an EAS build** (not Expo Go).

To trigger a scheduled notification manually for testing, temporarily change the cron expression to fire in 1 minute:

```javascript
// In backend/src/scheduler.js
cron.schedule('* * * * *', handler) // fires every minute
```

Or test the daily reminder endpoint directly:

```bash
node -e "require('./src/scheduler').initScheduler()"
```

---

## Known Issues / Limitations

- Push notifications require a physical device with an EAS build (not Expo Go)
- Offline queue covers card creates and grocery adds only — status updates require a live connection
- No photo attachments on cards (future feature)
- No Google Calendar integration (future feature)
