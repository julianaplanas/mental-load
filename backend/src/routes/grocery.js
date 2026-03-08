const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyOther, userName } = require('../notifications');

// GET /grocery — all items, unchecked first (by category), checked last
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM grocery_items
      ORDER BY
        is_checked ASC,
        CASE WHEN category IS NULL THEN 1 ELSE 0 END,
        category,
        created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /grocery — add single item
router.post('/', async (req, res) => {
  const { name, quantity, category, added_by } = req.body;
  if (!name || !added_by) {
    return res.status(400).json({ error: 'name and added_by are required' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO grocery_items (name, quantity, category, added_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name.trim(), quantity || null, category || null, added_by]);

    const item = rows[0];
    req.app.get('io').emit('grocery:updated', { action: 'added', item });

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

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /grocery/checked — clear all checked items (must be before /:id)
router.delete('/checked', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM grocery_items WHERE is_checked = true RETURNING id'
    );
    req.app.get('io').emit('grocery:updated', {
      action: 'cleared_checked',
      ids: rows.map((r) => r.id),
    });
    res.json({ deleted: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /grocery/:id — update item (check/uncheck, rename, change qty/category)
router.patch('/:id', async (req, res) => {
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

  vals.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE grocery_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    req.app.get('io').emit('grocery:updated', { action: 'updated', item: rows[0] });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /grocery/:id — delete single item
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items WHERE id = $1', [req.params.id]);
    req.app.get('io').emit('grocery:updated', { action: 'deleted', id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
