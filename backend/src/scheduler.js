const cron = require('node-cron');
const pool = require('./db');
const { sendPush } = require('./notifications');

const TIMEZONE = process.env.TIMEZONE || 'UTC';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isCardDueToday(card) {
  const today = startOfToday();

  if (card.timeline === 'today') {
    const created = new Date(card.created_at);
    created.setHours(0, 0, 0, 0);
    return created.getTime() === today.getTime();
  }
  if (card.timeline === 'custom' && card.custom_date) {
    const due = new Date(card.custom_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }
  return false;
}

function isCardOverdue(card) {
  const today = startOfToday();

  if (card.timeline === 'today') {
    const created = new Date(card.created_at);
    created.setHours(0, 0, 0, 0);
    return created < today;
  }
  if (card.timeline === 'this_week') {
    const created = new Date(card.created_at);
    const weekEnd = new Date(created);
    weekEnd.setDate(created.getDate() + (6 - created.getDay())); // Saturday
    weekEnd.setHours(0, 0, 0, 0);
    return weekEnd < today;
  }
  if (card.timeline === 'this_month') {
    const created = new Date(card.created_at);
    const monthEnd = new Date(created.getFullYear(), created.getMonth() + 1, 0);
    monthEnd.setHours(0, 0, 0, 0);
    return monthEnd < today;
  }
  if (card.timeline === 'custom' && card.custom_date) {
    const due = new Date(card.custom_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }
  return false;
}

// Days between the card's effective due date and today
function daysSinceDue(card) {
  const today = startOfToday();
  let dueDate;

  if (card.timeline === 'this_week') {
    const created = new Date(card.created_at);
    dueDate = new Date(created);
    dueDate.setDate(created.getDate() + (6 - created.getDay()));
  } else if (card.timeline === 'this_month') {
    const created = new Date(card.created_at);
    dueDate = new Date(created.getFullYear(), created.getMonth() + 1, 0);
  } else if (card.timeline === 'custom' && card.custom_date) {
    dueDate = new Date(card.custom_date);
  } else {
    // 'today'-type: due date was the creation date
    dueDate = new Date(card.created_at);
  }

  dueDate.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
}

// Apply escalation rules from the spec
function shouldSendOverdueReminder(card) {
  if (card.status === 'done') return false;

  // Snoozed cards are excluded until the snooze expires
  if (card.status === 'snoozed' && card.snoozed_until) {
    const snoozeEnd = new Date(card.snoozed_until);
    snoozeEnd.setHours(0, 0, 0, 0);
    if (snoozeEnd >= startOfToday()) return false;
  }

  if (!isCardOverdue(card)) return false;

  // Use original_timeline (before snooze) to pick the right escalation cadence
  const tl = card.original_timeline || card.timeline;
  const daysPast = daysSinceDue(card);
  const todayDow = new Date().getDay(); // 0 = Sunday, 1 = Monday

  if (tl === 'today' || tl === 'custom') {
    return true; // Daily
  }
  if (tl === 'this_week') {
    return daysPast % 2 === 0; // Every 2 days
  }
  if (tl === 'this_month') {
    return todayDow === 1; // Every Monday
  }

  return false;
}

// Send to both unless assigned to a specific person
async function getRecipients(card) {
  if (card.assigned_to === 'juli' || card.assigned_to === 'gino') {
    return [card.assigned_to];
  }
  return ['juli', 'gino'];
}

// ─── Cron jobs ────────────────────────────────────────────────────────────────

function initScheduler() {
  // ── 9:00 AM daily — due-today reminders + overdue escalation ───────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('[scheduler] Running 9 AM reminder check...');
    try {
      const { rows: cards } = await pool.query(
        "SELECT * FROM cards WHERE status != 'done'"
      );

      for (const card of cards) {
        const recipients = await getRecipients(card);

        if (isCardDueToday(card)) {
          for (const userId of recipients) {
            await sendPush(
              userId,
              '📋 Due today',
              `Reminder: "${card.title}" is due today!`
            );
          }
        } else if (shouldSendOverdueReminder(card)) {
          for (const userId of recipients) {
            await sendPush(
              userId,
              '⏳ Still pending',
              `"${card.title}" is overdue — want to tackle it today?`
            );
          }
        }
      }
    } catch (err) {
      console.error('[scheduler] 9 AM job failed:', err);
    }
  }, { timezone: TIMEZONE });

  // ── 10:00 AM every Sunday — weekly digest ──────────────────────────────────
  cron.schedule('0 10 * * 0', async () => {
    console.log('[scheduler] Running Sunday digest...');
    try {
      // Start of the past 7 days
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      // Tasks completed this week, per person
      const { rows: completed } = await pool.query(`
        SELECT status_user_id, COUNT(*)::int AS count
        FROM cards
        WHERE status = 'done' AND status_updated_at >= $1
        GROUP BY status_user_id
      `, [weekStart]);

      const juliDone = completed.find((r) => r.status_user_id === 'juli')?.count ?? 0;
      const ginoDone = completed.find((r) => r.status_user_id === 'gino')?.count ?? 0;
      const totalDone = juliDone + ginoDone;

      // Still pending
      const { rows: pendingRows } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM cards WHERE status != 'done'"
      );
      const pendingCount = pendingRows[0].count;

      // Coming up next 7 days
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(tomorrow);
      nextWeek.setDate(tomorrow.getDate() + 6);

      const { rows: upcoming } = await pool.query(`
        SELECT title FROM cards
        WHERE status != 'done'
          AND (
            timeline IN ('today', 'this_week')
            OR (timeline = 'custom' AND custom_date BETWEEN $1 AND $2)
          )
        ORDER BY created_at
        LIMIT 5
      `, [
        tomorrow.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0],
      ]);

      // Build digest message
      let body = `This week: ${totalDone} task${totalDone !== 1 ? 's' : ''} done`;
      if (totalDone > 0) body += ` (Juli: ${juliDone}, Gino: ${ginoDone})`;
      body += `. ${pendingCount} still pending.`;

      if (upcoming.length > 0) {
        body += ` Coming up: ${upcoming.map((r) => `"${r.title}"`).join(', ')}.`;
      } else {
        body += ' Nothing specific due next week — enjoy the calm! 🌿';
      }

      await sendPush('juli', '📊 Weekly summary', body);
      await sendPush('gino', '📊 Weekly summary', body);
    } catch (err) {
      console.error('[scheduler] Sunday digest failed:', err);
    }
  }, { timezone: TIMEZONE });

  console.log(`[scheduler] Initialized (timezone: ${TIMEZONE})`);
}

module.exports = { initScheduler };
