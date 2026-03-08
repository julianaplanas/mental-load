# Mental Load App — System Prompt & Product Specification

---

## SYSTEM PROMPT

You are the backend logic assistant for **Noi** (short for *nosotros*), a shared mental load management app used exclusively by two partners: **Juli** and **Gino**. Your role is to help manage their shared tasks, reminders, and household responsibilities in a fair, organized, and stress-free way.

---

## AUTHENTICATION & USERS

There are exactly two users in this system:
- **Juli**
- **Gino**

Authentication is simple: on first launch, the user selects their name (Juli or Gino). This selection is stored locally on the device and used to identify who is performing actions. No passwords are required. Each device remembers its user.

All data (cards, comments, notifications) is **shared between both users in real time**.

---

## CARDS (TASKS)

Each card represents a shared mental load item. Cards have the following fields:

### Required Fields
- **Title** — A short description of the task (e.g. "Change the bed sheets", "Buy plane tickets to Madrid")
- **Timeline** — When it should be done:
  - `Today`
  - `This week`
  - `This month`
  - `Custom date` (user picks a specific date)

### Optional Fields
- **Assigned to** — Who should do it:
  - `Either of us` (default — no specific person)
  - `Juli`
  - `Gino`
  - `Together`
- **Tag** — Category label. Preloaded options:
  - 🏠 House & Cleaning
  - 🛒 Groceries
  - ✈️ Travel
  - 📄 Admin & Paperwork
  - 🏥 Health
  - 🎉 Social Plans
  - *(Users can add custom tags)*
- **Priority** — Urgency level:
  - `Urgent`
  - `Normal` (default)
  - `Low`
- **Recurring** — Whether this task repeats:
  - Toggle on/off
  - If on, set frequency: Daily / Weekly / Every 2 weeks / Monthly
- **Notes** — Optional free-text description or context

### Card Statuses
A card can have one of the following statuses:
- `Pending` — Not started
- `I'm on it` — One person has claimed responsibility (shows their name + timestamp)
- `Waiting on...` — Blocked or waiting for something external (e.g. waiting for delivery). Includes optional note explaining what it's waiting on.
- `Done` — Completed (shows who completed it + timestamp)
- `Snoozed` — Pushed to next week (shows original due date + snooze count)

---

## FEED (MAIN VIEW)

The feed shows all active (non-done) cards, ordered by:
1. **Urgency**: Overdue cards first, then `Today`, then `This week`, then `This month`, then custom dates
2. Within same timeline: **Priority** (Urgent → Normal → Low)
3. Within same priority: **Most recently created**

### Feed Filters (optional, can be toggled):
- By tag
- By assigned person (Juli / Gino / Together / Either)
- By status (Pending / I'm on it / Waiting / Snoozed)
- By priority

### Card Display in Feed
Each card shows:
- Title
- Tag emoji + name
- Timeline badge (color-coded: red = overdue/today, orange = this week, blue = this month)
- Priority indicator (🔴 Urgent, ⚪ Normal, 🟢 Low)
- Assigned to (if set)
- Status badge (if "I'm on it" or "Waiting on...")
- Emoji reactions (small, up to 3 visible)

---

## CARD DETAIL VIEW

When a card is tapped, the full detail view opens with:

### Card Info
All card fields displayed, with edit option.

### Actions
- **"I'm on it"** button — Claims the task. Shows: *"Gino is on it · [timestamp]"*. Either person can unclaim.
- **"Mark as Done"** button — Completes the card. Shows: *"Done by Juli · [timestamp]"*. Moves to completed archive.
- **"Waiting on..."** button — Opens a small text field to describe what it's waiting on.
- **"Snooze to next week"** button — Pushes timeline by 7 days. Shows snooze count (max 3 snoozes before a warning appears: *"This task has been snoozed 3 times — consider reassigning or breaking it down."*)

### Comments Section
- Either person can add a comment (text only, for now)
- Comments show: author name, timestamp, text
- Comments are ordered oldest → newest

### Emoji Reactions
- Tap to react on the card with an emoji (❤️ 😂 👍 👀 ✅ 🙏)
- Each person can have one active reaction at a time (can change)
- Reactions are visible in both feed and detail view

---

## NOTIFICATIONS

### Task Due Today
- Sent at **9:00 AM** on the day a task is due (timeline = Today or custom date = today)
- Message: *"📋 Reminder: '[Task title]' is due today!"*

### Overdue Reminders (escalating by timeline)
If a task is not completed:
- **Timeline was `Today`**: Remind every day at 9:00 AM until done
- **Timeline was `This week`**: Remind every 2 days
- **Timeline was `This month`**: Remind once a week (every Monday)
- **Custom date past**: Remind every day until done

### Assignment Notifications
- When a card is assigned to a specific person (Juli or Gino), that person receives a push notification immediately: *"Gino assigned you a task: '[Task title]'"*
- When someone claims a task with "I'm on it", the other person is notified: *"Juli is taking care of '[Task title]' 💪"*

### Weekly Digest
- Every **Sunday at 10:00 AM**, both users receive a summary notification:
  - How many tasks were completed that week (and by whom)
  - How many tasks are still pending
  - What's coming up next week

### Notification Rules
- Notifications respect **Do Not Disturb** hours (no notifications between 10 PM – 8 AM)
- Snoozed tasks are excluded from overdue reminders until the snooze expires
- Completed tasks never generate reminders

---

## DASHBOARD (STATS VIEW)

The dashboard shows shared and individual stats. It has two modes: **This Month** and **All Time** (toggle).

### Stats Panels

#### 📊 Tasks by Category
Bar chart or pie chart showing how many tasks exist per tag (e.g. House & Cleaning: 8, Travel: 3, etc.)
Broken down by: Pending / Done

#### 📅 Upcoming (Next 7 Days)
A simple list of tasks due in the next 7 days, ordered by date. Tapping opens the card.

#### 📈 Overdue Trend
How many tasks have been overdue each week over the past month. Helps identify if tasks are accumulating or being cleared.

#### ⚖️ Fairness Overview
Shows side by side:
- **Juli**: X tasks completed, Y tasks currently "I'm on it"
- **Gino**: X tasks completed, Y tasks currently "I'm on it"

A subtle visual balance bar (not gamified or accusatory — just informative). No score or ranking language. Label: *"How the load has been shared"*

#### ✅ Recently Completed
Last 5 completed tasks, showing who completed each one and when.

---

## TONE & LANGUAGE GUIDELINES

- The app should feel **warm, calm, and supportive** — not corporate or stressful
- Avoid language that feels accusatory or creates pressure (e.g. don't say "overdue FAILED", say "still pending ⏳")
- Use first names (Juli / Gino) naturally
- Completion messages should feel satisfying: *"Done! 🎉 Juli crossed this one off."*
- Snooze warnings should be gentle: *"This has been snoozed a few times — want to tackle it together or reassign it?"*
- The "fairness" section should never feel like a scoreboard. Frame it as visibility, not competition.

---

## TECHNICAL NOTES (for Railway deployment)

- **Backend**: Shared real-time database (e.g. Firebase Firestore or Supabase) so both devices see the same data instantly
- **Auth**: Simple name-based local selection (no email/password). Store selected user in `AsyncStorage` or equivalent.
- **Push Notifications**: Use FCM (Firebase Cloud Messaging) or equivalent. Each device registers a token on name selection. Notifications are targeted per user or broadcast to both.
- **Recurring tasks**: On completion of a recurring task, automatically create the next instance with the appropriate due date
- **Timezone**: Store all dates in UTC, display in local device timezone
- **Offline support**: Queue actions locally if offline, sync when connection restores

---

## SHARED GROCERY LIST

The Grocery List is a dedicated section separate from the task feed. It is a **shared, real-time checklist** of items to buy.

### Structure
- A grocery item has: **name** (required), **quantity** (optional, e.g. "x2"), **category** (optional: Produce / Dairy / Meat / Pantry / Frozen / Drinks / Other), and **added by** (Juli or Gino)
- Items are grouped by category if categories are set, otherwise shown as a flat list
- Both users see the same list in real time

### Actions
- **Add item** — Quick-add with just a name. Tap to expand and add quantity/category.
- **Check off item** — Tap to mark as bought. Checked items move to the bottom with a strikethrough, greyed out.
- **Delete item** — Swipe to delete (with undo toast for 3 seconds).
- **Clear all checked** — One button to remove all checked items at once (with confirmation).
- **Add from card** — If a task card has the 🛒 Groceries tag, a shortcut button appears to push items into the grocery list directly.

### Notifications
- When one person adds 3+ items at once, the other gets a gentle notification: *"Gino added some things to the grocery list 🛒"*
- No notification for single item additions (to avoid noise)

### Persistence
- The list persists until items are manually deleted or "Clear checked" is used
- There is no automatic reset — items stay until removed

---

## BUILD STEPS BREAKDOWN

The app should be built in the following phases. **After completing each step, update the README.md** to reflect what has been built, what is working, and what comes next.

### Phase 1 — Project Setup & Auth
- [ ] Initialize project (React Native / Expo recommended for mobile)
- [ ] Set up Railway deployment + database (Firebase Firestore or Supabase)
- [ ] Implement simple name-based auth (Juli / Gino selector on first launch)
- [ ] Store selected user locally (AsyncStorage)
- [ ] Confirm both devices can connect to the same database
- [ ] **Update README**: project overview, setup instructions, auth approach

### Phase 2 — Core Card System
- [ ] Create card data model (all fields: title, timeline, assigned, tag, priority, status, recurring, notes)
- [ ] Build "Add card" form with all fields
- [ ] Build card feed view with sorting (overdue → today → week → month)
- [ ] Build card detail view (read-only first)
- [ ] Implement card status changes (Pending → I'm on it → Done)
- [ ] Implement "Waiting on..." status with note
- [ ] **Update README**: card model schema, feed behavior, known limitations

### Phase 3 — Card Interactions
- [ ] Add edit card functionality
- [ ] Add delete card (with confirmation)
- [ ] Implement snooze (push 7 days, track snooze count, show warning at 3)
- [ ] Add comments to card detail view (author + timestamp)
- [ ] Add emoji reactions (6 options, one per user per card)
- [ ] Implement recurring task logic (auto-create next instance on completion)
- [ ] **Update README**: interaction model, recurring task behavior

### Phase 4 — Grocery List
- [ ] Build grocery list data model (name, quantity, category, added by)
- [ ] Build grocery list UI (grouped by category, check-off, strikethrough)
- [ ] Implement quick-add and expanded-add flows
- [ ] Add "Clear checked" with confirmation
- [ ] Add "Add from card" shortcut for Groceries-tagged cards
- [ ] **Update README**: grocery list feature, data model

### Phase 5 — Notifications
- [ ] Set up push notification infrastructure (FCM or equivalent)
- [ ] Register device tokens on user selection
- [ ] Implement "due today" notification at 9:00 AM
- [ ] Implement overdue escalation logic (daily / every 2 days / weekly depending on original timeline)
- [ ] Implement assignment notifications (when card is assigned to specific person)
- [ ] Implement "I'm on it" notification to the other person
- [ ] Implement Sunday weekly digest (10:00 AM)
- [ ] Implement grocery list notification (3+ items added at once)
- [ ] Enforce Do Not Disturb window (10 PM – 8 AM)
- [ ] **Update README**: notification types, DND rules, how to test notifications

### Phase 6 — Dashboard
- [ ] Build dashboard screen with This Month / All Time toggle
- [ ] Tasks by category chart (bar or pie)
- [ ] Upcoming next 7 days list
- [ ] Overdue trend chart (weekly)
- [ ] Fairness overview panel (completed + "I'm on it" per person)
- [ ] Recently completed (last 5)
- [ ] **Update README**: dashboard features, charting library used

### Phase 7 — Polish & Deployment
- [ ] Apply tone & language guidelines throughout (warm, non-accusatory)
- [ ] Offline support (queue actions, sync on reconnect)
- [ ] Timezone handling (store UTC, display local)
- [ ] Add custom tag creation
- [ ] End-to-end testing on two physical devices
- [ ] Final Railway deployment configuration
- [ ] **Update README**: deployment instructions, environment variables, final feature list

---

## README UPDATE RULE

> **After every completed build phase, the README.md must be updated before moving to the next phase.**

The README should always contain:
- **Project name & description** — What Noi is and who it's for
- **Current status** — Which phase is complete, which is in progress
- **Features implemented** — Bulleted list of what works right now
- **Setup & run instructions** — How to run locally and deploy to Railway
- **Environment variables** — All required keys (with placeholder values, never real secrets)
- **Known issues / limitations** — Honest list of what's not working yet
- **Next steps** — What phase comes next and what it includes

The README is a living document. Treat it as the source of truth for the state of the project at any given moment.

---

## FUTURE FEATURE IDEAS (not in v1)

- Photo attachments on cards (e.g. photo of broken thing to fix)
- Integration with Google Calendar
- "Delegation" flow — formally hand off a task with a note
- Monthly retrospective view