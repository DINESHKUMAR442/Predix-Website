const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'PrediX_secure_secret_2026';

// Simple in-memory rate limiter
const attempts = new Map();
function rateLimiter(maxAttempts, windowMs) {
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const record = attempts.get(key) || { count: 0, start: now };
        if (now - record.start > windowMs) { record.count = 0; record.start = now; }
        record.count++;
        attempts.set(key, record);
        if (record.count > maxAttempts) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
        next();
    };
}
const authLimiter = rateLimiter(15, 15 * 60 * 1000);

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Enforce minimum password strength
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword });
        await user.save();
        console.log('User saved successfully');
        
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { id: user._id, name: user.name, email: user.email, role: user.role, demoWallet: user.demoWallet, realWallet: user.realWallet, portfolio: user.portfolio, withdrawals: user.withdrawals, tradeHistory: user.tradeHistory || [] } 
        });
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validMatch = await bcrypt.compare(password, user.password);
        if (!validMatch) {
             return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Auto-promote admin emails to admin role if not already set
        const adminEmails = ['admin@predix.com', 'admin@bharatx.com'];
        if (adminEmails.includes(user.email.toLowerCase()) && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
            console.log('✅ Auto-promoted user to admin:', user.email);
        }
        
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { id: user._id, name: user.name, email: user.email, role: user.role, demoWallet: user.demoWallet, realWallet: user.realWallet, portfolio: user.portfolio, withdrawals: user.withdrawals, tradeHistory: user.tradeHistory || [] } 
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.json({ 
            user: { id: user._id, name: user.name, email: user.email, role: user.role, demoWallet: user.demoWallet, realWallet: user.realWallet, portfolio: user.portfolio, withdrawals: user.withdrawals, tradeHistory: user.tradeHistory || [] } 
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid Session' });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        // Fetch top 10 users by balance (demo or real)
        // In a real app, you'd calculate ROI from trade history.
        const users = await User.find({})
            .select('name demoWallet realWallet role')
            .sort({ demoWallet: -1 })
            .limit(10);
            
        const leaderboard = users.map(u => ({
            id: u._id,
            name: u.name,
            roi: (Math.random() * 15 + 10).toFixed(1), // Mock ROI for now
            portfolioValue: u.demoWallet + u.realWallet,
            trades: Math.floor(Math.random() * 50 + 10) // Mock trade count
        }));
        
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Admin: Fetch All Users
router.get('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(users);
    } catch (error) {
        console.error('Fetch Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
