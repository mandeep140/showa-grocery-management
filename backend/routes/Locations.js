const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM locations WHERE is_active = 1 ORDER BY name`);
    res.json({ success: true, locations: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM locations WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, location: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, location_type, address } = req.body;
    if (!name || !location_type) return res.status(400).json({ success: false, message: 'Name and location type are required' });
    const result = await dbRun(`INSERT INTO locations (name, location_type, address) VALUES (?, ?, ?)`, [name, location_type, address || null]);
    res.status(201).json({ success: true, message: 'Location created', id: result.lastID });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Location already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, location_type, address, is_active } = req.body;
    if (!name || !location_type) return res.status(400).json({ success: false, message: 'Name and location type are required' });
    const result = await dbRun(`UPDATE locations SET name = ?, location_type = ?, address = ?, is_active = ? WHERE id = ?`, [name, location_type, address || null, is_active !== undefined ? is_active : 1, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Location already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const batches = await dbGet(`SELECT COUNT(*) as count FROM batches WHERE location_id = ? AND quantity_remaining > 0`, [req.params.id]);
    if (batches.count > 0) return res.status(400).json({ success: false, message: `Cannot delete. Location has ${batches.count} active batch(es).` });
    const result = await dbRun(`DELETE FROM locations WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Location not found' });
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
