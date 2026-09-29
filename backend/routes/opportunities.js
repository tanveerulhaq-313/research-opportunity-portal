// backend/routes/opportunities.js

const express = require('express');
const db = require('../db');
const { validateOpportunity } = require('../validators/opportunityValidator');

const router = express.Router();

// ============================================================
// 1. POST /api/opportunities  — Create a new opportunity
// ============================================================
router.post('/', async (req, res) => {
  const { valid, errors, data } = validateOpportunity(req.body, false);

  if (!valid) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const sql = `
      INSERT INTO opportunities
        (title, description, area, faculty_name, department, skills, positions, deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.title,
      data.description,
      data.area,
      data.faculty_name,
      data.department,
      data.skills,
      data.positions,
      data.deadline,
      data.status || 'Open',
    ];

    const [result] = await db.query(sql, values);

    // Fetch the newly created row to return it
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /opportunities error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ============================================================
// 2. GET /api/opportunities  — Retrieve all
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error('GET /opportunities error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ============================================================
// 3. GET /api/opportunities/:id  — Retrieve one
// ============================================================
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('GET /opportunities/:id error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ============================================================
// 4. PUT /api/opportunities/:id  — Update
// ============================================================
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const { valid, errors, data } = validateOpportunity(req.body, true);

  if (!valid) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    // Check existence first
    const [existing] = await db.query('SELECT id FROM opportunities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Build dynamic SET clause
    const fields = Object.keys(data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    values.push(id);

    await db.query(`UPDATE opportunities SET ${setClause} WHERE id = ?`, values);

    // Return the updated row
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('PUT /opportunities/:id error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ============================================================
// 5. DELETE /api/opportunities/:id  — Delete
// ============================================================
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const [result] = await db.query('DELETE FROM opportunities WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.status(200).json({ message: 'Opportunity deleted successfully', id });
  } catch (err) {
    console.error('DELETE /opportunities/:id error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;