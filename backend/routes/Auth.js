const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../lib/database');
const { JWT_SECRET } = require('../lib/authMiddleware');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username/phone and password are required' 
      });
    }
    
    db.get(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? OR u.phone = ?`,
      [username, username],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message 
          });
        }
        
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }
        
        if (!user.is_active) {
          return res.status(401).json({ 
            success: false, 
            message: 'Account is inactive' 
          });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }
        
        db.run(
          'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?',
          [user.id]
        );
        
        const token = jwt.sign(
          { 
            id: user.id, 
            name: user.name,
            username: user.username,
            phone: user.phone,
            role_id: user.role_id,
            role_name: user.role_name
          },
          JWT_SECRET,
          { expiresIn: '100hr' }
        );
        
        res.status(200).json({ 
          success: true, 
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            phone: user.phone,
            role_id: user.role_id,
            role_name: user.role_name,
            permissions: user.permissions
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

module.exports = router;