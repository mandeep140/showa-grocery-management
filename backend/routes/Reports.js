const express = require('express');
const router = express.Router();
const { dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken } = require('../lib/authMiddleware');

router.get('/sales', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, location_id } = req.query;
    let sql = `SELECT o.*, b.name as buyer_name, b.phone as buyer_phone, l.name as location_name, u.name as created_by_name
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN locations l ON o.location_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.status = 'completed'`;
    const params = [];

    if (start_date) { sql += ` AND DATE(o.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(o.created_at) <= ?`; params.push(end_date); }
    if (location_id) { sql += ` AND o.location_id = ?`; params.push(location_id); }

    sql += ` ORDER BY o.created_at DESC`;
    const orders = await dbAll(sql, params);

    const summary = {
      total_orders: orders.length,
      total_sales: orders.reduce((s, o) => s + (o.final_amount || 0), 0),
      total_received: orders.reduce((s, o) => s + (o.received_amount || 0), 0),
      total_credit: orders.reduce((s, o) => s + ((o.final_amount || 0) - (o.received_amount || 0)), 0),
      total_profit: orders.reduce((s, o) => s + ((o.total_sell_price || 0) - (o.total_buy_price || 0)), 0),
      paid_orders: orders.filter(o => o.payment_status === 'paid').length,
      pending_orders: orders.filter(o => o.payment_status !== 'paid').length
    };

    res.json({ success: true, orders, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const summary = await dbGet(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(final_amount), 0) as total_sales,
        COALESCE(SUM(received_amount), 0) as total_received,
        COALESCE(SUM(final_amount - received_amount), 0) as total_credit,
        COALESCE(SUM(total_sell_price - total_buy_price), 0) as total_profit
      FROM orders WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );

    const topProducts = await dbAll(
      `SELECT p.name as product_name, p.product_code, SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE DATE(o.created_at) = ? AND o.status = 'completed'
      GROUP BY oi.product_id ORDER BY total_quantity DESC LIMIT 10`,
      [today]
    );

    const hourlyBreakdown = await dbAll(
      `SELECT strftime('%H', created_at) as hour, COUNT(*) as orders, COALESCE(SUM(final_amount), 0) as sales
      FROM orders WHERE DATE(created_at) = ? AND status = 'completed'
      GROUP BY strftime('%H', created_at) ORDER BY hour`,
      [today]
    );

    res.json({ success: true, summary, top_products: topProducts, hourly: hourlyBreakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales/daily', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, days } = req.query;
    let sql = `SELECT DATE(created_at) as date, COUNT(*) as total_orders,
      COALESCE(SUM(final_amount), 0) as total_sales,
      COALESCE(SUM(received_amount), 0) as total_received,
      COALESCE(SUM(total_sell_price - total_buy_price), 0) as total_profit
      FROM orders WHERE status = 'completed'`;
    const params = [];

    if (start_date && end_date) {
      sql += ` AND DATE(created_at) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    } else {
      sql += ` AND DATE(created_at) >= DATE('now', ?)`;
      params.push(`-${parseInt(days) || 30} days`);
    }

    sql += ` GROUP BY DATE(created_at) ORDER BY date DESC`;
    const data = await dbAll(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profit', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql = `SELECT DATE(o.created_at) as date,
      COALESCE(SUM(o.total_sell_price), 0) as total_sell,
      COALESCE(SUM(o.total_buy_price), 0) as total_buy,
      COALESCE(SUM(o.total_sell_price - o.total_buy_price), 0) as profit,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      COUNT(*) as total_orders
      FROM orders o WHERE o.status = 'completed'`;
    const params = [];

    if (start_date) { sql += ` AND DATE(o.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(o.created_at) <= ?`; params.push(end_date); }

    sql += ` GROUP BY DATE(o.created_at) ORDER BY date DESC`;
    const daily = await dbAll(sql, params);

    const totals = {
      total_sell: daily.reduce((s, d) => s + d.total_sell, 0),
      total_buy: daily.reduce((s, d) => s + d.total_buy, 0),
      total_profit: daily.reduce((s, d) => s + d.profit, 0),
      total_discount: daily.reduce((s, d) => s + d.total_discount, 0),
      total_orders: daily.reduce((s, d) => s + d.total_orders, 0)
    };

    res.json({ success: true, daily, totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/inventory', verifyToken, async (req, res) => {
  try {
    const { location_id } = req.query;
    let sql = `SELECT p.id, p.product_code, p.name, p.unit, c.name as category_name, br.name as brand_name,
      p.default_selling_price, p.minimum_stock_level,
      COALESCE(SUM(b.quantity_remaining), 0) as total_stock,
      COALESCE(SUM(b.quantity_remaining * b.buying_rate), 0) as stock_value,
      CASE
        WHEN COALESCE(SUM(b.quantity_remaining), 0) = 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(b.quantity_remaining), 0) <= p.minimum_stock_level THEN 'low_stock'
        ELSE 'in_stock'
      END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands br ON p.brand_id = br.id
      LEFT JOIN batches b ON p.id = b.product_id AND b.quantity_remaining > 0`;

    const params = [];
    if (location_id) { sql += ` AND b.location_id = ?`; params.push(location_id); }

    sql += ` WHERE p.is_active = 1 GROUP BY p.id ORDER BY p.name`;
    const products = await dbAll(sql, params);

    const summary = {
      total_products: products.length,
      in_stock: products.filter(p => p.stock_status === 'in_stock').length,
      low_stock: products.filter(p => p.stock_status === 'low_stock').length,
      out_of_stock: products.filter(p => p.stock_status === 'out_of_stock').length,
      total_stock_value: products.reduce((s, p) => s + (p.stock_value || 0), 0),
      total_retail_value: products.reduce((s, p) => s + ((p.total_stock || 0) * (p.default_selling_price || 0)), 0)
    };

    res.json({ success: true, products, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/purchases', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, seller_id } = req.query;
    let sql = `SELECT p.*, s.name as seller_name, s.company_name, l.name as location_name, u.name as created_by_name,
      COUNT(DISTINCT b.id) as total_batches, COALESCE(SUM(b.quantity_initial), 0) as total_quantity
      FROM purchases p
      LEFT JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN batches b ON p.id = b.purchase_id
      WHERE 1=1`;
    const params = [];

    if (start_date) { sql += ` AND p.purchase_date >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND p.purchase_date <= ?`; params.push(end_date); }
    if (seller_id) { sql += ` AND p.seller_id = ?`; params.push(seller_id); }

    sql += ` GROUP BY p.id ORDER BY p.created_at DESC`;
    const purchases = await dbAll(sql, params);

    const summary = {
      total_purchases: purchases.length,
      total_amount: purchases.reduce((s, p) => s + (p.final_amount || 0), 0),
      total_paid: purchases.reduce((s, p) => s + (p.paid_amount || 0), 0),
      total_pending: purchases.reduce((s, p) => s + ((p.final_amount || 0) - (p.paid_amount || 0)), 0),
      paid_count: purchases.filter(p => p.payment_status === 'paid').length,
      pending_count: purchases.filter(p => p.payment_status !== 'paid').length
    };

    res.json({ success: true, purchases, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expiry', verifyToken, async (req, res) => {
  try {
    const { days } = req.query;
    const daysAhead = parseInt(days) || 30;

    const expiring = await dbAll(
      `SELECT b.id as batch_id, b.batch_no, p.name as product_name, p.product_code, l.name as location_name,
        b.quantity_remaining, b.expire_date, b.buying_rate,
        CAST((julianday(b.expire_date) - julianday('now')) AS INTEGER) as days_to_expire,
        b.quantity_remaining * b.buying_rate as at_risk_value
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL AND b.quantity_remaining > 0
        AND julianday(b.expire_date) - julianday('now') <= ?
        AND julianday(b.expire_date) >= julianday('now')
      ORDER BY b.expire_date ASC`,
      [daysAhead]
    );

    const expired = await dbAll(
      `SELECT b.id as batch_id, b.batch_no, p.name as product_name, p.product_code, l.name as location_name,
        b.quantity_remaining, b.expire_date, b.buying_rate,
        CAST((julianday('now') - julianday(b.expire_date)) AS INTEGER) as days_expired,
        b.quantity_remaining * b.buying_rate as loss_value
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL AND b.quantity_remaining > 0
        AND julianday(b.expire_date) < julianday('now')
      ORDER BY b.expire_date ASC`
    );

    const summary = {
      expiring_count: expiring.length,
      expiring_value: expiring.reduce((s, e) => s + (e.at_risk_value || 0), 0),
      expired_count: expired.length,
      expired_value: expired.reduce((s, e) => s + (e.loss_value || 0), 0)
    };

    res.json({ success: true, expiring, expired, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/debts', verifyToken, async (req, res) => {
  try {
    const debts = await dbAll(
      `SELECT d.*, o.invoice_id, b.name as buyer_name, b.phone as buyer_phone
      FROM debts d
      JOIN orders o ON d.order_id = o.id
      JOIN buyers b ON d.buyer_id = b.id
      WHERE d.status IN ('pending', 'partial')
      ORDER BY d.amount_remaining DESC`
    );

    const byCustomer = await dbAll(
      `SELECT b.id, b.name, b.phone, COUNT(d.id) as debt_count,
        COALESCE(SUM(d.total_amount), 0) as total_debt,
        COALESCE(SUM(d.paid_amount), 0) as total_paid,
        COALESCE(SUM(d.amount_remaining), 0) as total_remaining
      FROM buyers b
      JOIN debts d ON b.id = d.buyer_id AND d.status IN ('pending', 'partial')
      GROUP BY b.id ORDER BY total_remaining DESC`
    );

    const summary = {
      total_debts: debts.length,
      total_amount: debts.reduce((s, d) => s + (d.total_amount || 0), 0),
      total_paid: debts.reduce((s, d) => s + (d.paid_amount || 0), 0),
      total_remaining: debts.reduce((s, d) => s + (d.amount_remaining || 0), 0),
      customers_with_debt: byCustomer.length
    };

    res.json({ success: true, debts, by_customer: byCustomer, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seller-dues', verifyToken, async (req, res) => {
  try {
    const sellers = await dbAll(
      `SELECT s.id, s.name, s.company_name, s.phone, s.opening_balance,
        COALESCE(SUM(p.final_amount), 0) as total_purchase_amount,
        COALESCE(SUM(p.paid_amount), 0) as total_paid,
        COALESCE(SUM(p.final_amount - p.paid_amount), 0) as total_pending,
        COUNT(CASE WHEN p.payment_status != 'paid' THEN 1 END) as unpaid_purchases
      FROM sellers s
      LEFT JOIN purchases p ON s.id = p.seller_id
      WHERE s.is_active = 1
      GROUP BY s.id
      HAVING total_pending > 0
      ORDER BY total_pending DESC`
    );

    const summary = {
      total_sellers_with_dues: sellers.length,
      total_pending: sellers.reduce((s, sel) => s + (sel.total_pending || 0), 0)
    };

    res.json({ success: true, sellers, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/low-stock', verifyToken, async (req, res) => {
  try {
    const products = await dbAll(
      `SELECT p.id, p.product_code, p.name, p.unit, p.minimum_stock_level,
        c.name as category_name, br.name as brand_name,
        COALESCE(SUM(b.quantity_remaining), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands br ON p.brand_id = br.id
      LEFT JOIN batches b ON p.id = b.product_id AND b.quantity_remaining > 0
      WHERE p.is_active = 1
      GROUP BY p.id
      HAVING total_stock <= p.minimum_stock_level
      ORDER BY total_stock ASC`
    );
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];

    if (start_date) { dateFilter += ` AND DATE(o.created_at) >= ?`; params.push(start_date); }
    if (end_date) { dateFilter += ` AND DATE(o.created_at) <= ?`; params.push(end_date); }

    const users = await dbAll(
      `SELECT u.id, u.name, u.username, u.phone, u.is_active, r.name as role_name,
        (SELECT COUNT(*) FROM orders o WHERE o.created_by = u.id AND o.status = 'completed' ${dateFilter}) as total_orders,
        (SELECT COALESCE(SUM(final_amount), 0) FROM orders o WHERE o.created_by = u.id AND o.status = 'completed' ${dateFilter}) as total_sales,
        (SELECT COUNT(*) FROM purchases p WHERE p.created_by = u.id ${dateFilter.replace(/o\./g, 'p.')}) as total_purchases
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY total_orders DESC`,
      [...params, ...params]
    );

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const todaySales = await dbGet(
      `SELECT COUNT(*) as orders, COALESCE(SUM(final_amount), 0) as sales, COALESCE(SUM(received_amount), 0) as received,
        COALESCE(SUM(total_sell_price - total_buy_price), 0) as profit
      FROM orders WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );

    const totalProducts = await dbGet(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);
    const lowStockCount = await dbGet(
      `SELECT COUNT(*) as count FROM (
        SELECT p.id FROM products p
        LEFT JOIN batches b ON p.id = b.product_id AND b.quantity_remaining > 0
        WHERE p.is_active = 1
        GROUP BY p.id HAVING COALESCE(SUM(b.quantity_remaining), 0) <= p.minimum_stock_level
      )`
    );
    const expiringCount = await dbGet(
      `SELECT COUNT(*) as count FROM batches WHERE expire_date IS NOT NULL AND quantity_remaining > 0
        AND julianday(expire_date) - julianday('now') <= 30 AND julianday(expire_date) >= julianday('now')`
    );
    const expiredCount = await dbGet(
      `SELECT COUNT(*) as count FROM batches WHERE expire_date IS NOT NULL AND quantity_remaining > 0
        AND julianday(expire_date) < julianday('now')`
    );
    const pendingDebts = await dbGet(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount_remaining), 0) as total FROM debts WHERE status IN ('pending', 'partial')`
    );
    const pendingSellerDues = await dbGet(
      `SELECT COALESCE(SUM(final_amount - paid_amount), 0) as total FROM purchases WHERE payment_status != 'paid'`
    );
    const totalCustomers = await dbGet(`SELECT COUNT(*) as count FROM buyers WHERE is_active = 1`);
    const totalSellers = await dbGet(`SELECT COUNT(*) as count FROM sellers WHERE is_active = 1`);

    res.json({
      success: true,
      dashboard: {
        today_sales: todaySales,
        total_products: totalProducts.count,
        low_stock: lowStockCount.count,
        expiring_soon: expiringCount.count,
        expired: expiredCount.count,
        pending_customer_debts: pendingDebts,
        pending_seller_dues: pendingSellerDues.total,
        total_customers: totalCustomers.count,
        total_sellers: totalSellers.count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
