const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../DATABASE/showa_inventory_management.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
  db.serialize(() => {


    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        permissions TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        role_id INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        location_type TEXT NOT NULL,
        address TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT UNIQUE,
        name TEXT NOT NULL,
        unit TEXT DEFAULT 'pcs',
        category_id INTEGER,
        brand_id INTEGER,
        default_buying_rate REAL DEFAULT 0,
        default_selling_price REAL DEFAULT 0,
        minimum_stock_level INTEGER DEFAULT 0,
        bulk_quantity INTEGER,
        bulk_price REAL,
        tax_percent REAL DEFAULT 0,
        barcode TEXT,
        img_path TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (brand_id) REFERENCES brands(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS sellers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company_name TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        gst TEXT,
        opening_balance REAL DEFAULT 0,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        opening_balance REAL DEFAULT 0,
        advance_balance REAL DEFAULT 0,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        seller_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        total_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        paid_amount REAL DEFAULT 0,
        purchase_date TEXT NOT NULL,
        notes TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        purchase_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        expire_date TEXT,
        quantity_initial INTEGER NOT NULL,
        quantity_remaining INTEGER NOT NULL,
        buying_rate REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        UNIQUE(batch_no, product_id, location_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        buying_rate REAL NOT NULL,
        tax_percent REAL DEFAULT 0,
        discount_percent REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_number TEXT UNIQUE NOT NULL,
        from_location_id INTEGER NOT NULL,
        to_location_id INTEGER NOT NULL,
        transfer_date TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        transferred_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (from_location_id) REFERENCES locations(id),
        FOREIGN KEY (to_location_id) REFERENCES locations(id),
        FOREIGN KEY (transferred_by) REFERENCES users(id),
        CHECK (from_location_id != to_location_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        from_batch_id INTEGER NOT NULL,
        to_batch_id INTEGER,
        quantity INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (from_batch_id) REFERENCES batches(id),
        FOREIGN KEY (to_batch_id) REFERENCES batches(id)
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT UNIQUE NOT NULL,
        buyer_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        total_buy_price REAL DEFAULT 0,
        total_sell_price REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        received_amount REAL DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        status TEXT DEFAULT 'completed',
        notes TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (buyer_id) REFERENCES buyers(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        buying_rate REAL NOT NULL,
        selling_price REAL NOT NULL,
        discount_percent REAL DEFAULT 0,
        tax_percent REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL UNIQUE,
        buyer_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        amount_remaining REAL NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (buyer_id) REFERENCES buyers(id)
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        debt_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT,
        notes TEXT,
        received_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (debt_id) REFERENCES debts(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS seller_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        purchase_id INTEGER,
        amount REAL NOT NULL,
        payment_method TEXT,
        payment_type TEXT DEFAULT 'payment',
        notes TEXT,
        paid_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (paid_by) REFERENCES users(id)
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS customer_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_number TEXT UNIQUE NOT NULL,
        order_id INTEGER,
        buyer_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        refund_method TEXT,
        reason TEXT,
        status TEXT DEFAULT 'approved',
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (buyer_id) REFERENCES buyers(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS customer_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        order_item_id INTEGER,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        selling_price REAL NOT NULL,
        refund_amount REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (return_id) REFERENCES customer_returns(id) ON DELETE CASCADE,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS seller_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_number TEXT UNIQUE NOT NULL,
        seller_id INTEGER NOT NULL,
        purchase_id INTEGER,
        location_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        refund_method TEXT,
        reason TEXT,
        status TEXT DEFAULT 'approved',
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS seller_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        purchase_item_id INTEGER,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        buying_rate REAL NOT NULL,
        refund_amount REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (return_id) REFERENCES seller_returns(id) ON DELETE CASCADE,
        FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS expired_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        expire_date TEXT,
        disposal_method TEXT,
        notes TEXT,
        disposed_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (batch_id) REFERENCES batches(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (disposed_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id INTEGER NOT NULL,
        quantity_before INTEGER NOT NULL,
        quantity_change INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        notes TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        adjustment_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT NOT NULL,
        adjusted_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (adjusted_by) REFERENCES users(id)
      )
    `);


    db.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_active_name ON products(is_active, name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_batches_product_remaining ON batches(product_id, quantity_remaining)`);

    db.run(`DROP INDEX IF EXISTS sqlite_autoindex_products_2`);
    db.run(`ALTER TABLE buyers ADD COLUMN advance_balance REAL DEFAULT 0`, () => {});
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_batches_product_location ON batches(product_id, location_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_batches_expire ON batches(expire_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_batches_remaining ON batches(quantity_remaining)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_batch ON order_items(batch_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stock_history_batch ON stock_history(batch_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stock_history_location ON stock_history(location_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stock_transfers_locations ON stock_transfers(from_location_id, to_location_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_debts_buyer ON debts(buyer_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_seller_payments_seller ON seller_payments(seller_id)`);


    db.run(`
      CREATE VIEW IF NOT EXISTS vw_location_stock AS
      SELECT 
        l.id as location_id,
        l.name as location_name,
        p.id as product_id,
        p.product_code,
        p.name as product_name,
        SUM(b.quantity_remaining) as total_stock,
        p.minimum_stock_level,
        CASE 
          WHEN SUM(b.quantity_remaining) <= p.minimum_stock_level THEN 'Low Stock'
          WHEN SUM(b.quantity_remaining) = 0 THEN 'Out of Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM locations l
      CROSS JOIN products p
      LEFT JOIN batches b ON p.id = b.product_id AND l.id = b.location_id
      WHERE p.is_active = 1 AND l.is_active = 1
      GROUP BY l.id, p.id
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_expiring_batches AS
      SELECT 
        b.id as batch_id,
        b.batch_no,
        p.name as product_name,
        l.name as location_name,
        b.quantity_remaining,
        b.expire_date,
        CAST((julianday(b.expire_date) - julianday('now')) AS INTEGER) as days_to_expire
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL
        AND b.quantity_remaining > 0
        AND julianday(b.expire_date) - julianday('now') <= 30
        AND julianday(b.expire_date) >= julianday('now')
      ORDER BY days_to_expire ASC
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_expired_batches AS
      SELECT 
        b.id as batch_id,
        b.batch_no,
        p.name as product_name,
        l.name as location_name,
        b.quantity_remaining,
        b.expire_date,
        CAST((julianday('now') - julianday(b.expire_date)) AS INTEGER) as days_expired
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN locations l ON b.location_id = l.id
      WHERE b.expire_date IS NOT NULL
        AND b.quantity_remaining > 0
        AND julianday(b.expire_date) < julianday('now')
      ORDER BY days_expired DESC
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_customer_profile AS
      SELECT 
        b.id as customer_id,
        b.name,
        b.phone,
        b.address,
        b.email,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.final_amount), 0) as total_purchase_amount,
        COALESCE(SUM(o.received_amount), 0) as total_paid_amount,
        COALESCE(SUM(d.amount_remaining), 0) as total_pending_debt,
        b.opening_balance,
        b.created_at as customer_since
      FROM buyers b
      LEFT JOIN orders o ON b.id = o.buyer_id AND o.status = 'completed'
      LEFT JOIN debts d ON b.id = d.buyer_id AND d.status IN ('pending', 'partial')
      WHERE b.is_active = 1
      GROUP BY b.id
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_pending_debts AS
      SELECT 
        d.id as debt_id,
        d.order_id,
        o.invoice_id,
        b.name as customer_name,
        b.phone as customer_phone,
        d.total_amount,
        d.paid_amount,
        d.amount_remaining,
        d.created_at as debt_date
      FROM debts d
      JOIN buyers b ON d.buyer_id = b.id
      JOIN orders o ON d.order_id = o.id
      WHERE d.amount_remaining > 0
      ORDER BY d.created_at DESC
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_seller_payment_status AS
      SELECT 
        s.id as seller_id,
        s.name as seller_name,
        s.phone,
        s.company_name,
        s.opening_balance,
        COALESCE(SUM(p.final_amount), 0) as total_purchase_amount,
        COALESCE(SUM(p.paid_amount), 0) as total_paid,
        COALESCE(SUM(p.final_amount - p.paid_amount), 0) as total_pending,
        s.is_active
      FROM sellers s
      LEFT JOIN purchases p ON s.id = p.seller_id
      WHERE s.is_active = 1
      GROUP BY s.id
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_expired_summary AS
      SELECT 
        l.name as location_name,
        p.name as product_name,
        ep.quantity,
        ep.expire_date,
        ep.disposal_method,
        ep.created_at as disposal_date
      FROM expired_products ep
      JOIN products p ON ep.product_id = p.id
      JOIN locations l ON ep.location_id = l.id
      ORDER BY ep.created_at DESC
    `);

    db.run(`
      CREATE VIEW IF NOT EXISTS vw_stock_transfer_history AS
      SELECT 
        st.transfer_number,
        l1.name as from_location,
        l2.name as to_location,
        st.transfer_date,
        st.status,
        u.name as transferred_by,
        COUNT(sti.id) as total_items
      FROM stock_transfers st
      JOIN locations l1 ON st.from_location_id = l1.id
      JOIN locations l2 ON st.to_location_id = l2.id
      LEFT JOIN users u ON st.transferred_by = u.id
      LEFT JOIN stock_transfer_items sti ON st.id = sti.transfer_id
      GROUP BY st.id
      ORDER BY st.created_at DESC
    `, (err) => {
      if (err) {
        console.error('Error creating views:', err.message);
      } else {
        console.log('Database schema initialized with 25 tables, indexes, and views');
        createDefaultAdmin();
      }
    });
  });
}


async function createDefaultAdmin() {
    const adminName = 'Administrator';
    const adminUsername = 'admin';
    const adminPhone = '9999999999';
    const password = 'admin123';

    db.get('SELECT * FROM roles WHERE name = ?', ['admin'], async (err, roleRow) => {
        if (err) {
            console.error('Error checking admin role:', err.message);
            return;
        }

        let adminRoleId;

        if (!roleRow) {
            db.run(
                'INSERT INTO roles (name, color, permissions, description) VALUES (?, ?, ?, ?)',
                ['admin', '#FF0000', 'all', 'System Administrator'],
                function(err) {
                    if (err) {
                        console.error('Error creating admin role:', err.message);
                        return;
                    }
                    adminRoleId = this.lastID;
                    console.log('Admin role created');
                    createAdminUser(adminRoleId);
                }
            );
        } else {
            adminRoleId = roleRow.id;
            createAdminUser(adminRoleId);
        }
    });

    async function createAdminUser(roleId) {
        db.get('SELECT * FROM users WHERE username = ? OR phone = ?', [adminUsername, adminPhone], async (err, userRow) => {
            if (err) {
                console.error('Error checking admin user:', err.message);
            } else if (!userRow) {
                const hashedPassword = await bcrypt.hash(password, 10);
                db.run(
                    'INSERT INTO users (name, username, phone, password, role_id) VALUES (?, ?, ?, ?, ?)',
                    [adminName, adminUsername, adminPhone, hashedPassword, roleId],
                    (err) => {
                        if (err) {
                            console.error('Error creating admin user:', err.message);
                        } else {
                            console.log('Default admin user created');
                            console.log('  Username: admin');
                            console.log('  Phone: 9999999999');
                            console.log('  Password: admin123');
                        }
                    }
                );
            }
        });
    }
}

module.exports = db;