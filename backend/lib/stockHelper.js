const db = require('./database');

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function logStockHistory({ productId, batchId, locationId, referenceType, referenceId, quantityBefore, quantityChange, quantityAfter, movementType, notes, createdBy }) {
  return dbRun(
    `INSERT INTO stock_history (product_id, batch_id, location_id, reference_type, reference_id, quantity_before, quantity_change, quantity_after, movement_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, batchId, locationId, referenceType, referenceId, quantityBefore, quantityChange, quantityAfter, movementType, notes, createdBy]
  );
}

async function deductStockFIFO(productId, locationId, quantity) {
  const batches = await dbAll(
    `SELECT * FROM batches WHERE product_id = ? AND location_id = ? AND quantity_remaining > 0 ORDER BY COALESCE(expire_date, '9999-12-31') ASC, created_at ASC`,
    [productId, locationId]
  );

  let remaining = quantity;
  const deductions = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, batch.quantity_remaining);
    deductions.push({
      batch_id: batch.id,
      product_id: productId,
      location_id: locationId,
      quantity: deduct,
      buying_rate: batch.buying_rate,
      quantity_before: batch.quantity_remaining,
      quantity_after: batch.quantity_remaining - deduct
    });
    remaining -= deduct;
  }

  if (remaining > 0) {
    const product = await dbGet(`SELECT name FROM products WHERE id = ?`, [productId]);
    throw new Error(`Insufficient stock for "${product?.name || productId}". Short by ${remaining} units.`);
  }

  for (const d of deductions) {
    await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [d.quantity_after, d.batch_id]);
  }

  return deductions;
}

async function addStockToBatch(batchId, quantity) {
  const batch = await dbGet(`SELECT * FROM batches WHERE id = ?`, [batchId]);
  if (!batch) throw new Error('Batch not found');
  const newQuantity = batch.quantity_remaining + quantity;
  await dbRun(`UPDATE batches SET quantity_remaining = ? WHERE id = ?`, [newQuantity, batchId]);
  return {
    batch_id: batchId,
    quantity_before: batch.quantity_remaining,
    quantity_after: newQuantity,
    product_id: batch.product_id,
    location_id: batch.location_id
  };
}

function generateId(prefix) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${date}-${random}`;
}

module.exports = { dbRun, dbGet, dbAll, logStockHistory, deductStockFIFO, addStockToBatch, generateId };
