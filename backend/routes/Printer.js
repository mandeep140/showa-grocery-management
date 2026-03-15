const express = require('express');
const router = express.Router();
const net = require('net');
const { dbRun, dbGet } = require('../lib/stockHelper');

// ===== Printer Settings (DB) =====

router.get('/settings', async (req, res) => {
  try {
    let row = await dbGet('SELECT * FROM printer_settings WHERE id = 1');
    if (!row) {
      await dbRun('INSERT INTO printer_settings (id) VALUES (1)');
      row = await dbGet('SELECT * FROM printer_settings WHERE id = 1');
    }
    const settings = {
      headerLine1: row.header_line1 || '',
      headerLine2: row.header_line2 || '',
      headerLine3: row.header_line3 || '',
      footerLine1: row.footer_line1 || '',
      footerLine2: row.footer_line2 || '',
      paperWidth: row.paper_width || 32,
      showCustomerName: !!row.show_customer_name,
      showDueAmount: !!row.show_due_amount,
      showPaymentMethod: !!row.show_payment_method,
    };
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const s = req.body;
    await dbRun(
      `INSERT OR REPLACE INTO printer_settings
       (id, header_line1, header_line2, header_line3, footer_line1, footer_line2,
        paper_width, show_customer_name, show_due_amount, show_payment_method, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        s.headerLine1 || '', s.headerLine2 || '', s.headerLine3 || '',
        s.footerLine1 || '', s.footerLine2 || '',
        s.paperWidth || 32,
        s.showCustomerName !== undefined ? (s.showCustomerName ? 1 : 0) : 1,
        s.showDueAmount !== undefined ? (s.showDueAmount ? 1 : 0) : 1,
        s.showPaymentMethod !== undefined ? (s.showPaymentMethod ? 1 : 0) : 1,
      ]
    );
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== WiFi Printer (existing) =====

router.post('/print', async (req, res) => {
  const { ip, port = 9100, data } = req.body;

  if (!ip || !data) {
    return res.status(400).json({ success: false, message: 'IP and data are required' });
  }

  try {
    const buffer = Buffer.from(data, 'base64');

    await new Promise((resolve, reject) => {
      const client = new net.Socket();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          client.destroy();
          reject(new Error('Connection timed out. Check printer IP and make sure it is ON.'));
        }
      }, 10000);

      client.connect(port, ip, () => {
        client.write(buffer, (err) => {
          if (err) {
            clearTimeout(timeout);
            resolved = true;
            client.destroy();
            reject(new Error('Failed to send data to printer: ' + err.message));
            return;
          }
          setTimeout(() => {
            clearTimeout(timeout);
            resolved = true;
            client.destroy();
            resolve();
          }, 500);
        });
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          client.destroy();
          if (err.code === 'ECONNREFUSED') {
            reject(new Error('Connection refused. Make sure the printer is ON and accepts network connections on port ' + port));
          } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
            reject(new Error('Printer not reachable. Check if it is on the same network.'));
          } else if (err.code === 'ETIMEDOUT') {
            reject(new Error('Connection timed out. Check printer IP address.'));
          } else {
            reject(new Error('Printer connection error: ' + err.message));
          }
        }
      });
    });

    res.json({ success: true, message: 'Print data sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Print failed' });
  }
});

router.post('/test', async (req, res) => {
  const { ip, port = 9100 } = req.body;

  if (!ip) {
    return res.status(400).json({ success: false, message: 'IP is required' });
  }

  try {
    await new Promise((resolve, reject) => {
      const client = new net.Socket();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          client.destroy();
          reject(new Error('Connection timed out. Printer may be OFF or IP is incorrect.'));
        }
      }, 5000);

      client.connect(port, ip, () => {
        clearTimeout(timeout);
        resolved = true;
        client.destroy();
        resolve();
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          client.destroy();
          if (err.code === 'ECONNREFUSED') {
            reject(new Error('Connection refused. Printer may not accept network connections on port ' + port));
          } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
            reject(new Error('Printer not reachable. Check if both devices are on the same WiFi network.'));
          } else if (err.code === 'ETIMEDOUT') {
            reject(new Error('Connection timed out. Check the printer IP address.'));
          } else {
            reject(new Error('Connection error: ' + err.message));
          }
        }
      });
    });

    res.json({ success: true, message: 'Printer is reachable' });
  } catch (err) {
    res.json({ success: false, message: err.message || 'Cannot connect to printer' });
  }
});

module.exports = router;
