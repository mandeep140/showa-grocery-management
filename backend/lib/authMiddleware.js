const jwt = require('jsonwebtoken');
const db = require('./database');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized! Access denied.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired login.'
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, r.name as role_name, r.is_active as role_active 
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

const verifyPermission = async (req, res, next, permission) => {
  try {
    const userId = req.user.id;
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, r.name as role_name, r.permissions as permissions, r.is_active as role_active 
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

    if (user.role_name === 'admin' || user.permissions === 'all') {
      next();
      return;
    }

    let permList = [];
    try {
      permList = JSON.parse(user.permissions);
    } catch {
      permList = user.permissions ? user.permissions.split(',').map(p => p.trim()) : [];
    }

    if (!permList.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
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

module.exports = { verifyToken, isAdmin, verifyPermission, JWT_SECRET };