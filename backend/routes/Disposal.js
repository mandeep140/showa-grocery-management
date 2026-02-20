const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, logStockHistory } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { disposal_method, start_date, end_date } = req.query;
    let sql = `SELECT ep.*, p.name as product_name, p.product_code, l.name as location_name, b.batch_no, b.buying_rate, u.name as disposed_by_name
      FROM expired_products ep
      JOIN products p ON ep.product_id = p.id
      JOIN locations l ON ep.location_id = l.id
      JOIN batches b ON ep.batch_id = b.id
      LEFT JOIN users u ON ep.disposed_by = u.id
      WHERE 1=1`;
    const params = [];

    if (disposal_method) { sql += ` AND ep.disposal_method = ?`; params.push(disposal_method); }
    if (start_date) { sql += ` AND DATE(ep.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(ep.created_at) <= ?`; params.push(end_date); }

    sql += ` ORDER BY ep.created_at DESC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, disposals: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { batch_id, quantity, disposal_method, notes } = req.body;

    if (!batch_id || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Batch ID and valid quantity are required' });
    }

    const batch = await dbGet(
      `SELECT b.*, p.name as product_name FROM batches b JOIN products p ON b.product_id = p.id WHERE b.id = ?`,
      [batch_id]
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (batch.quantity_remaining < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${batch.quantity_remaining}` });
    }

    const newQuantity = batch.quantity_remaining - quantity;
    await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newQuantity, batch_id]);

    const result = await dbRun(
      `INSERT INTO expired_products (batch_id, product_id, location_id, quantity, expire_date, disposal_method, notes, disposed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, batch.product_id, batch.location_id, quantity, batch.expire_date, disposal_method || 'disposed', notes || null, req.user.id]
    );

    await logStockHistory({
      productId: batch.product_id,
      batchId: batch_id,
      locationId: batch.location_id,
      referenceType: 'disposal',
      referenceId: result.lastID,
      quantityBefore: batch.quantity_remaining,
      quantityChange: quantity,
      quantityAfter: newQuantity,
      movementType: 'out',
      notes: `${disposal_method || 'Disposal'}: ${notes || batch.product_name}`,
      createdBy: req.user.id
    });

    await dbRun(
      `INSERT INTO stock_adjustments (product_id, batch_id, location_id, adjustment_type, quantity, reason, adjusted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [batch.product_id, batch_id, batch.location_id, 'disposal', quantity, `${disposal_method || 'disposed'}: ${notes || ''}`, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Stock disposed', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { items, disposal_method, notes } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Items are required' });

    const results = [];

    for (const item of items) {
      const batch = await dbGet(
        `SELECT b.*, p.name as product_name FROM batches b JOIN products p ON b.product_id = p.id WHERE b.id = ?`,
        [item.batch_id]
      );
      if (!batch || batch.quantity_remaining < item.quantity) continue;

      const newQuantity = batch.quantity_remaining - item.quantity;
      await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newQuantity, item.batch_id]);

      const result = await dbRun(
        `INSERT INTO expired_products (batch_id, product_id, location_id, quantity, expire_date, disposal_method, notes, disposed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.batch_id, batch.product_id, batch.location_id, item.quantity, batch.expire_date, disposal_method || 'disposed', notes || null, req.user.id]
      );

      await logStockHistory({
        productId: batch.product_id,
        batchId: item.batch_id,
        locationId: batch.location_id,
        referenceType: 'disposal',
        referenceId: result.lastID,
        quantityBefore: batch.quantity_remaining,
        quantityChange: item.quantity,
        quantityAfter: newQuantity,
        movementType: 'out',
        notes: `Bulk ${disposal_method || 'disposal'}: ${batch.product_name}`,
        createdBy: req.user.id
      });

      await dbRun(
        `INSERT INTO stock_adjustments (product_id, batch_id, location_id, adjustment_type, quantity, reason, adjusted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [batch.product_id, item.batch_id, batch.location_id, 'disposal', item.quantity, `${disposal_method || 'disposed'}: ${notes || ''}`, req.user.id]
      );

      results.push({ batch_id: item.batch_id, product: batch.product_name, quantity: item.quantity });
    }

    res.status(201).json({ success: true, message: `Disposed ${results.length} items`, disposed: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
