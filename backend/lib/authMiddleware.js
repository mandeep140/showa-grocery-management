const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const JWT_SECRET = process.env.JWT_SECRET;

const CONFIG_PATH = path.join(__dirname, '../config.json');
let _cachedStoreStatus = null;   
let _lastCheckTime = 0;
const CHECK_INTERVAL = 1 * 60 * 1000; 

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf-8');
  } catch (err) {
    console.error('Failed to write config.json:', err.message);
  }
}

async function checkStoreStatus() {
  const now = Date.now();

  if (_cachedStoreStatus && (now - _lastCheckTime) < CHECK_INTERVAL) {
    return _cachedStoreStatus;
  }

  const config = readConfig();
  if (!config || !config.server || !config.server.url) {
    return _cachedStoreStatus || 'active';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(config.server.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: config.store?.id,
        store_name: config.store?.name,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (data.message === 'active' || data.message === 'inactive') {
      console.log(`Store status: ${data.message} (verified at ${config.server.lastVerified})`);
      _cachedStoreStatus = data.message;
      _lastCheckTime = now;
      config.server.status = data.message;
      config.server.lastVerified = new Date().toISOString();
      writeConfig(config);

      return _cachedStoreStatus;
    }
    return config.server.status || _cachedStoreStatus || 'active';
  } catch (err) {
    console.error('Store verification failed (using last known status):', err.message);
    if (config.server.status) {
      _cachedStoreStatus = config.server.status;
      _lastCheckTime = now; 
      return config.server.status;
    }
    return _cachedStoreStatus || 'active';
  }
}

function checkDemoExpiry() {
  const config = readConfig();
  if (!config?.demo?.enabled) return { expired: false };

  const startDate = new Date(config.demo.startDate);
  const durationDays = config.demo.durationDays || 30;
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  const now = new Date();

  if (now >= expiryDate) {
    return {
      expired: true,
      expiryDate: expiryDate.toISOString(),
      message: 'Demo period has expired. Please contact support to activate your license.'
    };
  }

  const remainingMs = expiryDate - now;
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return {
    expired: false,
    expiryDate: expiryDate.toISOString(),
    remainingDays,
    startDate: config.demo.startDate,
    durationDays
  };
}

(function initStoreStatus() {
  const config = readConfig();
  if (config?.server?.status) {
    _cachedStoreStatus = config.server.status;
  }
})();

const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized! Access denied.'
    });
  }

  try {
    const demoStatus = checkDemoExpiry();
    if (demoStatus.expired) {
      return res.status(403).json({
        success: false,
        message: demoStatus.message,
        code: 'DEMO_EXPIRED'
      });
    }

    const storeStatus = await checkStoreStatus();
    if (storeStatus === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Store is deactivated. Please contact support.',
        code: 'STORE_INACTIVE'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    const userId = decoded.id;
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, r.name as role_name, r.permissions, r.is_active as role_active 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    if (!user.role_active) {
      return res.status(403).json({
        success: false,
        message: 'Role is inactive'
      });
    }

    updateLastLogin();

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

let _lastLoginUpdateTime = 0;
function updateLastLogin() {
  const now = Date.now();
  if (now - _lastLoginUpdateTime < 60000) return; 
  _lastLoginUpdateTime = now;
  try {
    const config = readConfig();
    if (config) {
      if (!config.store) config.store = {};
      config.store.lastLogin = new Date().toISOString();
      writeConfig(config);
    }
  } catch {}
}

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, r.name as role_name, r.permissions, r.is_active as role_active 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    if (!user.role_active) {
      return res.status(403).json({
        success: false,
        message: 'Role is inactive'
      });
    }

    if (user.role_name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Require Admin Role!'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
  next();
};

function parsePermissions(permString) {
  if (!permString) return [];
  if (permString === 'all') return ['all'];
  try {
    const parsed = JSON.parse(permString);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return permString.split(',').map(p => p.trim()).filter(Boolean);
}

function hasPermission(permList, required) {
  if (permList.includes('all')) return true;
  if (Array.isArray(required)) return required.some(p => permList.includes(p));
  return permList.includes(required);
}

const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (user.role_name === 'admin') {
        return next();
      }

      const permList = parsePermissions(user.permissions || req.user._permissions);

      const allowed = permissions.every(p => hasPermission(permList, p));
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied — insufficient permissions'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  };
};

module.exports = { verifyToken, isAdmin, requirePermission, parsePermissions, checkDemoExpiry, JWT_SECRET };