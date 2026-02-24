const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll, logStockHistory, generateId } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

router.get('/', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const transfers = await dbAll(
      `SELECT st.*, l1.name as from_location_name, l2.name as to_location_name, u.name as transferred_by_name,
        (SELECT COUNT(*) FROM stock_transfer_items WHERE transfer_id = st.id) as item_count
      FROM stock_transfers st
      JOIN locations l1 ON st.from_location_id = l1.id
      JOIN locations l2 ON st.to_location_id = l2.id
      LEFT JOIN users u ON st.transferred_by = u.id
      ORDER BY st.created_at DESC`
    );
    res.json({ success: true, transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, requirePermission('inventory_view'), async (req, res) => {
  try {
    const transfer = await dbGet(
      `SELECT st.*, l1.name as from_location_name, l2.name as to_location_name, u.name as transferred_by_name
      FROM stock_transfers st
      JOIN locations l1 ON st.from_location_id = l1.id
      JOIN locations l2 ON st.to_location_id = l2.id
      LEFT JOIN users u ON st.transferred_by = u.id
      WHERE st.id = ?`,
      [req.params.id]
    );
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });

    const items = await dbAll(
      `SELECT sti.*, p.name as product_name, p.product_code, p.unit,
        fb.batch_no as from_batch_no, fb.expire_date
      FROM stock_transfer_items sti
      JOIN products p ON sti.product_id = p.id
      JOIN batches fb ON sti.from_batch_id = fb.id
      WHERE sti.transfer_id = ?`,
      [req.params.id]
    );

    transfer.items = items;
    res.json({ success: true, transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requirePermission('inventory_edit'), async (req, res) => {
  try {
    const { from_location_id, to_location_id, transfer_date, notes, items } = req.body;

    if (!from_location_id || !to_location_id || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Source location, destination location, and items are required' });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({ success: false, message: 'Source and destination locations must be different' });
    }

    for (const item of items) {
      if (!item.from_batch_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Each item needs from_batch_id and valid quantity' });
      }

      const batch = await dbGet(`SELECT * FROM batches WHERE id = ? AND location_id = ?`, [item.from_batch_id, from_location_id]);
      if (!batch) return res.status(400).json({ success: false, message: `Batch ${item.from_batch_id} not found at source location` });
      if (batch.quantity_remaining < item.quantity) {
        const product = await dbGet(`SELECT name FROM products WHERE id = ?`, [batch.product_id]);
        return res.status(400).json({ success: false, message: `Insufficient stock in batch for "${product?.name}". Available: ${batch.quantity_remaining}` });
      }
    }

    const transferNumber = generateId('TRF');
    const transferResult = await dbRun(
      `INSERT INTO stock_transfers (transfer_number, from_location_id, to_location_id, transfer_date, notes, transferred_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [transferNumber, from_location_id, to_location_id, transfer_date || new Date().toISOString().slice(0, 10), notes || null, req.user.id]
    );

    const transferId = transferResult.lastID;

    for (const item of items) {
      const fromBatch = await dbGet(`SELECT * FROM batches WHERE id = ?`, [item.from_batch_id]);

      const newFromQuantity = fromBatch.quantity_remaining - item.quantity;
      await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newFromQuantity, item.from_batch_id]);

      let toBatch = await dbGet(
        `SELECT * FROM batches WHERE batch_no = ? AND product_id = ? AND location_id = ?`,
        [fromBatch.batch_no, fromBatch.product_id, to_location_id]
      );

      let toBatchId;
      if (toBatch) {
        const newToQuantity = toBatch.quantity_remaining + item.quantity;
        await dbRun(`UPDATE batches SET quantity_remaining = ?, quantity_initial = quantity_initial + ? WHERE id = ?`, [newToQuantity, item.quantity, toBatch.id]);
        toBatchId = toBatch.id;
      } else {
        const newBatchResult = await dbRun(
          `INSERT INTO batches (batch_no, product_id, purchase_id, location_id, expire_date, quantity_initial, quantity_remaining, buying_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [fromBatch.batch_no, fromBatch.product_id, fromBatch.purchase_id, to_location_id, fromBatch.expire_date, item.quantity, item.quantity, fromBatch.buying_rate]
        );
        toBatchId = newBatchResult.lastID;
      }

      await dbRun(
        `INSERT INTO stock_transfer_items (transfer_id, product_id, from_batch_id, to_batch_id, quantity) VALUES (?, ?, ?, ?, ?)`,
        [transferId, fromBatch.product_id, item.from_batch_id, toBatchId, item.quantity]
      );

      await logStockHistory({
        productId: fromBatch.product_id,
        batchId: item.from_batch_id,
        locationId: from_location_id,
        referenceType: 'transfer_out',
        referenceId: transferId,
        quantityBefore: fromBatch.quantity_remaining,
        quantityChange: item.quantity,
        quantityAfter: newFromQuantity,
        movementType: 'out',
        notes: `Transfer ${transferNumber} to ${to_location_id}`,
        createdBy: req.user.id
      });

      const toBatchAfter = await dbGet(`SELECT quantity_remaining FROM batches WHERE id = ?`, [toBatchId]);
      await logStockHistory({
        productId: fromBatch.product_id,
        batchId: toBatchId,
        locationId: to_location_id,
        referenceType: 'transfer_in',
        referenceId: transferId,
        quantityBefore: toBatchAfter.quantity_remaining - item.quantity,
        quantityChange: item.quantity,
        quantityAfter: toBatchAfter.quantity_remaining,
        movementType: 'in',
        notes: `Transfer ${transferNumber} from ${from_location_id}`,
        createdBy: req.user.id
      });
    }

    res.status(201).json({ success: true, message: 'Transfer completed', id: transferId, transfer_number: transferNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
