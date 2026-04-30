const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const kycRoutes = require('./routes/kycRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;

// Database and collections
let db = null;
let usersCollection = null;
let paymentsCollection = null;

async function connectDB() {
  if (!MONGODB_URI) {
    console.log('ℹ️  MONGODB_URI not set; starting without MongoDB');
    return;
  }
  try {
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB');

    db = client.db('qie_pay');
    usersCollection = db.collection('users');
    paymentsCollection = db.collection('payments');

    // Create indexes
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ walletAddress: 1 }, { unique: true });
    await paymentsCollection.createIndex({ senderEmail: 1 });
    await paymentsCollection.createIndex({ recipientEmail: 1 });
    await paymentsCollection.createIndex({ createdAt: -1 });

    console.log('✅ Database indexes created');

    // Make db available to routes
    app.locals.db = db;
    app.locals.usersCollection = usersCollection;
    app.locals.paymentsCollection = paymentsCollection;

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Continuing without MongoDB');
  }
}

// Connect to database before starting server
connectDB().then(() => {
  // API Routes
  app.use('/api/kyc', kycRoutes);
  app.use('/api/payments', paymentRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'QIE Pay Backend',
      database: db ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 KYC endpoints: http://localhost:${PORT}/api/kyc`);
    console.log(`💳 Payment endpoints: http://localhost:${PORT}/api/payments`);
  });
});
