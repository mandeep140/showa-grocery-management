const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken, isAdmin } = require('../lib/authMiddleware');

const SALES_BACKUP_DIR = path.join(__dirname, '../backups/sales');
if (!fs.existsSync(SALES_BACKUP_DIR)) {
  fs.mkdirSync(SALES_BACKUP_DIR, { recursive: true });
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ].join('\n');
}

function buildDateFilter(col, start_date, end_date) {
  let sql = '';
  const params = [];
  if (start_date) { sql += ` AND DATE(${col}) >= ?`; params.push(start_date); }
  if (end_date)   { sql += ` AND DATE(${col}) <= ?`; params.push(end_date); }
  return { sql, params };
}

router.get('/sales-summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { sql: df, params: dp } = buildDateFilter('created_at', start_date, end_date);

    const total    = await dbGet(`SELECT COUNT(*) AS cnt, COALESCE(SUM(final_amount),0) AS amt, COALESCE(SUM(received_amount),0) AS rcv FROM orders WHERE 1=1${df}`, dp);
    const debts    = await dbGet(`SELECT COUNT(*) AS cnt FROM debts WHERE order_id IN (SELECT id FROM orders WHERE 1=1${df})`, dp);
    const returns_ = await dbGet(`SELECT COUNT(*) AS cnt FROM customer_returns WHERE order_id IN (SELECT id FROM orders WHERE 1=1${df})`, dp);

    res.json({
      success: true,
      summary: {
        total_orders: total.cnt,
        total_sales_amount: total.amt,
        total_received: total.rcv,
        total_debts: debts.cnt,
        total_returns: returns_.cnt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/delete-sales', verifyToken, isAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const { sql: df, params: dp } = buildDateFilter('created_at', start_date, end_date);

    const orders = await dbAll(`SELECT * FROM orders WHERE 1=1${df}`, dp);
    if (orders.length === 0) {
      return res.json({ success: false, message: 'No orders found in the given date range.' });
    }

    const orderIds   = orders.map(o => o.id);
    const idPH       = orderIds.map(() => '?').join(',');

    const orderItems   = await dbAll(`SELECT * FROM order_items WHERE order_id IN (${idPH})`, orderIds);
    const debts        = await dbAll(`SELECT * FROM debts WHERE order_id IN (${idPH})`, orderIds);
    const debtIds      = debts.map(d => d.id);
    const debtPayments = debtIds.length
      ? await dbAll(`SELECT * FROM debt_payments WHERE debt_id IN (${debtIds.map(() => '?').join(',')})`, debtIds)
      : [];
    const returns_     = await dbAll(`SELECT * FROM customer_returns WHERE order_id IN (${idPH})`, orderIds);
    const returnIds    = returns_.map(r => r.id);
    const returnItems  = returnIds.length
      ? await dbAll(`SELECT * FROM customer_return_items WHERE return_id IN (${returnIds.map(() => '?').join(',')})`, returnIds)
      : [];
    const { sql: shDf, params: shDp } = buildDateFilter('created_at', start_date, end_date);
    const stockHistory = await dbAll(
      `SELECT * FROM stock_history WHERE reference_type IN ('sale','customer_return') AND 1=1${shDf}`,
      shDp
    );

    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
    const filename   = `sales_backup_${timestamp}.json`;
    const backupPath = path.join(SALES_BACKUP_DIR, filename);

    fs.writeFileSync(backupPath, JSON.stringify({
      meta: {
        created_at: new Date().toISOString(),
        start_date: start_date || null,
        end_date: end_date || null,
        total_orders: orders.length,
        total_order_items: orderItems.length,
        total_debts: debts.length,
        total_debt_payments: debtPayments.length,
        total_returns: returns_.length,
        total_return_items: returnItems.length,
        total_stock_history: stockHistory.length
      },
      orders,
      order_items: orderItems,
      debts,
      debt_payments: debtPayments,
      customer_returns: returns_,
      customer_return_items: returnItems,
      stock_history: stockHistory
    }, null, 2));

    if (debtIds.length) {
      await dbRun(`DELETE FROM debt_payments WHERE debt_id IN (${debtIds.map(() => '?').join(',')})`, debtIds);
    }
    await dbRun(`DELETE FROM debts WHERE order_id IN (${idPH})`, orderIds);
    if (returnIds.length) {
      await dbRun(`DELETE FROM customer_return_items WHERE return_id IN (${returnIds.map(() => '?').join(',')})`, returnIds);
    }
    await dbRun(`DELETE FROM customer_returns WHERE order_id IN (${idPH})`, orderIds);
    await dbRun(`DELETE FROM order_items WHERE order_id IN (${idPH})`, orderIds);
    await dbRun(`DELETE FROM orders WHERE id IN (${idPH})`, orderIds);
    if (stockHistory.length) {
      const shIds = stockHistory.map(s => s.id);
      await dbRun(`DELETE FROM stock_history WHERE id IN (${shIds.map(() => '?').join(',')})`, shIds);
    }

    res.json({
      success: true,
      message: `Deleted ${orders.length} orders. Backup saved as "${filename}".`,
      backup_filename: filename,
      deleted_orders: orders.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales-backups', verifyToken, isAdmin, (req, res) => {
  try {
    if (!fs.existsSync(SALES_BACKUP_DIR)) return res.json({ success: true, backups: [] });
    const files = fs.readdirSync(SALES_BACKUP_DIR).filter(f => f.endsWith('.json'));
    const backups = files.map(filename => {
      const fp   = path.join(SALES_BACKUP_DIR, filename);
      const stat = fs.statSync(fp);
      let meta = null;
      try { meta = JSON.parse(fs.readFileSync(fp, 'utf8')).meta || null; } catch { /* skip */ }
      return { filename, size: stat.size, file_created_at: stat.mtime, meta };
    }).sort((a, b) => new Date(b.file_created_at) - new Date(a.file_created_at));
    res.json({ success: true, backups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/download-sales-backup/:filename', verifyToken, isAdmin, (req, res) => {
  try {
    const fp = path.join(SALES_BACKUP_DIR, path.basename(req.params.filename));
    if (!fs.existsSync(fp)) return res.status(404).json({ success: false, message: 'Backup not found.' });
    res.download(fp, req.params.filename);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/restore-sales', verifyToken, isAdmin, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, message: 'filename is required.' });

    const fp = path.join(SALES_BACKUP_DIR, path.basename(filename));
    if (!fs.existsSync(fp)) return res.status(404).json({ success: false, message: 'Backup not found.' });

    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const {
      orders = [], order_items = [], debts = [], debt_payments = [],
      customer_returns = [], customer_return_items = [], stock_history = []
    } = data;

    const insertRow = async (table, row) => {
      const cols = Object.keys(row);
      const vals = cols.map(c => row[c]);
      await dbRun(
        `INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        vals
      );
    };

    for (const row of orders)               await insertRow('orders', row);
    for (const row of order_items)          await insertRow('order_items', row);
    for (const row of debts)                await insertRow('debts', row);
    for (const row of debt_payments)        await insertRow('debt_payments', row);
    for (const row of customer_returns)     await insertRow('customer_returns', row);
    for (const row of customer_return_items) await insertRow('customer_return_items', row);
    for (const row of stock_history)        await insertRow('stock_history', row);

    res.json({
      success: true,
      message: `Restored ${orders.length} orders and all related records from "${filename}".`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/sales-backup/:filename', verifyToken, isAdmin, (req, res) => {
  try {
    const fp = path.join(SALES_BACKUP_DIR, path.basename(req.params.filename));
    if (!fs.existsSync(fp)) return res.status(404).json({ success: false, message: 'Backup not found.' });
    fs.unlinkSync(fp);
    res.json({ success: true, message: 'Backup deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/inventory', verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        p.product_code AS "Product Code",
        p.name AS "Product Name",
        p.unit AS "Unit",
        c.name AS "Category",
        br.name AS "Brand",
        b.batch_no AS "Batch No",
        b.expire_date AS "Expiry Date",
        l.name AS "Location",
        b.quantity_initial AS "Initial Qty",
        b.quantity_remaining AS "Remaining Qty",
        b.buying_rate AS "Buying Rate",
        p.default_selling_price AS "Selling Price",
        b.created_at AS "Added On"
      FROM batches b
      JOIN products p ON p.id = b.product_id
      JOIN locations l ON l.id = b.location_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands br ON br.id = p.brand_id
      WHERE b.quantity_remaining > 0
      ORDER BY p.name, b.location_id
    `);
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/sales', verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        o.invoice_id AS "Invoice ID",
        o.created_at AS "Date",
        b.name AS "Customer",
        b.phone AS "Customer Phone",
        l.name AS "Location",
        o.total_sell_price AS "Total Amount",
        o.discount_amount AS "Discount",
        o.tax_amount AS "Tax",
        o.final_amount AS "Final Amount",
        o.received_amount AS "Received Amount",
        (o.final_amount - o.received_amount) AS "Balance Due",
        o.payment_method AS "Payment Method",
        o.payment_status AS "Payment Status",
        o.status AS "Order Status",
        u.name AS "Created By",
        o.notes AS "Notes"
      FROM orders o
      LEFT JOIN buyers b ON b.id = o.buyer_id
      LEFT JOIN locations l ON l.id = o.location_id
      LEFT JOIN users u ON u.id = o.created_by
      ORDER BY o.created_at DESC
    `);
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/purchases', verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        p.invoice_number AS "Invoice Number",
        p.purchase_date AS "Purchase Date",
        s.name AS "Supplier",
        s.company_name AS "Supplier Company",
        s.phone AS "Supplier Phone",
        l.name AS "Location",
        p.total_amount AS "Total Amount",
        p.discount_amount AS "Discount",
        p.tax_amount AS "Tax",
        p.final_amount AS "Final Amount",
        p.paid_amount AS "Paid Amount",
        (p.final_amount - p.paid_amount) AS "Balance Due",
        p.payment_status AS "Payment Status",
        u.name AS "Created By",
        p.notes AS "Notes",
        p.created_at AS "Created At"
      FROM purchases p
      LEFT JOIN sellers s ON s.id = p.seller_id
      LEFT JOIN locations l ON l.id = p.location_id
      LEFT JOIN users u ON u.id = p.created_by
      ORDER BY p.purchase_date DESC
    `);
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="purchases_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/customers', verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        b.name AS "Name",
        b.phone AS "Phone",
        b.email AS "Email",
        b.address AS "Address",
        b.opening_balance AS "Opening Balance",
        b.advance_balance AS "Advance Balance (Credit)",
        COALESCE(SUM(o.final_amount), 0) AS "Total Sales",
        COALESCE(SUM(o.final_amount), 0)
          - COALESCE((SELECT SUM(d.amount_remaining) FROM debts d WHERE d.buyer_id = b.id AND d.status != 'paid'), 0)
          + b.advance_balance AS "Total Received",
        COALESCE((
          SELECT SUM(d.amount_remaining)
          FROM debts d
          WHERE d.buyer_id = b.id AND d.status != 'paid'
        ), 0) AS "Total Outstanding (Debt)",
        COUNT(o.id) AS "Total Orders",
        b.notes AS "Notes",
        b.is_active AS "Active",
        b.created_at AS "Joined On"
      FROM buyers b
      LEFT JOIN orders o ON o.buyer_id = b.id AND o.status = 'completed'
      GROUP BY b.id
      ORDER BY b.name
    `);
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;    