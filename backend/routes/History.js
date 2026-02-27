const express = require('express');
const router = express.Router();
const { dbAll } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const { start_date, end_date, user_id, reference_type, product_id, location_id, limit } = req.query;
    let sql = `SELECT sh.*, p.name as product_name, p.product_code, b.batch_no, l.name as location_name, u.name as user_name
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      JOIN batches b ON sh.batch_id = b.id
      JOIN locations l ON sh.location_id = l.id
      LEFT JOIN users u ON sh.created_by = u.id
      WHERE 1=1`;
    const params = [];

    if (start_date) { sql += ` AND DATE(sh.created_at) >= ?`; params.push(start_date); }
    if (end_date) { sql += ` AND DATE(sh.created_at) <= ?`; params.push(end_date); }
    if (user_id) { sql += ` AND sh.created_by = ?`; params.push(user_id); }
    if (reference_type) { sql += ` AND sh.reference_type = ?`; params.push(reference_type); }
    if (product_id) { sql += ` AND sh.product_id = ?`; params.push(product_id); }
    if (location_id) { sql += ` AND sh.location_id = ?`; params.push(location_id); }

    sql += ` ORDER BY sh.created_at DESC LIMIT ?`;
    params.push(parseInt(limit) || 100);

    const history = await dbAll(sql, params);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/activity', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const { start_date, end_date, user_id, limit } = req.query;
    const maxLimit = parseInt(limit) || 50;
    const activities = [];

    let orderFilter = `WHERE 1=1`;
    let purchaseFilter = `WHERE 1=1`;
    let transferFilter = `WHERE 1=1`;
    let returnFilter = `WHERE 1=1`;
    let disposalFilter = `WHERE 1=1`;
    const orderParams = [];
    const purchaseParams = [];
    const transferParams = [];
    const returnParams = [];
    const disposalParams = [];

    if (start_date) {
      orderFilter += ` AND DATE(o.created_at) >= ?`; orderParams.push(start_date);
      purchaseFilter += ` AND DATE(p.created_at) >= ?`; purchaseParams.push(start_date);
      transferFilter += ` AND DATE(st.created_at) >= ?`; transferParams.push(start_date);
      returnFilter += ` AND DATE(cr.created_at) >= ?`; returnParams.push(start_date);
      disposalFilter += ` AND DATE(ep.created_at) >= ?`; disposalParams.push(start_date);
    }
    if (end_date) {
      orderFilter += ` AND DATE(o.created_at) <= ?`; orderParams.push(end_date);
      purchaseFilter += ` AND DATE(p.created_at) <= ?`; purchaseParams.push(end_date);
      transferFilter += ` AND DATE(st.created_at) <= ?`; transferParams.push(end_date);
      returnFilter += ` AND DATE(cr.created_at) <= ?`; returnParams.push(end_date);
      disposalFilter += ` AND DATE(ep.created_at) <= ?`; disposalParams.push(end_date);
    }
    if (user_id) {
      orderFilter += ` AND o.created_by = ?`; orderParams.push(user_id);
      purchaseFilter += ` AND p.created_by = ?`; purchaseParams.push(user_id);
      transferFilter += ` AND st.transferred_by = ?`; transferParams.push(user_id);
      returnFilter += ` AND cr.created_by = ?`; returnParams.push(user_id);
      disposalFilter += ` AND ep.disposed_by = ?`; disposalParams.push(user_id);
    }

    const orders = await dbAll(
      `SELECT 'sale' as activity_type, o.id, o.invoice_id as reference, o.final_amount as amount, b.name as related_name, u.name as user_name, o.created_at
      FROM orders o LEFT JOIN buyers b ON o.buyer_id = b.id LEFT JOIN users u ON o.created_by = u.id ${orderFilter} ORDER BY o.created_at DESC LIMIT ?`,
      [...orderParams, maxLimit]
    );
    activities.push(...orders);

    const purchases = await dbAll(
      `SELECT 'purchase' as activity_type, p.id, p.invoice_number as reference, p.final_amount as amount, s.name as related_name, u.name as user_name, p.created_at
      FROM purchases p LEFT JOIN sellers s ON p.seller_id = s.id LEFT JOIN users u ON p.created_by = u.id ${purchaseFilter} ORDER BY p.created_at DESC LIMIT ?`,
      [...purchaseParams, maxLimit]
    );
    activities.push(...purchases);

    const transfers = await dbAll(
      `SELECT 'transfer' as activity_type, st.id, st.transfer_number as reference, NULL as amount,
        l1.name || ' → ' || l2.name as related_name, u.name as user_name, st.created_at
      FROM stock_transfers st
      JOIN locations l1 ON st.from_location_id = l1.id
      JOIN locations l2 ON st.to_location_id = l2.id
      LEFT JOIN users u ON st.transferred_by = u.id ${transferFilter} ORDER BY st.created_at DESC LIMIT ?`,
      [...transferParams, maxLimit]
    );
    activities.push(...transfers);

    const returns = await dbAll(
      `SELECT 'customer_return' as activity_type, cr.id, cr.return_number as reference, cr.total_amount as amount, b.name as related_name, u.name as user_name, cr.created_at
      FROM customer_returns cr LEFT JOIN buyers b ON cr.buyer_id = b.id LEFT JOIN users u ON cr.created_by = u.id ${returnFilter} ORDER BY cr.created_at DESC LIMIT ?`,
      [...returnParams, maxLimit]
    );
    activities.push(...returns);

    const disposals = await dbAll(
      `SELECT 'disposal' as activity_type, ep.id, ep.disposal_method as reference, ep.quantity as amount, p.name as related_name, u.name as user_name, ep.created_at
      FROM expired_products ep JOIN products p ON ep.product_id = p.id LEFT JOIN users u ON ep.disposed_by = u.id ${disposalFilter} ORDER BY ep.created_at DESC LIMIT ?`,
      [...disposalParams, maxLimit]
    );
    activities.push(...disposals);

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, activities: activities.slice(0, maxLimit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const { limit } = req.query;
    const maxLimit = parseInt(limit) || 50;
    const userId = req.params.userId;

    const stockActions = await dbAll(
      `SELECT sh.*, p.name as product_name, l.name as location_name FROM stock_history sh
      JOIN products p ON sh.product_id = p.id JOIN locations l ON sh.location_id = l.id
      WHERE sh.created_by = ? ORDER BY sh.created_at DESC LIMIT ?`,
      [userId, maxLimit]
    );

    const salesMade = await dbAll(
      `SELECT o.id, o.invoice_id, o.final_amount, o.payment_status, b.name as buyer_name, o.created_at
      FROM orders o LEFT JOIN buyers b ON o.buyer_id = b.id
      WHERE o.created_by = ? ORDER BY o.created_at DESC LIMIT ?`,
      [userId, maxLimit]
    );

    const purchasesMade = await dbAll(
      `SELECT p.id, p.invoice_number, p.final_amount, p.payment_status, s.name as seller_name, p.created_at
      FROM purchases p LEFT JOIN sellers s ON p.seller_id = s.id
      WHERE p.created_by = ? ORDER BY p.created_at DESC LIMIT ?`,
      [userId, maxLimit]
    );

    res.json({ success: true, stock_actions: stockActions, sales: salesMade, purchases: purchasesMade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/product/:productId', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const history = await dbAll(
      `SELECT sh.*, b.batch_no, l.name as location_name, u.name as user_name
      FROM stock_history sh
      JOIN batches b ON sh.batch_id = b.id
      JOIN locations l ON sh.location_id = l.id
      LEFT JOIN users u ON sh.created_by = u.id
      WHERE sh.product_id = ? ORDER BY sh.created_at DESC LIMIT 100`,
      [req.params.productId]
    );
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
