const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../lib/database');
const { verifyToken, isAdmin } = require('../lib/authMiddleware');

router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, username, phone, password, role_id } = req.body;
    if (!name || !username || !password || !role_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, username, password, and role_id are required' 
      });
    }
    
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    if (phone) {
      const existingPhone = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM users WHERE phone = ?`,
          [phone],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    
      if (existingPhone) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number already exists' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (name, username, phone, password, role_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, username, phone, hashedPassword, role_id, 1],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message 
          });
        }
        
        return res.json({ 
          success: true, 
          message: 'User added successfully',
          user: { id: this.lastID, name, username, phone, role_id }
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

router.get('/', verifyToken, isAdmin, (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.username, u.phone, u.role_id, 
            r.name as role_name, u.is_active, u.last_login, u.created_at 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     ORDER BY u.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error: ' + err.message 
        });
      }
      
      return res.json({ 
        success: true, 
        users: rows 
      });
     }
  );  
});

router.get('/:id', verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  
  db.get(
    `SELECT u.id, u.name, u.username, u.phone, u.role_id, 
            r.name as role_name, r.permissions, u.is_active, 
            u.last_login, u.created_at 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error: ' + err.message 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      return res.json({ 
        success: true, 
        user: row 
      });
     }
  );  
});

router.delete('/:id', verifyToken, isAdmin, (req, res) => {
  const userId = req.params.id;
  
  db.run(
    `DELETE FROM users WHERE id = ?`,
    [userId],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error: ' + err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      return res.json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    }
  );
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { name, username, phone, password, role_id, is_active } = req.body;
  
  try {
    if (!name || !username || !role_id || is_active === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, username, role_id, and is_active are required' 
      });
    }
    
    const existingUsername = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE username = ? AND id != ?`,
        [username, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    if (phone) {
      const existingPhone = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM users WHERE phone = ? AND id != ?`,
          [phone, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (existingPhone) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number already exists' 
        });
      }
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    db.run(
      `UPDATE users SET name = ?, username = ?, phone = ?, 
       password = COALESCE(?, password), role_id = ?, is_active = ? 
       WHERE id = ?`,
      [name, username, phone, hashedPassword, role_id, is_active, userId],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }
        
        return res.json({ 
          success: true, 
          message: 'User updated successfully' 
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});


module.exports = router;