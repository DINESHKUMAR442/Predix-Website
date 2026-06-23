require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/markets');
const withdrawRoutes = require('./routes/withdraw');
const paymentRoutes = require('./routes/payments');

const app = express();
const router = express.Router();

// ── Security Headers (inline, no helmet dependency) ──
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.removeHeader('X-Powered-By');
    next();
});

// ── CORS ──
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin.includes('vercel.app') || origin.includes('localhost')) return cb(null, true);
        if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return cb(null, true);
        cb(new Error('CORS blocked'));
    },
    credentials: true
}));

// ── Body Parsing (limit payload size) ──
app.use(express.json({ limit: '1mb' }));

// MongoDB Connection with caching for Serverless
const MONGODB_URI = process.env.MONGODB_URI;
let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing');
        throw new Error('Database URI not configured');
    }

    cachedConnection = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, 
    });
    console.log('✅ MongoDB Connected');
    return cachedConnection;
}

// Global middleware to ensure DB connection
router.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(500).json({ error: 'Service temporarily unavailable' });
    }
});

// Mount Custom API Routes
router.use('/auth', authRoutes);
router.use('/markets', marketRoutes);
router.use('/withdraw', withdrawRoutes);
router.use('/payments', paymentRoutes);

// Support both /api/path and /path
app.use('/api', router);
app.use('/', router);

// Error handling middleware (MUST BE LAST) — never leak internals
app.use((err, req, res, next) => {
    console.error('API Global Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
