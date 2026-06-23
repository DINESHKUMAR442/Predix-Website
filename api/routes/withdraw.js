const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'PrediX_secure_secret_2026';

// Request Withdrawal
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const { amount, method, details } = req.body;

        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.realWallet < amount) {
            return res.status(400).json({ error: 'Insufficient real balance' });
        }

        // Deduct from wallet immediately
        user.realWallet -= amount;
        user.withdrawals.push({
            amount,
            method,
            details,
            status: 'pending'
        });

        await user.save();
        res.json({ 
            message: 'Withdrawal request submitted', 
            user: { id: user._id, name: user.name, email: user.email, role: user.role, demoWallet: user.demoWallet, realWallet: user.realWallet, portfolio: user.portfolio, withdrawals: user.withdrawals } 
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});

// Get Withdrawal History
router.get('/history', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('withdrawals');
        res.json(user.withdrawals.reverse());
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Admin: Get All Pending Withdrawals
router.get('/admin/pending', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const users = await User.find({ 'withdrawals.status': 'pending' });
        let pending = [];
        users.forEach(u => {
            u.withdrawals.filter(w => w.status === 'pending').forEach(w => {
                pending.push({
                    userId: u._id,
                    userName: u.name,
                    userEmail: u.email,
                    withdrawal: w
                });
            });
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Admin: Update Withdrawal Status
router.post('/admin/update', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const { userId, withdrawalId, status } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const withdrawal = user.withdrawals.id(withdrawalId);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

        if (status === 'rejected' && withdrawal.status === 'pending') {
            user.realWallet += withdrawal.amount; // Refund
        }

        withdrawal.status = status;
        await user.save();
        res.json({ message: `Withdrawal ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;
