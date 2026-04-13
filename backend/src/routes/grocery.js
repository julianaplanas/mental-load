const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyOther, userName } = require('../notifications');

// ---------- LISTS ----------

// GET /grocery/lists — all lists with item counts
router.get('/lists', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /grocery/lists — create a list
router.post('/lists', async (req, res) => {
  const { name, emoji, created_by } = req.body;
  if (!name || !created_by) {
    return res.status(400).json({ error: 'name and created_by are required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO grocery_lists (name, emoji, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), emoji || '🛒', created_by]
    );
    const list = rows[0];

    // Broadcast updated lists
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /grocery/lists/:listId — delete list (cascade deletes items)
router.delete('/lists/:listId', async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_lists WHERE id = $1', [req.params.listId]);

    // Broadcast updated lists
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ITEMS (list-scoped) ----------

// GET /grocery/lists/:listId/items — items in a list
router.get('/lists/:listId/items', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM grocery_items
      WHERE list_id = $1
      ORDER BY
        is_checked ASC,
        CASE WHEN category IS NULL THEN 1 ELSE 0 END,
        category,
        created_at ASC
    `, [req.params.listId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /grocery/lists/:listId/items — add item to a list
router.post('/lists/:listId/items', async (req, res) => {
  const { name, quantity, category, added_by } = req.body;
  const listId = req.params.listId;
  if (!name || !added_by) {
    return res.status(400).json({ error: 'name and added_by are required' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO grocery_items (name, quantity, category, added_by, list_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), quantity || null, category || null, added_by, listId]);

    const item = rows[0];
    req.app.get('io').emit('grocery:updated', { action: 'added', item, list_id: listId });

    // Notify other person when this user hits their 3rd item in 60 seconds
    const { rows: recent } = await pool.query(`
      SELECT COUNT(*) FROM grocery_items
      WHERE added_by = $1 AND created_at > NOW() - INTERVAL '60 seconds'
    `, [added_by]);

    if (parseInt(recent[0].count) === 3) {
      await notifyOther(
        added_by,
        'Grocery list updated',
        `${userName(added_by)} added some things to the grocery list 🛒`
      );
    }

    // Also broadcast lists_updated so list counts refresh
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /grocery/lists/:listId/items/checked — clear checked items in a list
router.delete('/lists/:listId/items/checked', async (req, res) => {
  const listId = req.params.listId;
  try {
    const { rows } = await pool.query(
      'DELETE FROM grocery_items WHERE list_id = $1 AND is_checked = true RETURNING id',
      [listId]
    );
    req.app.get('io').emit('grocery:updated', {
      action: 'cleared_checked',
      ids: rows.map((r) => r.id),
      list_id: listId,
    });

    // Also broadcast lists_updated so list counts refresh
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.json({ deleted: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ITEMS (item-level) ----------

// PATCH /grocery/items/:itemId — update item
router.patch('/items/:itemId', async (req, res) => {
  const { name, quantity, category, is_checked } = req.body;

  const sets = [];
  const vals = [];
  let i = 1;
  const set = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (name !== undefined) set('name', name.trim());
  if (quantity !== undefined) set('quantity', quantity || null);
  if (category !== undefined) set('category', category || null);
  if (is_checked !== undefined) set('is_checked', is_checked);

  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  vals.push(req.params.itemId);
  try {
    const { rows } = await pool.query(
      `UPDATE grocery_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    const item = rows[0];
    req.app.get('io').emit('grocery:updated', { action: 'updated', item, list_id: item.list_id });

    // Also broadcast lists_updated so list counts refresh
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /grocery/items/:itemId — delete single item
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM grocery_items WHERE id = $1 RETURNING list_id',
      [req.params.itemId]
    );
    const listId = rows[0]?.list_id;
    req.app.get('io').emit('grocery:updated', { action: 'deleted', id: req.params.itemId, list_id: listId });

    // Also broadcast lists_updated so list counts refresh
    const { rows: lists } = await pool.query(`
      SELECT gl.*,
        COUNT(gi.id)::int AS item_count,
        COUNT(gi.id) FILTER (WHERE gi.is_checked = false)::int AS unchecked_count
      FROM grocery_lists gl
      LEFT JOIN grocery_items gi ON gi.list_id = gl.id
      GROUP BY gl.id
      ORDER BY gl.created_at ASC
    `);
    req.app.get('io').emit('grocery:lists_updated', lists);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
