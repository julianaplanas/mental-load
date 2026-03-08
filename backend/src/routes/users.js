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

// POST /users/:userId/push-token — register/update device push token
router.post('/:userId/push-token', async (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'token is required' });
  if (!['juli', 'gino'].includes(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET token = $2, updated_at = NOW()`,
      [userId, token]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
