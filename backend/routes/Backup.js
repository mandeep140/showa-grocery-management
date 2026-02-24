const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');
const db = require('../lib/database');
const { verifyToken, isAdmin } = require('../lib/authMiddleware');

const BACKUP_DIR = path.join(__dirname, '../backups');
const DATABASE_DIR = path.join(__dirname, '../DATABASE');
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
    cb(null, `${name}_uploaded_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip backup files are allowed'));
    }
  }
});

router.get('/', verifyToken, isAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip'))
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

    res.json({ success: true, backups });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching backup list',
      error: error.message
    });
  }
});

router.post('/create', verifyToken, isAdmin, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `backup_${timestamp}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipFilename);

    if (!fs.existsSync(DATABASE_DIR)) {
      return res.status(404).json({ success: false, message: 'DATABASE folder not found' });
    }

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      // Add the entire DATABASE folder contents (db file + images/)
      archive.directory(DATABASE_DIR, 'DATABASE');
      archive.finalize();
    });

    const stats = fs.statSync(zipPath);
    res.json({
      success: true,
      message: 'Backup created successfully',
      filename: zipFilename,
      size: stats.size
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating backup', error: error.message });
  }
});

router.post('/restore', verifyToken, isAdmin, async (req, res) => {
  try {
    const { backupFile } = req.body;

    if (!backupFile) {
      return res.status(400).json({ success: false, message: 'Backup filename is required' });
    }

    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(BACKUP_DIR, backupFile);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    // Create a safety backup of the current DATABASE before replacing
    const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyZipPath = path.join(BACKUP_DIR, `pre_restore_safety_${safetyTimestamp}.zip`);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(safetyZipPath);
      const archive = archiver('zip', { zlib: { level: 6 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      if (fs.existsSync(DATABASE_DIR)) {
        archive.directory(DATABASE_DIR, 'DATABASE');
      }
      archive.finalize();
    });

    // Close DB connection, then restore
    db.close(async (err) => {
      if (err) console.error('Error closing database:', err);

      try {
        // Clear current DATABASE folder contents
        const clearDir = (dirPath) => {
          if (!fs.existsSync(dirPath)) return;
          for (const entry of fs.readdirSync(dirPath)) {
            const entryPath = path.join(dirPath, entry);
            const stat = fs.statSync(entryPath);
            if (stat.isDirectory()) {
              clearDir(entryPath);
              fs.rmdirSync(entryPath);
            } else {
              fs.unlinkSync(entryPath);
            }
          }
        };
        clearDir(DATABASE_DIR);

        // Extract the zip into the parent of DATABASE (so DATABASE/ is recreated)
        await fs.createReadStream(backupPath)
          .pipe(unzipper.Extract({ path: path.dirname(DATABASE_DIR) }))
          .promise();

        res.json({
          success: true,
          message: 'Database restored successfully. Please restart the server.',
          safetyBackup: path.basename(safetyZipPath)
        });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error restoring backup', error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error restoring backup', error: error.message });
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