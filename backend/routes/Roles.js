const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const { verifyToken, isAdmin } = require('../lib/authMiddleware');

router.get('/', verifyToken, isAdmin, (req, res) => {
  const query = 'SELECT * FROM roles ORDER BY name';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching roles',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      roles: rows
    });
  });
});

router.get('/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM roles WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching role',
        error: err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      role: row
    });
  });
});

router.post('/', verifyToken, isAdmin, (req, res) => {
  const { name, description, permissions, color, is_active = 1 } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Role name is required'
    });
  }
  
  let permissionsString = '';
  if (typeof permissions === 'string') {
    permissionsString = permissions;
  } else if (Array.isArray(permissions)) {
    permissionsString = permissions.join(', ');
  }
  
  const query = 'INSERT INTO roles (name, description, permissions, color, is_active) VALUES (?, ?, ?, ?, ?)';
  
  db.run(query, [name, description || null, permissionsString, color || null, is_active], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error creating role',
        error: err.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role_id: this.lastID
    });
  });
});

router.put('/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, color, is_active } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Role name is required'
    });
  }
  
  let permissionsString = '';
  if (typeof permissions === 'string') {
    permissionsString = permissions;
  } else if (Array.isArray(permissions)) {
    permissionsString = permissions.join(', ');
  }
  
  const query = 'UPDATE roles SET name = ?, description = ?, permissions = ?, color = ?, is_active = ? WHERE id = ?';
  
  db.run(query, [name, description || null, permissionsString, color || null, is_active !== undefined ? is_active : 1, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error updating role',
        error: err.message
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  });
});

router.delete('/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error checking role usage',
        error: err.message
      });
    }
    
    if (row.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${row.count} user(s) are assigned to this role.`
      });
    }
    
    db.get('SELECT name FROM roles WHERE id = ?', [id], (err, role) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching role',
          error: err.message
        });
      }
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      if (role.name.toLowerCase() === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the admin role'
        });
      }
      
      db.run('DELETE FROM roles WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error deleting role',
            error: err.message
          });
        }
        
        res.json({
          success: true,
          message: 'Role deleted successfully'
        });
      });
    });
  });
});

module.exports = router;
