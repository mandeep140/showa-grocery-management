const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, logStockHistory, deductStockFIFO, generateId } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { buyer_id, location_id, start_date, end_date, payment_status, status } = req.query;
    let sql = `SELECT o.*, b.name as buyer_name, b.phone as buyer_phone, l.name as location_name, u.name as created_by_name
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN locations l ON o.location_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE 1=1`;
    const params = [];

    if (buyer_id) { sql += ` AND o.buyer_id = ?`; params.push(buyer_id); }
    if (location_id) { sql += ` AND o.location_id = ?`; params.push(location_id); }
    if (start_date) { sql += ` AND DATE(o.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(o.created_at) <= ?`; params.push(end_date); }
    if (payment_status) { sql += ` AND o.payment_status = ?`; params.push(payment_status); }
    if (status) { sql += ` AND o.status = ?`; params.push(status); }

    sql += ` ORDER BY o.created_at DESC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, orders: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const orders = await dbAll(
      `SELECT o.*, b.name as buyer_name, l.name as location_name, u.name as created_by_name
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN locations l ON o.location_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE DATE(o.created_at) = ? AND o.status = 'completed'
      ORDER BY o.created_at DESC`,
      [today]
    );
    const summary = await dbGet(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(final_amount), 0) as total_sales, COALESCE(SUM(received_amount), 0) as total_received,
        COALESCE(SUM(final_amount - received_amount), 0) as total_credit, COALESCE(SUM(total_sell_price - total_buy_price), 0) as total_profit
      FROM orders WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );
    res.json({ success: true, orders, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await dbGet(
      `SELECT o.*, b.name as buyer_name, b.phone as buyer_phone, b.address as buyer_address,
        l.name as location_name, u.name as created_by_name
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN locations l ON o.location_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const rawItems = await dbAll(
      `SELECT oi.*, p.name as product_name, p.product_code, p.unit, bt.batch_no, bt.expire_date
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN batches bt ON oi.batch_id = bt.id
      WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const grouped = {};
    for (const item of rawItems) {
      if (!grouped[item.product_id]) {
        grouped[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          unit: item.unit,
          selling_price: item.selling_price,
          discount_percent: item.discount_percent,
          tax_percent: item.tax_percent,
          total_quantity: 0,
          total_subtotal: 0,
          batches: []
        };
      }
      grouped[item.product_id].total_quantity += item.quantity;
      grouped[item.product_id].total_subtotal += item.subtotal;
      grouped[item.product_id].batches.push({
        batch_id: item.batch_id,
        batch_no: item.batch_no,
        expire_date: item.expire_date,
        quantity: item.quantity,
        buying_rate: item.buying_rate
      });
    }

    order.items = Object.values(grouped);
    order.raw_items = rawItems;

    const debt = await dbGet(`SELECT * FROM debts WHERE order_id = ?`, [req.params.id]);
    if (debt) {
      const payments = await dbAll(`SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY created_at DESC`, [debt.id]);
      debt.payments = payments;
      order.debt = debt;
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { buyer_id, location_id, discount_amount, received_amount, payment_method, notes, items } = req.body;

    if (!buyer_id || !location_id || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Buyer, location, and items are required' });
    }

    const buyer = await dbGet(`SELECT * FROM buyers WHERE id = ? AND is_active = 1`, [buyer_id]);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    const location = await dbGet(`SELECT * FROM locations WHERE id = ? AND is_active = 1`, [location_id]);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.selling_price) {
        return res.status(400).json({ success: false, message: 'Each item needs product_id, quantity, and selling_price' });
      }
      const totalStock = await dbGet(
        `SELECT COALESCE(SUM(quantity_remaining), 0) as stock FROM batches WHERE product_id = ? AND location_id = ? AND quantity_remaining > 0`,
        [item.product_id, location_id]
      );
      if (totalStock.stock < item.quantity) {
        const product = await dbGet(`SELECT name FROM products WHERE id = ?`, [item.product_id]);
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product?.name}". Available: ${totalStock.stock}, Requested: ${item.quantity}` });
      }
    }

    const invoiceId = generateId('INV');
    let totalBuyPrice = 0;
    let totalSellPrice = 0;
    let taxAmount = 0;
    const allDeductions = [];

    for (const item of items) {
      const deductions = await deductStockFIFO(item.product_id, location_id, item.quantity);
      const itemBuyTotal = deductions.reduce((sum, d) => sum + (d.buying_rate * d.quantity), 0);
      const itemSellSubtotal = item.quantity * item.selling_price;
      const itemDiscount = itemSellSubtotal * (item.discount_percent || 0) / 100;
      const itemTax = (itemSellSubtotal - itemDiscount) * (item.tax_percent || 0) / 100;

      totalBuyPrice += itemBuyTotal;
      totalSellPrice += itemSellSubtotal - itemDiscount;
      taxAmount += itemTax;

      allDeductions.push({ item, deductions, itemBuyTotal });
    }

    const finalAmount = totalSellPrice + taxAmount - (discount_amount || 0);
    const receivedAmt = received_amount || 0;
    let paymentStatus = 'pending';
    if (receivedAmt >= finalAmount) paymentStatus = 'paid';
    else if (receivedAmt > 0) paymentStatus = 'partial';

    const orderResult = await dbRun(
      `INSERT INTO orders (invoice_id, buyer_id, location_id, total_buy_price, total_sell_price, discount_amount, tax_amount, final_amount, received_amount, payment_method, payment_status, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [invoiceId, buyer_id, location_id, totalBuyPrice, totalSellPrice, discount_amount || 0, taxAmount, finalAmount, receivedAmt, payment_method || 'cash', paymentStatus, notes || null, req.user.id]
    );

    const orderId = orderResult.lastID;

    for (const { item, deductions } of allDeductions) {
      for (const d of deductions) {
        const subtotal = d.quantity * item.selling_price;
        const itemDiscount = subtotal * (item.discount_percent || 0) / 100;

        await dbRun(
          `INSERT INTO order_items (order_id, product_id, batch_id, quantity, buying_rate, selling_price, discount_percent, tax_percent, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, d.batch_id, d.quantity, d.buying_rate, item.selling_price, item.discount_percent || 0, item.tax_percent || 0, subtotal - itemDiscount]
        );

        await logStockHistory({
          productId: item.product_id,
          batchId: d.batch_id,
          locationId: location_id,
          referenceType: 'sale',
          referenceId: orderId,
          quantityBefore: d.quantity_before,
          quantityChange: d.quantity,
          quantityAfter: d.quantity_after,
          movementType: 'out',
          notes: `Sale ${invoiceId}`,
          createdBy: req.user.id
        });
      }
    }

    if (paymentStatus !== 'paid') {
      const debtAmount = finalAmount - receivedAmt;
      await dbRun(
        `INSERT INTO debts (order_id, buyer_id, total_amount, paid_amount, amount_remaining, status)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, buyer_id, finalAmount, receivedAmt, debtAmount, paymentStatus]
      );
    }

    res.status(201).json({ success: true, message: 'Order created', id: orderId, invoice_id: invoiceId, final_amount: finalAmount, payment_status: paymentStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const order = await dbGet(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Order is already cancelled' });

    const orderItems = await dbAll(`SELECT * FROM order_items WHERE order_id = ?`, [req.params.id]);

    for (const item of orderItems) {
      const batch = await dbGet(`SELECT * FROM batches WHERE id = ?`, [item.batch_id]);
      if (batch) {
        const newQuantity = batch.quantity_remaining + item.quantity;
        await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newQuantity, item.batch_id]);

        await logStockHistory({
          productId: item.product_id,
          batchId: item.batch_id,
          locationId: order.location_id,
          referenceType: 'cancellation',
          referenceId: order.id,
          quantityBefore: batch.quantity_remaining,
          quantityChange: item.quantity,
          quantityAfter: newQuantity,
          movementType: 'in',
          notes: `Order cancelled ${order.invoice_id}`,
          createdBy: req.user.id
        });
      }
    }

    await dbRun(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [req.params.id]);

    const debt = await dbGet(`SELECT * FROM debts WHERE order_id = ?`, [req.params.id]);
    if (debt) {
      await dbRun(`UPDATE debts SET status = 'cancelled', amount_remaining = 0 WHERE id = ?`, [debt.id]);
    }

    res.json({ success: true, message: 'Order cancelled and stock restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
