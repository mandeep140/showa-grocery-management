const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
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

const restoreUpload = multer({
  dest: os.tmpdir(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip backup files are allowed'));
    }
  }
});

router.get('/browse-dirs', verifyToken, isAdmin, (req, res) => {
  try {
    let dirPath = req.query.path || os.homedir();
    dirPath = path.resolve(dirPath);

    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ success: false, message: 'Directory not found' });
    }

    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ success: false, message: 'Path is not a directory' });
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders = entries
      .filter(e => {
        if (!e.isDirectory()) return false;
        if (e.name.startsWith('.')) return false; 
        try {
          fs.accessSync(path.join(dirPath, e.name), fs.constants.R_OK);
          return true;
        } catch { return false; }
      })
      .map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const parentPath = path.dirname(dirPath);

    res.json({
      success: true,
      current: dirPath,
      parent: parentPath !== dirPath ? parentPath : null,
      folders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error browsing directories', error: error.message });
  }
});

router.get('/', verifyToken, isAdmin, (req, res) => {
  try {
    const targetDir = req.query.dir || BACKUP_DIR;

    if (!fs.existsSync(targetDir)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(targetDir);
    const backups = files
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(targetDir, file);
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
    const { target_dir } = req.body;
    const backupDestDir = target_dir || BACKUP_DIR;

    if (!fs.existsSync(backupDestDir)) {
      fs.mkdirSync(backupDestDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `backup_${timestamp}.zip`;
    const zipPath = path.join(backupDestDir, zipFilename);

    if (!fs.existsSync(DATABASE_DIR)) {
      return res.status(404).json({ success: false, message: 'DATABASE folder not found' });
    }

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
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
    const { backupFile, dir } = req.body;

    if (!backupFile) {
      return res.status(400).json({ success: false, message: 'Backup filename is required' });
    }

    const sourceDir = dir || BACKUP_DIR;
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(sourceDir, backupFile);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

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

    db.close(async (err) => {
      if (err) console.error('Error closing database:', err);

      try {
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

router.post('/restore-upload', verifyToken, isAdmin, restoreUpload.single('backup'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const backupPath = req.file.path;
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

    db.close(async (err) => {
      if (err) console.error('Error closing database:', err);

      try {
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

        await fs.createReadStream(backupPath)
          .pipe(unzipper.Extract({ path: path.dirname(DATABASE_DIR) }))
          .promise();

        try { fs.unlinkSync(backupPath); } catch {}

        res.json({
          success: true,
          message: 'Database restored successfully from uploaded file. Please restart the server.',
          safetyBackup: path.basename(safetyZipPath)
        });
      } catch (error) {
        try { fs.unlinkSync(backupPath); } catch {}
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
    const dir = req.query.dir || BACKUP_DIR;
    const backupPath = path.join(dir, filename);
    
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
    const dir = req.query.dir || BACKUP_DIR;
    const backupPath = path.join(dir, filename);
    
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