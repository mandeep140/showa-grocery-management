const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const { location_id } = req.query;
    let sql = `SELECT p.id as product_id, p.product_code, p.name as product_name, p.unit,
      c.name as category_name, b.name as brand_name,
      p.default_selling_price, p.minimum_stock_level,
      COALESCE(SUM(bt.quantity_remaining), 0) as total_stock,
      CASE
        WHEN COALESCE(SUM(bt.quantity_remaining), 0) = 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(bt.quantity_remaining), 0) <= p.minimum_stock_level THEN 'low_stock'
        ELSE 'in_stock'
      END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN batches bt ON p.id = bt.product_id`;
    const params = [];

    if (location_id) {
      sql += ` AND bt.location_id = ?`;
      params.push(location_id);
    }

    sql += ` WHERE p.is_active = 1 GROUP BY p.id ORDER BY p.name`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, inventory: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/low-stock', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT p.id as product_id, p.product_code, p.name as product_name, p.unit,
        p.minimum_stock_level, COALESCE(SUM(bt.quantity_remaining), 0) as total_stock
      FROM products p
      LEFT JOIN batches bt ON p.id = bt.product_id
      WHERE p.is_active = 1
      GROUP BY p.id
      HAVING total_stock <= p.minimum_stock_level
      ORDER BY total_stock ASC`
    );
    res.json({ success: true, products: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expiring', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const rows = await dbAll(
      `SELECT b.id as batch_id, b.batch_no, b.quantity_remaining, b.expire_date, b.buying_rate,
        p.id as product_id, p.name as product_name, p.product_code,
        l.name as location_name,
        CAST((julianday(b.expire_date) - julianday('now')) AS INTEGER) as days_to_expire
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL AND b.quantity_remaining > 0
        AND julianday(b.expire_date) >= julianday('now')
        AND julianday(b.expire_date) - julianday('now') <= ?
      ORDER BY days_to_expire ASC`,
      [days]
    );
    res.json({ success: true, batches: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expired', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT b.id as batch_id, b.batch_no, b.quantity_remaining, b.expire_date, b.buying_rate,
        p.id as product_id, p.name as product_name, p.product_code,
        l.name as location_name, l.id as location_id,
        CAST((julianday('now') - julianday(b.expire_date)) AS INTEGER) as days_expired
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL AND b.quantity_remaining > 0
        AND julianday(b.expire_date) < julianday('now')
      ORDER BY days_expired DESC`
    );
    res.json({ success: true, batches: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/product/:productId', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const { location_id } = req.query;
    let sql = `SELECT b.*, l.name as location_name, p.name as product_name
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.product_id = ? AND b.quantity_remaining > 0`;
    const params = [req.params.productId];

    if (location_id) {
      sql += ` AND b.location_id = ?`;
      params.push(location_id);
    }

    sql += ` ORDER BY COALESCE(b.expire_date, '9999-12-31') ASC, b.created_at ASC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, batches: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batch/:batchId', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT b.*, l.name as location_name, p.name as product_name, p.product_code
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.id = ?`,
      [req.params.batchId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
