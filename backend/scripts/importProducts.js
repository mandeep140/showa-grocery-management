const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');

const dbPath = path.join(__dirname, '../DATABASE/showa_inventory_management.db');
const db = new sqlite3.Database(dbPath);

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
  });
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });
}

function clean(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

let generatedCounter = 0;
async function nextGeneratedBarcode() {
  if (generatedCounter === 0) {
    const row = await dbGet(`SELECT barcode FROM products WHERE barcode LIKE 'GEN-%' ORDER BY barcode DESC LIMIT 1`);
    if (row && row.barcode) {
      const n = parseInt(row.barcode.replace('GEN-', ''), 10);
      if (!isNaN(n)) generatedCounter = n;
    }
  }
  generatedCounter++;
  return `GEN-${String(generatedCounter).padStart(5, '0')}`;
}

let productCodeCounter = 0;
async function nextProductCode() {
  if (productCodeCounter === 0) {
    const row = await dbGet(`SELECT product_code FROM products WHERE product_code LIKE 'PRD-%' ORDER BY product_code DESC LIMIT 1`);
    if (row && row.product_code) {
      const n = parseInt(row.product_code.replace('PRD-', ''), 10);
      if (!isNaN(n)) productCodeCounter = n;
    }
  }
  productCodeCounter++;
  return `PRD-${String(productCodeCounter).padStart(5, '0')}`;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/importProducts.js <path-to-excel-file>');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  console.log(`\n Reading Excel: ${absPath}\n`);


  const workbook = XLSX.readFile(absPath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  if (!rows.length) {
    console.error('No data found in the Excel file');
    process.exit(1);
  }

  console.log(` Found ${rows.length} rows in sheet "${sheetName}"`);
  console.log(`   Columns: ${Object.keys(rows[0]).join(', ')}\n`);

  const colMap = detectColumns(Object.keys(rows[0]));
  console.log(' Column mapping:');
  Object.entries(colMap).forEach(([key, val]) => console.log(`   ${key} → "${val}"`));
  console.log('');

  let location = await dbGet(`SELECT * FROM locations WHERE is_active = 1 ORDER BY id ASC LIMIT 1`);
  if (!location) {
    console.log('  No active location found, creating "Main Store"...');
    const res = await dbRun(`INSERT INTO locations (name, location_type) VALUES (?, ?)`, ['Main Store', 'store']);
    location = { id: res.lastID, name: 'Main Store' };
  }
  console.log(` Location: ${location.name} (ID: ${location.id})`);

  let seller = await dbGet(`SELECT * FROM sellers WHERE name = 'Initial Import' AND is_active = 1`);
  if (!seller) {
    const res = await dbRun(`INSERT INTO sellers (name, company_name, is_active) VALUES (?, ?, 1)`, ['Initial Import', 'System Import']);
    seller = { id: res.lastID };
  }
  console.log(`🏪 Seller: Initial Import (ID: ${seller.id})`);

  const now = new Date().toISOString().slice(0, 10);
  const invoiceNum = `IMP-${now.replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const purchaseRes = await dbRun(
    `INSERT INTO purchases (invoice_number, seller_id, location_id, total_amount, final_amount, payment_status, paid_amount, purchase_date, notes)
     VALUES (?, ?, ?, 0, 0, 'paid', 0, ?, 'Bulk import from Excel')`,
    [invoiceNum, seller.id, location.id, now]
  );
  const purchaseId = purchaseRes.lastID;
  console.log(` Purchase: ${invoiceNum} (ID: ${purchaseId})\n`);

  let added = 0, skipped = 0, errors = 0;
  let totalPurchaseAmount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const itemCode = clean(row[colMap.itemCode]);
    const itemName = clean(row[colMap.itemName]);
    const salePrice = num(row[colMap.salePrice]);
    const purchasePrice = num(row[colMap.purchasePrice]);
    const stockQty = Math.max(0, Math.round(num(row[colMap.stockQty])));
    const minStock = Math.max(0, Math.round(num(row[colMap.minStock])));

    if (!itemName) {
      skipped++;
      continue;
    }

    try {
      const existing = await dbGet(`SELECT id FROM products WHERE LOWER(name) = LOWER(?)`, [itemName]);
      if (existing) {
        await dbRun(
          `UPDATE products SET default_buying_rate = ?, default_selling_price = ?, minimum_stock_level = ?, updated_at = datetime('now') WHERE id = ?`,
          [purchasePrice, salePrice, minStock, existing.id]
        );

        if (stockQty > 0) {
          const batchNo = `IMP-${String(i + 1).padStart(5, '0')}`;
          const batchRes = await dbRun(
            `INSERT INTO batches (batch_no, product_id, purchase_id, location_id, quantity_initial, quantity_remaining, buying_rate)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [batchNo, existing.id, purchaseId, location.id, stockQty, stockQty, purchasePrice]
          );
          const subtotal = stockQty * purchasePrice;
          await dbRun(
            `INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, buying_rate, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [purchaseId, existing.id, batchRes.lastID, stockQty, purchasePrice, subtotal]
          );
          totalPurchaseAmount += subtotal;
        }

        added++;
        if ((i + 1) % 200 === 0) process.stdout.write(`    ${i + 1}/${rows.length} processed...\r`);
        continue;
      }

      const barcode = itemCode || await nextGeneratedBarcode();
      const productCode = await nextProductCode();

      const prodRes = await dbRun(
        `INSERT INTO products (product_code, name, unit, default_buying_rate, default_selling_price, minimum_stock_level, barcode, is_active)
         VALUES (?, ?, 'pcs', ?, ?, ?, ?, 1)`,
        [productCode, itemName, purchasePrice, salePrice, minStock, barcode]
      );
      const productId = prodRes.lastID;

      if (stockQty > 0) {
        const batchNo = `IMP-${String(i + 1).padStart(5, '0')}`;
        const batchRes = await dbRun(
          `INSERT INTO batches (batch_no, product_id, purchase_id, location_id, quantity_initial, quantity_remaining, buying_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [batchNo, productId, purchaseId, location.id, stockQty, stockQty, purchasePrice]
        );
        const subtotal = stockQty * purchasePrice;
        await dbRun(
          `INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, buying_rate, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [purchaseId, productId, batchRes.lastID, stockQty, purchasePrice, subtotal]
        );
        totalPurchaseAmount += subtotal;
      }

      added++;
      if ((i + 1) % 200 === 0) process.stdout.write(`   ✅ ${i + 1}/${rows.length} processed...\r`);
    } catch (err) {
      errors++;
      console.error(`\n    Row ${i + 1} ("${itemName}"): ${err.message}`);
    }
  }

  await dbRun(
    `UPDATE purchases SET total_amount = ?, final_amount = ?, paid_amount = ? WHERE id = ?`,
    [totalPurchaseAmount, totalPurchaseAmount, totalPurchaseAmount, purchaseId]
  );

  console.log(`\n\n Import Complete!`);
  console.log(`   Added/Updated : ${added}`);
  console.log(`   Skipped (empty): ${skipped}`);
  console.log(`   Errors         : ${errors}`);
  console.log(`   Purchase Total : ₹${totalPurchaseAmount.toLocaleString('en-IN')}`);
  console.log(`   Purchase ID    : ${invoiceNum}\n`);

  db.close();
}

function detectColumns(headers) {
  const lower = headers.map(h => h.toLowerCase().trim());
  
  function find(...patterns) {
    for (const pattern of patterns) {
      const idx = lower.findIndex(h => h.includes(pattern));
      if (idx >= 0) return headers[idx];
    }
    return headers[0]; 
  }

  return {
    itemCode: find('item code', 'barcode', 'code', 'sku', 'product code'),
    itemName: find('item name', 'product name', 'name', 'product', 'item'),
    salePrice: find('sale price', 'sell price', 'selling price', 'mrp', 'sale'),
    purchasePrice: find('purchase price', 'buy price', 'buying price', 'cost', 'purchase'),
    stockQty: find('current stock', 'stock quantity', 'stock qty', 'quantity', 'stock', 'qty'),
    minStock: find('minimum stock', 'min stock', 'reorder', 'min qty', 'minimum'),
  };
}

main().catch(err => {
  console.error('Fatal error:', err);
  db.close();
  process.exit(1);
});