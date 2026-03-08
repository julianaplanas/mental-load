const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /users — list both users
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/:userId/push-subscription — register/update web push subscription
router.post('/:userId/push-subscription', async (req, res) => {
  const { userId } = req.params;
  const { subscription } = req.body;

  if (!subscription) return res.status(400).json({ error: 'subscription is required' });
  if (!['juli', 'gino'].includes(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET token = $2, updated_at = NOW()`,
      [userId, JSON.stringify(subscription)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:userId/vapid-key — return public VAPID key for push subscription
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

module.exports = router;
