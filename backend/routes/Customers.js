const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, requirePermission(['customers', 'billing', 'debts']), async (req, res) => {
  try {
    const { search, is_active, include_walkin } = req.query;
    let sql = `SELECT b.*,
      COALESCE((SELECT SUM(d.amount_remaining) FROM debts d WHERE d.buyer_id = b.id AND d.status IN ('pending', 'partial')), 0) as total_debt,
      COALESCE((SELECT COUNT(*) FROM orders o WHERE o.buyer_id = b.id AND o.status = 'completed'), 0) as total_orders
      FROM buyers b
      WHERE 1=1`;
    const params = [];

    // Hide walk-in customer unless explicitly requested
    if (!include_walkin && !search) { sql += ` AND b.name != 'Walk-in Customer'`; }
    if (search) { sql += ` AND (b.name LIKE ? OR b.phone LIKE ? OR b.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (is_active !== undefined) { sql += ` AND b.is_active = ?`; params.push(is_active); }

    sql += ` ORDER BY b.name ASC`;
    const rows = await dbAll(sql, params);
    res.json({ success: true, customers: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, requirePermission(['customers', 'billing', 'debts']), async (req, res) => {
  try {
    const customer = await dbGet(`SELECT * FROM buyers WHERE id = ?`, [req.params.id]);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const stats = await dbGet(
      `SELECT COUNT(DISTINCT o.id) as total_orders, COALESCE(SUM(o.final_amount), 0) as total_purchase_amount
      FROM orders o WHERE o.buyer_id = ? AND o.status = 'completed'`,
      [req.params.id]
    );

    const totalDebt = await dbGet(
      `SELECT COALESCE(SUM(amount_remaining), 0) as total_debt FROM debts WHERE buyer_id = ? AND status IN ('pending', 'partial')`,
      [req.params.id]
    );

    const recentOrders = await dbAll(
      `SELECT o.*, l.name as location_name FROM orders o LEFT JOIN locations l ON o.location_id = l.id
      WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    const pendingDebts = await dbAll(
      `SELECT d.*, o.invoice_id FROM debts d JOIN orders o ON d.order_id = o.id
      WHERE d.buyer_id = ? AND d.status IN ('pending', 'partial') ORDER BY d.created_at ASC`,
      [req.params.id]
    );

    // Get all debt payments for transaction history
    const allDebtPayments = await dbAll(
      `SELECT dp.*, d.order_id, o.invoice_id FROM debt_payments dp
      JOIN debts d ON dp.debt_id = d.id
      JOIN orders o ON d.order_id = o.id
      WHERE d.buyer_id = ? ORDER BY dp.created_at DESC`,
      [req.params.id]
    );

    // Total paid = total purchased - outstanding debt + advance (simple, always accurate)
    const totalPaid = (stats.total_purchase_amount || 0) - (totalDebt.total_debt || 0) + (customer.advance_balance || 0);

    stats.total_paid = Math.max(0, totalPaid);
    customer.stats = stats;
    customer.total_debt = totalDebt.total_debt;
    customer.advance_balance = customer.advance_balance || 0;
    customer.recent_orders = recentOrders;
    customer.pending_debts = pendingDebts;
    customer.debt_payments = allDebtPayments;

    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requirePermission('customers'), async (req, res) => {
  try {
    const { name, address, phone, email, opening_balance, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const result = await dbRun(
      `INSERT INTO buyers (name, address, phone, email, opening_balance, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address || null, phone || null, email || null, opening_balance || 0, notes || null]
    );

    res.status(201).json({ success: true, message: 'Customer created', id: result.lastID });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Phone or email already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requirePermission('customers'), async (req, res) => {
  try {
    const { name, address, phone, email, opening_balance, notes, is_active } = req.body;
    const customer = await dbGet(`SELECT * FROM buyers WHERE id = ?`, [req.params.id]);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await dbRun(
      `UPDATE buyers SET name = ?, address = ?, phone = ?, email = ?, opening_balance = ?, notes = ?, is_active = ? WHERE id = ?`,
      [
        name || customer.name,
        address !== undefined ? address : customer.address,
        phone !== undefined ? phone : customer.phone,
        email !== undefined ? email : customer.email,
        opening_balance !== undefined ? opening_balance : customer.opening_balance,
        notes !== undefined ? notes : customer.notes,
        is_active !== undefined ? is_active : customer.is_active,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Customer updated' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Phone or email already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requirePermission('customers'), async (req, res) => {
  try {
    const pendingDebts = await dbGet(`SELECT COUNT(*) as count FROM debts WHERE buyer_id = ? AND status IN ('pending', 'partial')`, [req.params.id]);
    if (pendingDebts.count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete customer with pending debts' });
    }

    await dbRun(`UPDATE buyers SET is_active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/orders', verifyToken, requirePermission(['customers', 'billing']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql = `SELECT o.*, l.name as location_name, u.name as created_by_name FROM orders o
      LEFT JOIN locations l ON o.location_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.buyer_id = ?`;
    const params = [req.params.id];

    if (start_date) { sql += ` AND DATE(o.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(o.created_at) <= ?`; params.push(end_date); }

    sql += ` ORDER BY o.created_at DESC`;
    const orders = await dbAll(sql, params);
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/debts', verifyToken, requirePermission(['customers', 'debts']), async (req, res) => {
  try {
    const debts = await dbAll(
      `SELECT d.*, o.invoice_id FROM debts d JOIN orders o ON d.order_id = o.id
      WHERE d.buyer_id = ? ORDER BY d.created_at DESC`,
      [req.params.id]
    );

    for (const debt of debts) {
      const payments = await dbAll(`SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY created_at DESC`, [debt.id]);
      debt.payments = payments;
    }

    const summary = await dbGet(
      `SELECT COALESCE(SUM(amount_remaining + paid_amount), 0) as total_debt,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(amount_remaining), 0) as total_remaining
      FROM debts WHERE buyer_id = ? AND status IN ('pending', 'partial')`,
      [req.params.id]
    );

    res.json({ success: true, debts, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/pay-debt', verifyToken, requirePermission('debts'), async (req, res) => {
  try {
    const { amount, payment_method, notes, debt_id } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    let debts;
    if (debt_id) {
      const debt = await dbGet(`SELECT * FROM debts WHERE id = ? AND buyer_id = ? AND status IN ('pending', 'partial')`, [debt_id, req.params.id]);
      if (!debt) return res.status(404).json({ success: false, message: 'Debt not found' });
      debts = [debt];
    } else {
      debts = await dbAll(
        `SELECT * FROM debts WHERE buyer_id = ? AND status IN ('pending', 'partial') ORDER BY created_at ASC`,
        [req.params.id]
      );
    }

    if (!debts.length) return res.status(400).json({ success: false, message: 'No pending debts found' });

    let remainingPayment = amount;
    const paymentsCreated = [];

    for (const debt of debts) {
      if (remainingPayment <= 0) break;
      const payAmount = Math.min(remainingPayment, debt.amount_remaining);

      await dbRun(
        `INSERT INTO debt_payments (debt_id, amount, payment_method, notes, received_by) VALUES (?, ?, ?, ?, ?)`,
        [debt.id, payAmount, payment_method || 'cash', notes || null, req.user.id]
      );

      const newPaid = debt.paid_amount + payAmount;
      const newRemaining = debt.amount_remaining - payAmount;
      const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

      await dbRun(
        `UPDATE debts SET paid_amount = ?, amount_remaining = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
        [newPaid, Math.max(0, newRemaining), newStatus, debt.id]
      );

      if (newStatus === 'paid') {
        await dbRun(`UPDATE orders SET payment_status = 'paid', received_amount = final_amount WHERE id = ?`, [debt.order_id]);
      } else {
        await dbRun(`UPDATE orders SET payment_status = 'partial', received_amount = received_amount + ? WHERE id = ?`, [payAmount, debt.order_id]);
      }

      paymentsCreated.push({ debt_id: debt.id, amount: payAmount, new_status: newStatus });
      remainingPayment -= payAmount;
    }

    // If there's excess, save as advance
    let advanceSaved = 0;
    if (remainingPayment > 0) {
      advanceSaved = remainingPayment;
      await dbRun(`UPDATE buyers SET advance_balance = advance_balance + ? WHERE id = ?`, [remainingPayment, req.params.id]);
    }

    res.json({ success: true, message: 'Payment recorded', payments: paymentsCreated, excess: 0, advance_saved: advanceSaved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
