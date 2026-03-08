const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reusable period filter (created_at for category, status_updated_at for completed)
function createdFilter(period) {
  return period === 'month'
    ? "AND created_at >= DATE_TRUNC('month', CURRENT_DATE)"
    : '';
}
function completedFilter(period) {
  return period === 'month'
    ? "AND status_updated_at >= DATE_TRUNC('month', CURRENT_DATE)"
    : '';
}

// GET /stats/by-category?period=month|all
router.get('/by-category', async (req, res) => {
  const { period = 'month' } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(tag, 'Uncategorised') AS tag,
        COUNT(*) FILTER (WHERE status != 'done')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'done')::int   AS done,
        COUNT(*)::int                                   AS total
      FROM cards
      WHERE true ${createdFilter(period)}
      GROUP BY tag
      ORDER BY total DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/upcoming — cards due in the next 7 days
router.get('/upcoming', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, timeline, custom_date, assigned_to, priority, status, tag
      FROM cards
      WHERE status NOT IN ('done')
        AND (
          timeline = 'today'
          OR timeline = 'this_week'
          OR (timeline = 'custom' AND custom_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
        )
      ORDER BY
        CASE timeline WHEN 'today' THEN 0 WHEN 'this_week' THEN 1 ELSE 2 END,
        custom_date NULLS LAST,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
        title
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/overdue-trend — cards created per week for the past 4 weeks (pending vs done)
router.get('/overdue-trend', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        weeks_ago::int,
        COALESCE(SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END), 0)::int AS pending,
        COALESCE(SUM(CASE WHEN status = 'done'  THEN 1 ELSE 0 END), 0)::int AS done,
        COALESCE(COUNT(*), 0)::int AS total
      FROM (
        SELECT
          GREATEST(0, FLOOR(
            EXTRACT(EPOCH FROM (NOW() - created_at)) / (7 * 86400)
          ))::int AS weeks_ago,
          status
        FROM cards
        WHERE created_at >= NOW() - INTERVAL '4 weeks'
      ) sub
      WHERE weeks_ago < 4
      GROUP BY weeks_ago
    `);

    // Ensure all 4 weeks are present (fill gaps with zeros), oldest first
    const filled = [3, 2, 1, 0].map((wa) => {
      const found = rows.find((r) => r.weeks_ago === wa);
      return found ?? { weeks_ago: wa, pending: 0, done: 0, total: 0 };
    });

    res.json(filled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/fairness?period=month|all
router.get('/fairness', async (req, res) => {
  const { period = 'month' } = req.query;
  try {
    const { rows: completedRows } = await pool.query(`
      SELECT status_user_id AS user_id, COUNT(*)::int AS completed
      FROM cards
      WHERE status = 'done' AND status_user_id IS NOT NULL
        ${completedFilter(period)}
      GROUP BY status_user_id
    `);

    const { rows: onItRows } = await pool.query(`
      SELECT status_user_id AS user_id, COUNT(*)::int AS on_it
      FROM cards
      WHERE status = 'on_it' AND status_user_id IS NOT NULL
      GROUP BY status_user_id
    `);

    const result = ['juli', 'gino'].map((userId) => ({
      user_id: userId,
      name: userId === 'juli' ? 'Juli' : 'Gino',
      completed: completedRows.find((r) => r.user_id === userId)?.completed ?? 0,
      on_it: onItRows.find((r) => r.user_id === userId)?.on_it ?? 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/personal?userId=...&period=month|all — personal accomplishments for one user
router.get('/personal', async (req, res) => {
  const { userId, period = 'month' } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const [completedRes, onItRes, weekRes] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS completed FROM cards
        WHERE status = 'done' AND status_user_id = $1 ${completedFilter(period)}
      `, [userId]),
      pool.query(`
        SELECT COUNT(*)::int AS on_it FROM cards
        WHERE status = 'on_it' AND status_user_id = $1
      `, [userId]),
      pool.query(`
        SELECT COUNT(*)::int AS completed_this_week FROM cards
        WHERE status = 'done' AND status_user_id = $1
          AND status_updated_at >= DATE_TRUNC('week', CURRENT_DATE)
      `, [userId]),
    ]);
    res.json({
      completed: completedRes.rows[0]?.completed ?? 0,
      on_it: onItRes.rows[0]?.on_it ?? 0,
      completed_this_week: weekRes.rows[0]?.completed_this_week ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/recent-completed — last 5 completed cards
router.get('/recent-completed', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, tag, status_user_id, status_updated_at
      FROM cards
      WHERE status = 'done'
      ORDER BY status_updated_at DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
