const { Expo } = require('expo-server-sdk');
const pool = require('./db');

const expo = new Expo();

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

async function getToken(userId) {
  const { rows } = await pool.query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  return rows[0]?.token ?? null;
}

async function sendPush(userId, title, body) {
  if (isDND()) {
    console.log(`[notifications] DND active — skipping push to ${userId}: "${title}"`);
    return;
  }

  const token = await getToken(userId);
  if (!token || !Expo.isExpoPushToken(token)) return;

  try {
    await expo.sendPushNotificationsAsync([
      { to: token, sound: 'default', title, body },
    ]);
  } catch (err) {
    console.error(`Push notification to ${userId} failed:`, err);
  }
}

// Notify the other person
async function notifyOther(currentUserId, title, body) {
  const other = currentUserId === 'juli' ? 'gino' : 'juli';
  await sendPush(other, title, body);
}

const userName = (id) => (id === 'juli' ? 'Juli' : 'Gino');

module.exports = { sendPush, notifyOther, userName };
