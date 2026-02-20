const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, logStockHistory, addStockToBatch, generateId } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/customer', verifyToken, async (req, res) => {
  try {
    const { buyer_id, start_date, end_date } = req.query;
    let sql = `SELECT cr.*, b.name as buyer_name, b.phone as buyer_phone, l.name as location_name,
      o.invoice_id, u.name as created_by_name
      FROM customer_returns cr
      JOIN buyers b ON cr.buyer_id = b.id
      JOIN locations l ON cr.location_id = l.id
      LEFT JOIN orders o ON cr.order_id = o.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE 1=1`;
    const params = [];

    if (buyer_id) { sql += ` AND cr.buyer_id = ?`; params.push(buyer_id); }
    if (start_date) { sql += ` AND DATE(cr.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(cr.created_at) <= ?`; params.push(end_date); }

    sql += ` ORDER BY cr.created_at DESC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, returns: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/customer/:id', verifyToken, async (req, res) => {
  try {
    const ret = await dbGet(
      `SELECT cr.*, b.name as buyer_name, l.name as location_name, o.invoice_id, u.name as created_by_name
      FROM customer_returns cr
      JOIN buyers b ON cr.buyer_id = b.id
      JOIN locations l ON cr.location_id = l.id
      LEFT JOIN orders o ON cr.order_id = o.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.id = ?`,
      [req.params.id]
    );
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });

    const items = await dbAll(
      `SELECT cri.*, p.name as product_name, p.product_code, p.unit, bt.batch_no
      FROM customer_return_items cri
      JOIN products p ON cri.product_id = p.id
      JOIN batches bt ON cri.batch_id = bt.id
      WHERE cri.return_id = ?`,
      [req.params.id]
    );

    ret.items = items;
    res.json({ success: true, return: ret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/customer', verifyToken, async (req, res) => {
  try {
    const { order_id, buyer_id, location_id, refund_method, reason, items } = req.body;

    if (!buyer_id || !location_id || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Buyer, location, and items are required' });
    }

    let totalRefund = 0;
    for (const item of items) {
      if (!item.product_id || !item.batch_id || !item.quantity || !item.selling_price) {
        return res.status(400).json({ success: false, message: 'Each item needs product_id, batch_id, quantity, and selling_price' });
      }
      totalRefund += item.quantity * item.selling_price;
    }

    const returnNumber = generateId('CRET');
    const returnResult = await dbRun(
      `INSERT INTO customer_returns (return_number, order_id, buyer_id, location_id, total_amount, refund_method, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [returnNumber, order_id || null, buyer_id, location_id, totalRefund, refund_method || 'cash', reason || null, req.user.id]
    );

    const returnId = returnResult.lastID;

    for (const item of items) {
      const stockResult = await addStockToBatch(item.batch_id, item.quantity);

      let orderItemId = null;
      if (order_id && item.order_item_id) {
        orderItemId = item.order_item_id;
      }

      await dbRun(
        `INSERT INTO customer_return_items (return_id, order_item_id, product_id, batch_id, quantity, selling_price, refund_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [returnId, orderItemId, item.product_id, item.batch_id, item.quantity, item.selling_price, item.quantity * item.selling_price]
      );

      await logStockHistory({
        productId: item.product_id,
        batchId: item.batch_id,
        locationId: location_id,
        referenceType: 'customer_return',
        referenceId: returnId,
        quantityBefore: stockResult.quantity_before,
        quantityChange: item.quantity,
        quantityAfter: stockResult.quantity_after,
        movementType: 'in',
        notes: `Customer return ${returnNumber}`,
        createdBy: req.user.id
      });
    }

    if (order_id && refund_method === 'debt_adjustment') {
      const debt = await dbGet(`SELECT * FROM debts WHERE order_id = ? AND buyer_id = ?`, [order_id, buyer_id]);
      if (debt && debt.amount_remaining > 0) {
        const deductAmount = Math.min(totalRefund, debt.amount_remaining);
        const newRemaining = debt.amount_remaining - deductAmount;
        const newPaid = debt.paid_amount + deductAmount;
        const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

        await dbRun(
          `UPDATE debts SET paid_amount = ?, amount_remaining = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
          [newPaid, Math.max(0, newRemaining), newStatus, debt.id]
        );
      }
    }

    res.status(201).json({ success: true, message: 'Customer return processed', id: returnId, return_number: returnNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seller', verifyToken, async (req, res) => {
  try {
    const { seller_id, start_date, end_date } = req.query;
    let sql = `SELECT sr.*, s.name as seller_name, s.company_name, l.name as location_name,
      p.invoice_number, u.name as created_by_name
      FROM seller_returns sr
      JOIN sellers s ON sr.seller_id = s.id
      JOIN locations l ON sr.location_id = l.id
      LEFT JOIN purchases p ON sr.purchase_id = p.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE 1=1`;
    const params = [];

    if (seller_id) { sql += ` AND sr.seller_id = ?`; params.push(seller_id); }
    if (start_date) { sql += ` AND DATE(sr.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(sr.created_at) <= ?`; params.push(end_date); }

    sql += ` ORDER BY sr.created_at DESC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, returns: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seller/:id', verifyToken, async (req, res) => {
  try {
    const ret = await dbGet(
      `SELECT sr.*, s.name as seller_name, l.name as location_name, p.invoice_number, u.name as created_by_name
      FROM seller_returns sr
      JOIN sellers s ON sr.seller_id = s.id
      JOIN locations l ON sr.location_id = l.id
      LEFT JOIN purchases p ON sr.purchase_id = p.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE sr.id = ?`,
      [req.params.id]
    );
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });

    const items = await dbAll(
      `SELECT sri.*, p.name as product_name, p.product_code, p.unit, bt.batch_no
      FROM seller_return_items sri
      JOIN products p ON sri.product_id = p.id
      JOIN batches bt ON sri.batch_id = bt.id
      WHERE sri.return_id = ?`,
      [req.params.id]
    );

    ret.items = items;
    res.json({ success: true, return: ret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seller', verifyToken, async (req, res) => {
  try {
    const { seller_id, purchase_id, location_id, refund_method, reason, items } = req.body;

    if (!seller_id || !location_id || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Seller, location, and items are required' });
    }

    let totalRefund = 0;
    for (const item of items) {
      if (!item.product_id || !item.batch_id || !item.quantity || !item.buying_rate) {
        return res.status(400).json({ success: false, message: 'Each item needs product_id, batch_id, quantity, and buying_rate' });
      }

      const batch = await dbGet(`SELECT * FROM batches WHERE id = ?`, [item.batch_id]);
      if (!batch || batch.quantity_remaining < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock in batch ${item.batch_id}` });
      }
      totalRefund += item.quantity * item.buying_rate;
    }

    const returnNumber = generateId('SRET');
    const returnResult = await dbRun(
      `INSERT INTO seller_returns (return_number, seller_id, purchase_id, location_id, total_amount, refund_method, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [returnNumber, seller_id, purchase_id || null, location_id, totalRefund, refund_method || 'credit', reason || null, req.user.id]
    );

    const returnId = returnResult.lastID;

    for (const item of items) {
      const batch = await dbGet(`SELECT * FROM batches WHERE id = ?`, [item.batch_id]);
      const newQuantity = batch.quantity_remaining - item.quantity;
      await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newQuantity, item.batch_id]);

      let purchaseItemId = null;
      if (item.purchase_item_id) {
        purchaseItemId = item.purchase_item_id;
      }

      await dbRun(
        `INSERT INTO seller_return_items (return_id, purchase_item_id, product_id, batch_id, quantity, buying_rate, refund_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [returnId, purchaseItemId, item.product_id, item.batch_id, item.quantity, item.buying_rate, item.quantity * item.buying_rate]
      );

      await logStockHistory({
        productId: item.product_id,
        batchId: item.batch_id,
        locationId: location_id,
        referenceType: 'seller_return',
        referenceId: returnId,
        quantityBefore: batch.quantity_remaining,
        quantityChange: item.quantity,
        quantityAfter: newQuantity,
        movementType: 'out',
        notes: `Seller return ${returnNumber}`,
        createdBy: req.user.id
      });
    }

    if (purchase_id) {
      const purchase = await dbGet(`SELECT * FROM purchases WHERE id = ?`, [purchase_id]);
      if (purchase) {
        const newTotal = purchase.final_amount - totalRefund;
        await dbRun(`UPDATE purchases SET final_amount = ?, total_amount = total_amount - ? WHERE id = ?`, [Math.max(0, newTotal), totalRefund, purchase_id]);
      }
    }

    res.status(201).json({ success: true, message: 'Seller return processed', id: returnId, return_number: returnNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
