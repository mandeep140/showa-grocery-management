const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, logStockHistory } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, requirePermission('purchase_view'), async (req, res) => {
  try {
    const { seller_id, start_date, end_date, payment_status } = req.query;
    let sql = `SELECT p.*, s.name as seller_name, s.company_name, l.name as location_name, u.name as created_by_name
      FROM purchases p
      LEFT JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1`;
    const params = [];

    if (seller_id) { sql += ` AND p.seller_id = ?`; params.push(seller_id); }
    if (start_date) { sql += ` AND p.purchase_date >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND p.purchase_date <= ?`; params.push(end_date); }
    if (payment_status) { sql += ` AND p.payment_status = ?`; params.push(payment_status); }

    sql += ` ORDER BY p.created_at DESC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, purchases: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, requirePermission('purchase_view'), async (req, res) => {
  try {
    const purchase = await dbGet(
      `SELECT p.*, s.name as seller_name, s.company_name, l.name as location_name, u.name as created_by_name
      FROM purchases p
      LEFT JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?`,
      [req.params.id]
    );
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    const items = await dbAll(
      `SELECT pi.*, pr.name as product_name, pr.product_code, pr.unit, b.batch_no, b.expire_date
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      JOIN batches b ON pi.batch_id = b.id
      WHERE pi.purchase_id = ?`,
      [req.params.id]
    );

    purchase.items = items;
    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requirePermission('purchase_create'), async (req, res) => {
  try {
    const { invoice_number, seller_id, location_id, purchase_date, discount_amount, paid_amount, notes, items } = req.body;

    if (!invoice_number || !seller_id || !location_id || !purchase_date || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Invoice number, seller, location, date, and items are required' });
    }

    let totalAmount = 0;
    let taxAmount = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.buying_rate) {
        return res.status(400).json({ success: false, message: 'Each item needs product_id, quantity, and buying_rate' });
      }
      const itemSubtotal = item.quantity * item.buying_rate;
      const itemDiscount = itemSubtotal * (item.discount_percent || 0) / 100;
      const itemTax = (itemSubtotal - itemDiscount) * (item.tax_percent || 0) / 100;
      totalAmount += itemSubtotal - itemDiscount;
      taxAmount += itemTax;
    }

    const finalAmount = totalAmount + taxAmount - (discount_amount || 0);
    const paidAmt = paid_amount || 0;
    let paymentStatus = 'pending';
    if (paidAmt >= finalAmount) paymentStatus = 'paid';
    else if (paidAmt > 0) paymentStatus = 'partial';

    await dbRun('BEGIN');
    try {
      const purchaseResult = await dbRun(
        `INSERT INTO purchases (invoice_number, seller_id, location_id, total_amount, discount_amount, tax_amount, final_amount, payment_status, paid_amount, purchase_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice_number, seller_id, location_id, totalAmount, discount_amount || 0, taxAmount, finalAmount, paymentStatus, paidAmt, purchase_date, notes || null, req.user.id]
      );

      const purchaseId = purchaseResult.lastID;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const batchNo = item.batch_no || `B-${purchaseId}-${item.product_id}-${i}`;

        const batchResult = await dbRun(
          `INSERT INTO batches (batch_no, product_id, purchase_id, location_id, expire_date, quantity_initial, quantity_remaining, buying_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [batchNo, item.product_id, purchaseId, location_id, item.expire_date || null, item.quantity, item.quantity, item.buying_rate]
        );

        const batchId = batchResult.lastID;
        const itemSubtotal = item.quantity * item.buying_rate;
        const itemDiscount = itemSubtotal * (item.discount_percent || 0) / 100;

        await dbRun(
          `INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, buying_rate, tax_percent, discount_percent, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, item.product_id, batchId, item.quantity, item.buying_rate, item.tax_percent || 0, item.discount_percent || 0, itemSubtotal - itemDiscount]
        );

        await logStockHistory({
          productId: item.product_id,
          batchId: batchId,
          locationId: location_id,
          referenceType: 'purchase',
          referenceId: purchaseId,
          quantityBefore: 0,
          quantityChange: item.quantity,
          quantityAfter: item.quantity,
          movementType: 'in',
          notes: `Purchase ${invoice_number}`,
          createdBy: req.user.id
        });
      }

      await dbRun('COMMIT');
      res.status(201).json({ success: true, message: 'Purchase created', id: purchaseId });
    } catch (txError) {
      await dbRun('ROLLBACK').catch(() => { });
      throw txError;
    }
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Invoice number already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requirePermission('purchase_create'), async (req, res) => {
  try {
    const { discount_amount, paid_amount, notes } = req.body;
    const purchase = await dbGet(`SELECT * FROM purchases WHERE id = ?`, [req.params.id]);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    const paidAmt = paid_amount !== undefined ? paid_amount : purchase.paid_amount;
    const discountAmt = discount_amount !== undefined ? discount_amount : purchase.discount_amount;
    const finalAmount = purchase.total_amount + purchase.tax_amount - discountAmt;
    let paymentStatus = 'pending';
    if (paidAmt >= finalAmount) paymentStatus = 'paid';
    else if (paidAmt > 0) paymentStatus = 'partial';

    await dbRun(
      `UPDATE purchases SET discount_amount = ?, paid_amount = ?, payment_status = ?, final_amount = ?, notes = ? WHERE id = ?`,
      [discountAmt, paidAmt, paymentStatus, finalAmount, notes !== undefined ? notes : purchase.notes, req.params.id]
    );

    res.json({ success: true, message: 'Purchase updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requirePermission('purchase_delete'), async (req, res) => {
  try {
    const purchase = await dbGet(`SELECT * FROM purchases WHERE id = ?`, [req.params.id]);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    const items = await dbAll(`SELECT pi.*, b.quantity_initial, b.quantity_remaining FROM purchase_items pi JOIN batches b ON pi.batch_id = b.id WHERE pi.purchase_id = ?`, [req.params.id]);

    for (const item of items) {
      if (item.quantity_remaining < item.quantity_initial) {
        return res.status(400).json({ success: false, message: 'Cannot delete purchase. Some stock has already been used.' });
      }
    }

    for (const item of items) {
      await dbRun(`DELETE FROM batches WHERE id = ?`, [item.batch_id]);
    }

    await dbRun(`DELETE FROM purchase_items WHERE purchase_id = ?`, [req.params.id]);
    await dbRun(`DELETE FROM stock_history WHERE reference_type = 'purchase' AND reference_id = ?`, [req.params.id]);
    await dbRun(`DELETE FROM purchases WHERE id = ?`, [req.params.id]);

    res.json({ success: true, message: 'Purchase deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
