const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const { dbRun, dbGet, dbAll } = require('../lib/stockHelper');
const { verifyToken, requirePermission } = require('../lib/authMiddleware');

const IMAGES_DIR = path.join(__dirname, '../DATABASE/images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  }
});

router.post('/upload-image', verifyToken, requirePermission(['inventory_create', 'inventory_edit']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const filename = `product_${Date.now()}.webp`;
    const outputPath = path.join(IMAGES_DIR, filename);
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);
    res.json({ success: true, filename, path: `/api/products/image/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/image/:filename', (req, res) => {
  const filePath = path.join(IMAGES_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Image not found' });
  
  const ext = path.extname(req.params.filename).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  
  res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(filePath);
});

router.delete('/image/:filename', verifyToken, requirePermission('inventory_delete'), (req, res) => {
  try {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', verifyToken, requirePermission(['inventory_view', 'billing', 'purchase_create']), async (req, res) => {
  try {
    const { category_id, brand_id, search, active, location_id, page, limit: rawLimit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(rawLimit) || 50));
    const offset = (pageNum - 1) * limit;

    // Build WHERE clause
    let where = ` WHERE 1=1`;
    const whereParams = [];

    if (active !== undefined) {
      where += ` AND p.is_active = ?`;
      whereParams.push(active === 'false' ? 0 : 1);
    } else {
      where += ` AND p.is_active = 1`;
    }

    if (category_id) {
      where += ` AND p.category_id = ?`;
      whereParams.push(category_id);
    }

    if (brand_id) {
      where += ` AND p.brand_id = ?`;
      whereParams.push(brand_id);
    }

    if (search) {
      where += ` AND (p.name LIKE ? OR p.product_code LIKE ? OR p.barcode LIKE ?)`;
      const q = `%${search}%`;
      whereParams.push(q, q, q);
    }

    const countRow = await dbGet(`SELECT COUNT(*) as total FROM products p${where}`, whereParams);
    const total = countRow?.total || 0;

    const joinBatch = location_id ? ' AND bt.location_id = ?' : '';
    let sql = `SELECT p.*, c.name as category_name, b.name as brand_name, 
      COALESCE(SUM(bt.quantity_remaining), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN batches bt ON p.id = bt.product_id${joinBatch}
      ${where}
      GROUP BY p.id ORDER BY p.name
      LIMIT ? OFFSET ?`;
    const params = [];
    if (location_id) params.push(location_id);
    params.push(...whereParams, limit, offset);

    const rows = await dbAll(sql, params);
    res.json({ success: true, products: rows, total, page: pageNum, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/search', verifyToken, requirePermission(['inventory_view', 'billing', 'purchase_create']), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, products: [] });
    const search = `%${q}%`;
    const rows = await dbAll(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
        COALESCE(SUM(bt.quantity_remaining), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN batches bt ON p.id = bt.product_id
      WHERE p.is_active = 1 AND (p.name LIKE ? OR p.product_code LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)
      GROUP BY p.id ORDER BY p.name LIMIT 50`,
      [search, search, search, search]
    );
    res.json({ success: true, products: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/barcode/:code', verifyToken, requirePermission(['inventory_view', 'billing']), async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
        COALESCE(SUM(bt.quantity_remaining), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN batches bt ON p.id = bt.product_id
      WHERE p.barcode = ? AND p.is_active = 1
      GROUP BY p.id`,
      [req.params.code]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    if (rows.length === 1) {
      res.json({ success: true, product: rows[0] });
    } else {
      res.json({ success: true, products: rows, multiple: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', verifyToken, requirePermission(['inventory_view', 'billing', 'purchase_create']), async (req, res) => {
  try {
    const product = await dbGet(
      `SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const batches = await dbAll(
      `SELECT bt.*, l.name as location_name
      FROM batches bt
      LEFT JOIN locations l ON bt.location_id = l.id
      WHERE bt.product_id = ? AND bt.quantity_remaining > 0
      ORDER BY COALESCE(bt.expire_date, '9999-12-31') ASC, bt.created_at ASC`,
      [req.params.id]
    );

    const stockByLocation = await dbAll(
      `SELECT l.id as location_id, l.name as location_name, COALESCE(SUM(bt.quantity_remaining), 0) as stock
      FROM locations l
      LEFT JOIN batches bt ON l.id = bt.location_id AND bt.product_id = ? AND bt.quantity_remaining > 0
      WHERE l.is_active = 1
      GROUP BY l.id`,
      [req.params.id]
    );

    product.batches = batches;
    product.stock_by_location = stockByLocation;
    product.total_stock = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requirePermission('inventory_create'), async (req, res) => {
  try {
    const { product_code, name, unit, category_id, brand_id, default_buying_rate, default_selling_price, minimum_stock_level, bulk_quantity, bulk_price, tax_percent, barcode, img_path, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Product name is required' });

    const code = product_code || `PRD-${Date.now()}`;

    const result = await dbRun(
      `INSERT INTO products (product_code, name, unit, category_id, brand_id, default_buying_rate, default_selling_price, minimum_stock_level, bulk_quantity, bulk_price, tax_percent, barcode, img_path, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, unit || 'pcs', category_id || null, brand_id || null, default_buying_rate || 0, default_selling_price || 0, minimum_stock_level || 0, bulk_quantity || null, bulk_price || null, tax_percent || 0, barcode || null, img_path || null, description || null]
    );

    res.status(201).json({ success: true, message: 'Product created', id: result.lastID, product_code: code });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      if (error.message.includes('product_code')) return res.status(400).json({ success: false, message: 'Product code already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requirePermission('inventory_edit'), async (req, res) => {
  try {
    const { product_code, name, unit, category_id, brand_id, default_buying_rate, default_selling_price, minimum_stock_level, bulk_quantity, bulk_price, tax_percent, barcode, img_path, description, is_active } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Product name is required' });

    const result = await dbRun(
      `UPDATE products SET product_code = ?, name = ?, unit = ?, category_id = ?, brand_id = ?, default_buying_rate = ?, default_selling_price = ?, minimum_stock_level = ?, bulk_quantity = ?, bulk_price = ?, tax_percent = ?, barcode = ?, img_path = ?, description = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [product_code || null, name, unit || 'pcs', category_id || null, brand_id || null, default_buying_rate || 0, default_selling_price || 0, minimum_stock_level || 0, bulk_quantity || null, bulk_price || null, tax_percent || 0, barcode || null, img_path || null, description || null, is_active !== undefined ? is_active : 1, req.params.id]
    );

    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      if (error.message.includes('product_code')) return res.status(400).json({ success: false, message: 'Product code already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requirePermission('inventory_delete'), async (req, res) => {
  try {
    const batches = await dbGet(`SELECT COUNT(*) as count FROM batches WHERE product_id = ? AND quantity_remaining > 0`, [req.params.id]);
    if (batches.count > 0) return res.status(400).json({ success: false, message: `Cannot delete. Product has ${batches.count} active batches with stock.` });
    await dbRun(`UPDATE products SET is_active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
