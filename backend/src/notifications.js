const webPush = require('web-push');
const pool = require('./db');

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Do Not Disturb: 10 PM – 8 AM in the configured timezone
function isDND() {
  const tz = process.env.TIMEZONE || 'UTC';
  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: tz,
  }).format(new Date());
  const hour = parseInt(hourStr, 10);
  return hour >= 22 || hour < 8;
}

async function getSubscription(userId) {
  const { rows } = await pool.query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  if (!rows[0]?.token) return null;
  try {
    return JSON.parse(rows[0].token);
  } catch {
    return null;
  }
}

async function sendPush(userId, title, body) {
  if (isDND()) {
    console.log(`[notifications] DND active — skipping push to ${userId}: "${title}"`);
    return;
  }

  const subscription = await getSubscription(userId);
  if (!subscription) return;

  try {
    await webPush.sendNotification(subscription, JSON.stringify({ title, body }));
  } catch (err) {
    console.error(`Push notification to ${userId} failed:`, err.message);
    // Clean up expired/invalid subscriptions
    if (err.statusCode === 410 || err.statusCode === 404) {
      await pool.query('DELETE FROM push_tokens WHERE user_id = $1', [userId]);
    }
  }
}

// Notify the other person
async function notifyOther(currentUserId, title, body) {
  const other = currentUserId === 'juli' ? 'gino' : 'juli';
  await sendPush(other, title, body);
}

// Notify both people
async function notifyBoth(title, body) {
  await Promise.all([sendPush('juli', title, body), sendPush('gino', title, body)]);
}

const userName = (id) => (id === 'juli' ? 'Juli' : 'Gino');

module.exports = { sendPush, notifyOther, notifyBoth, userName };
