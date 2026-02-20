const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, is_active } = req.query;
    let sql = `SELECT s.*, COALESCE(SUM(p.final_amount), 0) as total_purchase_amount,
      COALESCE(SUM(p.paid_amount), 0) as total_paid,
      COALESCE(SUM(p.final_amount - p.paid_amount), 0) as total_pending
      FROM sellers s
      LEFT JOIN purchases p ON s.id = p.seller_id
      WHERE 1=1`;
    const params = [];

    if (search) { sql += ` AND (s.name LIKE ? OR s.company_name LIKE ? OR s.phone LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (is_active !== undefined) { sql += ` AND s.is_active = ?`; params.push(is_active); }

    sql += ` GROUP BY s.id ORDER BY s.name ASC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, sellers: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const seller = await dbGet(`SELECT * FROM sellers WHERE id = ?`, [req.params.id]);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const stats = await dbGet(
      `SELECT COUNT(*) as total_purchases, COALESCE(SUM(final_amount), 0) as total_purchase_amount,
        COALESCE(SUM(paid_amount), 0) as total_paid, COALESCE(SUM(final_amount - paid_amount), 0) as total_pending
      FROM purchases WHERE seller_id = ?`,
      [req.params.id]
    );

    const recentPurchases = await dbAll(
      `SELECT p.*, l.name as location_name FROM purchases p LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.seller_id = ? ORDER BY p.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    const recentPayments = await dbAll(
      `SELECT sp.*, u.name as paid_by_name, p.invoice_number FROM seller_payments sp
      LEFT JOIN users u ON sp.paid_by = u.id
      LEFT JOIN purchases p ON sp.purchase_id = p.id
      WHERE sp.seller_id = ? ORDER BY sp.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    const products = await dbAll(
      `SELECT DISTINCT p.id, p.name, p.product_code FROM products p
      JOIN purchase_items pi ON p.id = pi.product_id
      JOIN purchases pu ON pi.purchase_id = pu.id
      WHERE pu.seller_id = ? ORDER BY p.name`,
      [req.params.id]
    );

    seller.stats = stats;
    seller.recent_purchases = recentPurchases;
    seller.recent_payments = recentPayments;
    seller.products = products;

    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, company_name, address, phone, email, gst, opening_balance, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const result = await dbRun(
      `INSERT INTO sellers (name, company_name, address, phone, email, gst, opening_balance, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, company_name || null, address || null, phone || null, email || null, gst || null, opening_balance || 0, notes || null]
    );

    res.status(201).json({ success: true, message: 'Seller created', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, company_name, address, phone, email, gst, opening_balance, notes, is_active } = req.body;
    const seller = await dbGet(`SELECT * FROM sellers WHERE id = ?`, [req.params.id]);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await dbRun(
      `UPDATE sellers SET name = ?, company_name = ?, address = ?, phone = ?, email = ?, gst = ?, opening_balance = ?, notes = ?, is_active = ? WHERE id = ?`,
      [
        name || seller.name,
        company_name !== undefined ? company_name : seller.company_name,
        address !== undefined ? address : seller.address,
        phone !== undefined ? phone : seller.phone,
        email !== undefined ? email : seller.email,
        gst !== undefined ? gst : seller.gst,
        opening_balance !== undefined ? opening_balance : seller.opening_balance,
        notes !== undefined ? notes : seller.notes,
        is_active !== undefined ? is_active : seller.is_active,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Seller updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pending = await dbGet(
      `SELECT COALESCE(SUM(final_amount - paid_amount), 0) as pending FROM purchases WHERE seller_id = ? AND payment_status != 'paid'`,
      [req.params.id]
    );
    if (pending.pending > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete seller with pending payments' });
    }

    await dbRun(`UPDATE sellers SET is_active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Seller deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/purchases', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, payment_status } = req.query;
    let sql = `SELECT p.*, l.name as location_name, u.name as created_by_name FROM purchases p
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.seller_id = ?`;
    const params = [req.params.id];

    if (start_date) { sql += ` AND p.purchase_date >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND p.purchase_date <= ?`; params.push(end_date); }
    if (payment_status) { sql += ` AND p.payment_status = ?`; params.push(payment_status); }

    sql += ` ORDER BY p.created_at DESC`;
    const purchases = await dbAll(sql, params);
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/payments', verifyToken, async (req, res) => {
  try {
    const payments = await dbAll(
      `SELECT sp.*, u.name as paid_by_name, p.invoice_number FROM seller_payments sp
      LEFT JOIN users u ON sp.paid_by = u.id
      LEFT JOIN purchases p ON sp.purchase_id = p.id
      WHERE sp.seller_id = ? ORDER BY sp.created_at DESC`,
      [req.params.id]
    );

    const summary = await dbGet(
      `SELECT COALESCE(SUM(final_amount), 0) as total_purchase_amount,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(final_amount - paid_amount), 0) as total_pending
      FROM purchases WHERE seller_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, payments, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/pay', verifyToken, async (req, res) => {
  try {
    const { amount, purchase_id, payment_method, payment_type, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    const seller = await dbGet(`SELECT * FROM sellers WHERE id = ?`, [req.params.id]);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await dbRun(
      `INSERT INTO seller_payments (seller_id, purchase_id, amount, payment_method, payment_type, notes, paid_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, purchase_id || null, amount, payment_method || 'cash', payment_type || 'payment', notes || null, req.user.id]
    );

    if (purchase_id) {
      const purchase = await dbGet(`SELECT * FROM purchases WHERE id = ? AND seller_id = ?`, [purchase_id, req.params.id]);
      if (purchase) {
        const newPaid = purchase.paid_amount + amount;
        const finalAmount = purchase.final_amount;
        let paymentStatus = 'pending';
        if (newPaid >= finalAmount) paymentStatus = 'paid';
        else if (newPaid > 0) paymentStatus = 'partial';

        await dbRun(
          `UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?`,
          [Math.min(newPaid, finalAmount), paymentStatus, purchase_id]
        );
      }
    } else {
      const unpaidPurchases = await dbAll(
        `SELECT * FROM purchases WHERE seller_id = ? AND payment_status != 'paid' ORDER BY created_at ASC`,
        [req.params.id]
      );

      let remainingPayment = amount;
      for (const purchase of unpaidPurchases) {
        if (remainingPayment <= 0) break;
        const due = purchase.final_amount - purchase.paid_amount;
        const payAmount = Math.min(remainingPayment, due);
        const newPaid = purchase.paid_amount + payAmount;
        let paymentStatus = newPaid >= purchase.final_amount ? 'paid' : 'partial';

        await dbRun(
          `UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?`,
          [newPaid, paymentStatus, purchase.id]
        );

        remainingPayment -= payAmount;
      }
    }

    res.json({ success: true, message: 'Payment recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
