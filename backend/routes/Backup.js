const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../lib/database');
const { verifyToken, isAdmin } = require('../lib/authMiddleware');

const BACKUP_DIR = path.join(__dirname, '../backups');
const IMAGES_DIR = path.join(__dirname, '../DATABASE/images');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BACKUP_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed'));
    }
  }
});

router.get('/', verifyToken, isAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date - a.date); 
    
    res.json({
      success: true,
      backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching backup list',
      error: error.message
    });
  }
});

router.post('/create', verifyToken, isAdmin, (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `backup_${timestamp}.db`;
    
    const destinationPath = path.join(BACKUP_DIR, defaultFilename);
    
    const sourcePath = path.join(__dirname, '../DATABASE/showa_inventory_management.db');
    
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({
        success: false,
        message: 'Source database not found'
      });
    }
    
    fs.copyFileSync(sourcePath, destinationPath);

    const backupImagesDir = path.join(BACKUP_DIR, `images_${timestamp}`);
    if (fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(backupImagesDir, { recursive: true });
      const imageFiles = fs.readdirSync(IMAGES_DIR);
      for (const img of imageFiles) {
        fs.copyFileSync(path.join(IMAGES_DIR, img), path.join(backupImagesDir, img));
      }
    }
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backupPath: destinationPath,
      filename: path.basename(destinationPath)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating backup',
      error: error.message
    });
  }
});

router.post('/restore', verifyToken, isAdmin, (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup filename is required'
      });
    }
    
    let backupPath;
    if (path.isAbsolute(backupFile)) {
      backupPath = backupFile;
    } else {
      backupPath = path.join(BACKUP_DIR, backupFile);
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }
    
    const targetPath = path.join(__dirname, '../DATABASE/showa_inventory_management.db');
    
    const safetyBackupPath = path.join(BACKUP_DIR, `pre_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
    if (fs.existsSync(targetPath)) {
      fs.copyFileSync(targetPath, safetyBackupPath);
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      
      try {
        fs.copyFileSync(backupPath, targetPath);

        const backupBasename = path.basename(backupPath, '.db');
        const backupTimestamp = backupBasename.replace('backup_', '');
        const backupImagesDir = path.join(BACKUP_DIR, `images_${backupTimestamp}`);
        if (fs.existsSync(backupImagesDir)) {
          if (fs.existsSync(IMAGES_DIR)) {
            const oldImages = fs.readdirSync(IMAGES_DIR);
            for (const img of oldImages) {
              fs.unlinkSync(path.join(IMAGES_DIR, img));
            }
          } else {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
          }
          const restoreImages = fs.readdirSync(backupImagesDir);
          for (const img of restoreImages) {
            fs.copyFileSync(path.join(backupImagesDir, img), path.join(IMAGES_DIR, img));
          }
        }
        
        res.json({
          success: true,
          message: 'Database restored successfully. Please restart the server.',
          safetyBackup: safetyBackupPath
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error restoring backup',
          error: error.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restoring backup',
      error: error.message
    });
  }
});

router.delete('/:filename', verifyToken, isAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }
    
    fs.unlinkSync(backupPath);
    
    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting backup',
      error: error.message
    });
  }
});

router.get('/download/:filename', verifyToken, isAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }
    
    res.download(backupPath, filename, (err) => {
      if (err) {
        res.status(500).json({
          success: false,
          message: 'Error downloading backup',
          error: err.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading backup',
      error: error.message
    });
  }
});

router.post('/upload', verifyToken, isAdmin, upload.single('backup'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    res.json({
      success: true,
      message: 'Backup uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading backup',
      error: error.message
    });
  }
});

module.exports = router;