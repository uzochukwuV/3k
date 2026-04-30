const express = require('express');
const router = express.Router();

// Database setup
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../../qie-pay.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    router_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    token TEXT DEFAULT 'USDC',
    status TEXT DEFAULT 'pending',
    transaction_hash TEXT,
    qr_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  )`);
});

/**
 * Register a user's email, wallet address, and deployed Smart Router.
 * This is called by the frontend after a wallet is connected.
 */
router.post('/register', (req, res) => {
  const { email, walletAddress, routerAddress } = req.body;

  if (!email || !walletAddress) {
    return res.status(400).json({ error: "Email and wallet address are required" });
  }

  const emailKey = email.toLowerCase();
  const walletKey = walletAddress.toLowerCase();

  // Check for existing user
  db.get('SELECT * FROM users WHERE email = ? OR wallet_address = ?', [emailKey, walletKey], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (existingUser) {
      if (existingUser.email === emailKey) {
        return res.status(409).json({ error: "Email already registered" });
      }
      if (existingUser.wallet_address === walletKey) {
        return res.status(409).json({ error: "Wallet address already registered" });
      }
    }

    // Insert new user
    db.run(
      'INSERT INTO users (email, wallet_address, router_address) VALUES (?, ?, ?)',
      [emailKey, walletKey, routerAddress ? routerAddress.toLowerCase() : null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: "Failed to register user: " + err.message });
        }

        res.json({
          success: true,
          message: "User payment profile registered successfully.",
          data: {
            id: this.lastID,
            email: emailKey,
            walletAddress: walletKey,
            routerAddress: routerAddress ? routerAddress.toLowerCase() : null,
            registeredAt: new Date().toISOString()
          }
        });
      }
    );
  });
});

/**
 * Resolve an email address to user details and router address.
 */
router.get('/resolve/:email', (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailKey = email.toLowerCase();

  db.get('SELECT * FROM users WHERE email = ?', [emailKey], (err, userRecord) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (!userRecord) {
      return res.status(404).json({ error: "No user found for this email address." });
    }

    res.json({
      success: true,
      data: {
        id: userRecord.id,
        email: userRecord.email,
        walletAddress: userRecord.wallet_address,
        routerAddress: userRecord.router_address,
        registeredAt: userRecord.created_at
      }
    });
  });
});

router.get('/resolve-wallet/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  const walletKey = walletAddress.toLowerCase();

  db.get('SELECT * FROM users WHERE wallet_address = ?', [walletKey], (err, userRecord) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (!userRecord) {
      return res.status(404).json({ error: "No user found for this wallet address." });
    }

    res.json({
      success: true,
      data: {
        id: userRecord.id,
        email: userRecord.email,
        walletAddress: userRecord.wallet_address,
        routerAddress: userRecord.router_address,
        registeredAt: userRecord.created_at
      }
    });
  });
});

router.post('/update-router', (req, res) => {
  const { email, walletAddress, routerAddress } = req.body;

  if ((!email && !walletAddress) || !routerAddress) {
    return res.status(400).json({ error: "email or walletAddress and routerAddress are required" });
  }

  const routerKey = routerAddress.toLowerCase();
  const emailKey = email ? String(email).toLowerCase() : null;
  const walletKey = walletAddress ? String(walletAddress).toLowerCase() : null;

  const where = emailKey ? 'email = ?' : 'wallet_address = ?';
  const value = emailKey ?? walletKey;

  db.run(
    `UPDATE users SET router_address = ? WHERE ${where}`,
    [routerKey, value],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error: " + err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, routerAddress: routerKey });
    }
  );
});

/**
 * Generate a payment payload with QR code for sending funds to an email.
 */
router.get('/qr/:email', (req, res) => {
  const { email } = req.params;
  const { amount = '0', sender } = req.query;

  const emailKey = email.toLowerCase();

  db.get('SELECT * FROM users WHERE email = ?', [emailKey], (err, userRecord) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (!userRecord) {
      return res.status(404).json({ error: "User not found in registry." });
    }

    // Generate payment URI
    const paymentUri = `qie:pay?target=${encodeURIComponent(emailKey)}&amount=${encodeURIComponent(amount)}`;
    
    // Generate QR code data (JSON representation that can be rendered as QR)
    const qrData = {
      type: 'qie_payment',
      network: 'qie',
      recipient: {
        email: userRecord.email,
        walletAddress: userRecord.wallet_address,
        routerAddress: userRecord.router_address
      },
      amount: amount,
      token: 'USDC',
      sender: sender || 'unknown',
      timestamp: Date.now(),
      paymentUri: paymentUri
    };

    res.json({
      success: true,
      qrData: qrData,
      qrUri: paymentUri,
      recipient: {
        email: userRecord.email,
        routerAddress: userRecord.router_address
      },
      message: "Payment data generated. Encode this as a QR code on the frontend."
    });
  });
});

/**
 * Create a payment record between two users.
 */
router.post('/payments', (req, res) => {
  const { senderEmail, recipientEmail, amount, token = 'USDC' } = req.body;

  if (!senderEmail || !recipientEmail || !amount) {
    return res.status(400).json({ 
      error: "senderEmail, recipientEmail, and amount are required" 
    });
  }

  const senderKey = senderEmail.toLowerCase();
  const recipientKey = recipientEmail.toLowerCase();
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // Get sender and recipient IDs
  db.get('SELECT id FROM users WHERE email = ?', [senderKey], (err, sender) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    db.get('SELECT id FROM users WHERE email = ?', [recipientKey], (err, recipient) => {
      if (err) {
        return res.status(500).json({ error: "Database error: " + err.message });
      }

      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      // Create payment record
      db.run(
        'INSERT INTO payments (sender_id, recipient_id, amount, token) VALUES (?, ?, ?, ?)',
        [sender.id, recipient.id, parsedAmount, token],
        function(err) {
          if (err) {
            return res.status(500).json({ error: "Failed to create payment: " + err.message });
          }

          res.json({
            success: true,
            message: "Payment record created successfully",
            data: {
              id: this.lastID,
              senderId: sender.id,
              recipientId: recipient.id,
              amount: parsedAmount,
              token: token,
              status: 'pending',
              createdAt: new Date().toISOString()
            }
          });
        }
      );
    });
  });
});

/**
 * Get payment history for a user.
 */
router.get('/payments', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailKey = email.toLowerCase();

  db.get('SELECT id FROM users WHERE email = ?', [emailKey], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.all(
      `SELECT p.*, u1.email as sender_email, u2.email as recipient_email 
       FROM payments p 
       JOIN users u1 ON p.sender_id = u1.id 
       JOIN users u2 ON p.recipient_id = u2.id 
       WHERE p.sender_id = ? OR p.recipient_id = ? 
       ORDER BY p.created_at DESC`,
      [user.id, user.id],
      (err, payments) => {
        if (err) {
          return res.status(500).json({ error: "Database error: " + err.message });
        }

        res.json({
          success: true,
          data: payments.map(p => ({
            id: p.id,
            senderEmail: p.sender_email,
            recipientEmail: p.recipient_email,
            amount: p.amount,
            token: p.token,
            status: p.status,
            transactionHash: p.transaction_hash,
            createdAt: p.created_at
          }))
        });
      }
    );
  });
});

module.exports = router;
