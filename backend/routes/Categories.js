const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM categories WHERE is_active = 1 ORDER BY name`);
    res.json({ success: true, categories: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM categories WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requirePermission(['inventory_create', 'inventory_edit']), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const result = await dbRun(`INSERT INTO categories (name, description) VALUES (?, ?)`, [name, description || null]);
    res.status(201).json({ success: true, message: 'Category created', id: result.lastID });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Category already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requirePermission(['inventory_create', 'inventory_edit']), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const result = await dbRun(`UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?`, [name, description || null, is_active !== undefined ? is_active : 1, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Category already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requirePermission('inventory_delete'), async (req, res) => {
  try {
    const products = await dbGet(`SELECT COUNT(*) as count FROM products WHERE category_id = ?`, [req.params.id]);
    if (products.count > 0) return res.status(400).json({ success: false, message: `Cannot delete. ${products.count} product(s) use this category.` });
    const result = await dbRun(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
