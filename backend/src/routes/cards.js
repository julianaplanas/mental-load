const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyOther, userName } = require('../notifications');

// Fetch a single card with all relations (comments, reactions, subtasks)
async function fetchCardFull(id) {
  const { rows } = await pool.query(`
    SELECT c.*,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', cm.id, 'user_id', cm.user_id, 'text', cm.text, 'created_at', cm.created_at
        )) FILTER (WHERE cm.id IS NOT NULL),
        '[]'
      ) AS comments,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', r.id, 'user_id', r.user_id, 'emoji', r.emoji
        )) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS reactions,
      COALESCE(
        (SELECT json_agg(s ORDER BY s.created_at)
         FROM (SELECT id, title, assigned_to, status, status_user_id, status_updated_at, created_at
               FROM subtasks WHERE card_id = c.id) s),
        '[]'
      ) AS subtasks
    FROM cards c
    LEFT JOIN comments cm ON cm.card_id = c.id
    LEFT JOIN reactions r  ON r.card_id  = c.id
    WHERE c.id = $1
    GROUP BY c.id
  `, [id]);
  return rows[0] ?? null;
}

// Feed query: card with reactions + subtask counts (no full subtask list needed for the list view)
const CARD_WITH_REACTIONS = `
  SELECT c.*,
    COALESCE(
      json_agg(DISTINCT jsonb_build_object(
        'id', r.id, 'user_id', r.user_id, 'emoji', r.emoji
      )) FILTER (WHERE r.id IS NOT NULL),
      '[]'
    ) AS reactions,
    (SELECT COUNT(*)::int FROM subtasks WHERE card_id = c.id)                    AS subtask_count,
    (SELECT COUNT(*)::int FROM subtasks WHERE card_id = c.id AND status = 'done') AS subtask_done_count
  FROM cards c
  LEFT JOIN reactions r ON r.card_id = c.id
`;

// Sorting logic: overdue → today → this week → this month → custom (future)
const SORT_ORDER = `
  CASE
    WHEN c.timeline = 'custom' AND c.custom_date < CURRENT_DATE THEN 0
    WHEN c.timeline = 'today' AND c.created_at::date < CURRENT_DATE THEN 0
    WHEN c.timeline = 'this_week'
      AND (DATE_TRUNC('week', c.created_at AT TIME ZONE 'UTC') + INTERVAL '6 days')::date < CURRENT_DATE THEN 0
    WHEN c.timeline = 'this_month'
      AND (DATE_TRUNC('month', c.created_at AT TIME ZONE 'UTC') + INTERVAL '1 month' - INTERVAL '1 day')::date < CURRENT_DATE THEN 0
    WHEN c.timeline = 'today' THEN 1
    WHEN c.timeline = 'this_week' THEN 2
    WHEN c.timeline = 'this_month' THEN 3
    WHEN c.timeline = 'custom' THEN 4
    ELSE 5
  END,
  CASE c.priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
  c.created_at DESC
`;

// GET /cards — active cards sorted by urgency
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      ${CARD_WITH_REACTIONS}
      WHERE c.status != 'done'
      GROUP BY c.id
      ORDER BY ${SORT_ORDER}
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cards/archive — completed cards
router.get('/archive', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      ${CARD_WITH_REACTIONS}
      WHERE c.status = 'done'
      GROUP BY c.id
      ORDER BY c.status_updated_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cards/:id — single card with comments + reactions + subtasks
router.get('/:id', async (req, res) => {
  try {
    const card = await fetchCardFull(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cards — create card
router.post('/', async (req, res) => {
  const {
    title, timeline, custom_date, assigned_to = 'either',
    tag, priority = 'normal', is_recurring = false,
    recurring_frequency, notes, created_by,
  } = req.body;

  if (!title || !timeline || !created_by) {
    return res.status(400).json({ error: 'title, timeline, and created_by are required' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO cards
        (title, timeline, custom_date, assigned_to, tag, priority,
         is_recurring, recurring_frequency, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      title, timeline, custom_date || null, assigned_to,
      tag || null, priority, is_recurring, recurring_frequency || null,
      notes || null, created_by,
    ]);

    const card = { ...rows[0], reactions: [], comments: [], subtasks: [], subtask_count: 0, subtask_done_count: 0 };
    req.app.get('io').emit('card:created', card);

    // Notify if assigned to a specific person other than creator
    if ((assigned_to === 'juli' || assigned_to === 'gino') && assigned_to !== created_by) {
      await notifyOther(assigned_to, 'New task for you', `${userName(created_by)} assigned you: "${title}"`);
    }

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /cards/:id — update card (fields or status)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title, timeline, custom_date, assigned_to, tag, priority,
    is_recurring, recurring_frequency, notes,
    status, status_note, current_user_id,
  } = req.body;

  // Fetch existing card first
  const existing = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Card not found' });
  const old = existing.rows[0];

  // Build SET clause dynamically
  const sets = [];
  const vals = [];
  let i = 1;

  const set = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (title !== undefined) set('title', title);
  if (timeline !== undefined) set('timeline', timeline);
  if (custom_date !== undefined) set('custom_date', custom_date || null);
  if (assigned_to !== undefined) set('assigned_to', assigned_to);
  if (tag !== undefined) set('tag', tag || null);
  if (priority !== undefined) set('priority', priority);
  if (is_recurring !== undefined) set('is_recurring', is_recurring);
  if (recurring_frequency !== undefined) set('recurring_frequency', recurring_frequency || null);
  if (notes !== undefined) set('notes', notes || null);

  // Status transitions
  if (status !== undefined) {
    set('status', status);
    if (status === 'on_it') {
      set('status_user_id', current_user_id);
      set('status_updated_at', new Date().toISOString());
      set('status_note', null);
    } else if (status === 'pending') {
      set('status_user_id', null);
      set('status_updated_at', null);
      set('status_note', null);
    } else if (status === 'done') {
      set('status_user_id', current_user_id);
      set('status_updated_at', new Date().toISOString());
    } else if (status === 'waiting') {
      set('status_note', status_note || null);
      set('status_updated_at', new Date().toISOString());
    } else if (status === 'snoozed') {
      const snoozedUntil = new Date();
      snoozedUntil.setDate(snoozedUntil.getDate() + 7);
      const snoozedUntilStr = snoozedUntil.toISOString().split('T')[0];

      set('snoozed_until', snoozedUntilStr);
      set('snooze_count', (old.snooze_count ?? 0) + 1);
      set('status_updated_at', new Date().toISOString());
      if (!old.original_timeline) set('original_timeline', old.timeline);
      set('timeline', 'custom');
      set('custom_date', snoozedUntilStr);
    }
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  vals.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE cards SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    const updated = rows[0];

    const full = await fetchCardFull(id);
    req.app.get('io').emit('card:updated', full);

    // Notify on "I'm on it" transition
    if (status === 'on_it' && old.status !== 'on_it' && current_user_id) {
      await notifyOther(current_user_id, 'Task claimed', `${userName(current_user_id)} is taking care of "${updated.title}" 💪`);
    }

    // Notify on assignment change
    if (
      assigned_to && (assigned_to === 'juli' || assigned_to === 'gino') &&
      assigned_to !== old.assigned_to && assigned_to !== current_user_id
    ) {
      await notifyOther(assigned_to, 'Task assigned to you', `${userName(current_user_id)} assigned you: "${updated.title}"`);
    }

    // Auto-create next instance when a recurring task is completed
    if (status === 'done' && old.is_recurring && old.recurring_frequency) {
      const nextDate = new Date();
      const freq = old.recurring_frequency;
      if (freq === 'daily')    nextDate.setDate(nextDate.getDate() + 1);
      else if (freq === 'weekly')   nextDate.setDate(nextDate.getDate() + 7);
      else if (freq === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
      else if (freq === 'monthly')  nextDate.setMonth(nextDate.getMonth() + 1);

      const nextDateStr = nextDate.toISOString().split('T')[0];
      const { rows: [next] } = await pool.query(`
        INSERT INTO cards (title, timeline, custom_date, assigned_to, tag, priority, is_recurring, recurring_frequency, notes, created_by)
        VALUES ($1, 'custom', $2, $3, $4, $5, true, $6, $7, $8)
        RETURNING *
      `, [old.title, nextDateStr, old.assigned_to, old.tag, old.priority, old.recurring_frequency, old.notes, old.created_by]);

      req.app.get('io').emit('card:created', { ...next, reactions: [], comments: [], subtasks: [], subtask_count: 0, subtask_done_count: 0 });
    }

    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cards/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    req.app.get('io').emit('card:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Subtasks ──────────────────────────────────────────────────────────────

// POST /cards/:id/subtasks
router.post('/:id/subtasks', async (req, res) => {
  const { title, assigned_to = 'either' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO subtasks (card_id, title, assigned_to) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, title, assigned_to]
    );

    const full = await fetchCardFull(req.params.id);
    req.app.get('io').emit('card:updated', full);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /cards/:id/subtasks/:sid
router.patch('/:id/subtasks/:sid', async (req, res) => {
  const { title, assigned_to, status, status_user_id } = req.body;

  const sets = [];
  const vals = [];
  let i = 1;

  if (title !== undefined)       { sets.push(`title = $${i++}`);       vals.push(title); }
  if (assigned_to !== undefined) { sets.push(`assigned_to = $${i++}`); vals.push(assigned_to); }
  if (status !== undefined) {
    sets.push(`status = $${i++}`); vals.push(status);
    if (status === 'on_it' || status === 'done') {
      sets.push(`status_user_id = $${i++}`);    vals.push(status_user_id || null);
      sets.push(`status_updated_at = $${i++}`); vals.push(new Date().toISOString());
    } else if (status === 'pending') {
      sets.push(`status_user_id = $${i++}`);    vals.push(null);
      sets.push(`status_updated_at = $${i++}`); vals.push(null);
    }
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  try {
    vals.push(req.params.sid);
    const { rows } = await pool.query(
      `UPDATE subtasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Subtask not found' });

    const full = await fetchCardFull(req.params.id);
    req.app.get('io').emit('card:updated', full);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cards/:id/subtasks/:sid
router.delete('/:id/subtasks/:sid', async (req, res) => {
  try {
    await pool.query('DELETE FROM subtasks WHERE id = $1', [req.params.sid]);

    const full = await fetchCardFull(req.params.id);
    req.app.get('io').emit('card:updated', full);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Comments ──────────────────────────────────────────────────────────────

// POST /cards/:id/comments
router.post('/:id/comments', async (req, res) => {
  const { user_id, text } = req.body;
  if (!user_id || !text) return res.status(400).json({ error: 'user_id and text are required' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO comments (card_id, user_id, text) VALUES ($1, $2, $3) RETURNING *
    `, [req.params.id, user_id, text]);

    req.app.get('io').emit('comment:added', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reactions ─────────────────────────────────────────────────────────────

// POST /cards/:id/reactions — upsert reaction (one per user per card)
router.post('/:id/reactions', async (req, res) => {
  const { user_id, emoji } = req.body;
  if (!user_id || !emoji) return res.status(400).json({ error: 'user_id and emoji are required' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO reactions (card_id, user_id, emoji)
      VALUES ($1, $2, $3)
      ON CONFLICT (card_id, user_id) DO UPDATE SET emoji = $3
      RETURNING *
    `, [req.params.id, user_id, emoji]);

    req.app.get('io').emit('reaction:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cards/:id/reactions/:userId
router.delete('/:id/reactions/:userId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM reactions WHERE card_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    req.app.get('io').emit('reaction:updated', { card_id: req.params.id, user_id: req.params.userId, removed: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
