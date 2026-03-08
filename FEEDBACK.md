# Noi App — Feedback & Change Requests

Please apply the following changes to the Noi app. Work through them one by one, and update the README after all changes are complete.

---

## 1. Visual Style — More Playful & Aesthetic

The current style is too plain. Keep it minimal but give it more personality and warmth. Specifically:
- Introduce a more intentional color palette — soft, warm tones that feel cozy and modern (think calm pastels or muted earth tones, not bright primary colors)
- Use rounded corners more generously on cards, buttons, and modals
- Add subtle micro-interactions or transitions (e.g. a card gently scales on tap, a check animates when marking done)
- Typography should feel friendly — consider a slightly more expressive font pairing (a rounded or soft sans-serif)
- Icons should feel cohesive and light, not heavy or system-default
- Buttons should have more visual character — not just flat rectangles
- Empty states (e.g. no tasks, empty grocery list) should have a small illustration or friendly message instead of blank space
- Overall: minimal layout but with soul. It should feel designed, not default.

---

## 2. Bug Fix — Zoom on Input Focus (Mobile)

When tapping on any text input field (e.g. adding an item to the grocery list, adding a task title), the app zooms in, which makes the interface look broken.

**Fix**: Prevent the browser/webview zoom on input focus. This is typically caused by input font sizes smaller than 16px on iOS. Ensure all input fields have a font size of at least `16px`. If using a meta viewport tag, confirm it includes `maximum-scale=1` only if appropriate, but prefer fixing via CSS font size rather than restricting user zoom globally.

Apply this fix to all input fields across the app: grocery list add item, new task form, comment field, search, custom tag input, etc.

---

## 3. Subtasks — Add During Task Creation

When creating a new task card, the user should be able to add subtasks directly in the creation form (not only after saving).

- Add a "Subtasks" section at the bottom of the new task form
- User can type a subtask name and press enter or tap "+" to add it to the list
- Each subtask shows inline with a small delete (×) button to remove before saving
- Subtasks are saved together with the card on form submission
- No required fields — subtasks are always optional

---

## 4. Subtasks — Assign to a Person

On an already-created subtask (visible in the card detail view), the user should be able to assign it to someone.

- Each subtask row should have a small assignee selector (tap to open: Juli / Gino / Either)
- The selected name appears inline next to the subtask (small, subtle — e.g. a chip or avatar initial)
- Assignment can be changed or cleared at any time
- This is separate from the parent card's assignment

---

## 5. Card Feed — Show Subtask Assignment Indicator

In the card feed (main task list), if a card has subtasks assigned to the current user, show a subtle indicator on the card.

- A small badge or label like "You have a subtask" or a person icon with the user's initial
- Only show this if at least one subtask is assigned to the currently logged-in user (Juli or Gino)
- Keep it compact — it should not dominate the card, just be a quick visual cue

---

## 6. Card Feed — Comments Icon

If a card has one or more comments, show a comment icon in the card feed view.

- Use a small speech bubble icon (💬 or an outline icon)
- Optionally show the comment count next to it (e.g. 💬 3)
- Position it consistently in the card footer alongside other metadata (reactions, status badge, etc.)
- If there are no comments, the icon should not appear at all

---

## 7. Stats — Replace Fairness Overview with Personal Accomplishments

Remove the "Fairness Overview" panel entirely. It creates an unintended sense of competition between Juli and Gino.

Replace it with a **Personal Accomplishments** panel that shows each user only their own stats:

- The currently logged-in user sees: how many tasks they completed this month, how many they have "I'm on it" on, and a small streak or highlight (e.g. "You completed 4 tasks this week 🎉")
- There is no side-by-side comparison with the other person
- The panel is warm and celebratory in tone — it should feel rewarding, not evaluative
- Timeframe toggle (This Month / All Time) still applies to this panel

This change should be applied to the stats screen only. No other references to fairness or load comparison should remain in the app.

---

## 8. Stats Page — Bottom Margin Fix

There is excessive margin/padding between the bottom of the stats content and the bottom navigation menu.

- Audit the stats screen layout and reduce the bottom spacing so the content sits naturally above the nav bar
- Ensure the fix works on different screen sizes (especially smaller phones)
- The bottom nav should feel anchored to the screen edge, with content comfortably above it — not floating in excess whitespace

---

## 9. Bug Fix — Snooze & Complete Should Use In-App Modal, Not System Notification

When tapping "Snooze" or "Mark as Done" on a card, the app currently triggers a system-level notification popup. This is incorrect behavior.

**Expected behavior**:
- Both actions should trigger an **in-app modal or bottom sheet** — a UI element within the app itself, not a system push notification
- **Snooze modal**: A small popup confirming the snooze with the new due date (e.g. *"Snoozed until [date]. You can undo this."*) with a brief undo option (disappears after 4 seconds)
- **Complete modal**: A satisfying in-app confirmation (e.g. *"Done! 🎉 [Task name] is crossed off."*) — could be a bottom sheet or a brief toast-style banner
- System push notifications should only be sent for the scheduled reminders and assignment alerts defined in the notification spec — never as a direct response to a user's own tap action

Fix this so that tapping these buttons gives immediate, in-app visual feedback only.

---

## README Update

After all of the above changes are implemented, update the README to reflect:
- The style system changes (color palette, typography decisions made)
- The zoom fix applied and which input fields were affected
- Subtask creation and assignment added to card model
- Removal of Fairness Overview and addition of Personal Accomplishments panel
- The snooze/complete modal fix
- Any known remaining issues