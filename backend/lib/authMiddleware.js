const jwt = require('jsonwebtoken');
const db = require('./database');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized! Access denied.'
    });
  }

  try {
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

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

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

module.exports = { verifyToken, isAdmin, requirePermission, parsePermissions, JWT_SECRET };