const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../frontend/.env') });
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const authRoutes = require('../api/routes/auth');
const marketRoutes = require('../api/routes/markets');
const User = require('../api/models/User');

const app = express();
const rootDir = path.resolve(__dirname, '..');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/predix';
console.log('Using MongoDB URI:', MONGODB_URI.split('@')[1] ? 'ATLAS_CLUSTER' : 'LOCAL');
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected to:', MONGODB_URI.includes('cluster') ? 'Atlas' : 'Local'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Razorpay instance setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SVW7hT0apunCG2',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '65Cc7oDWxwnCYLJEpKT541Ft'
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

app.use(cors());
app.use(express.json());

// Debug logging
app.use((req, res, next) => {
    if (req.path.includes('/api/')) {
        console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/markets', marketRoutes);

// Serve static files
app.use(express.static(rootDir, { index: 'index.html' }));

// Endpoint to create a Razorpay Order
app.post('/create-order', async (req, res) => {
    const { amount, currency } = req.body;

    const options = {
        amount: amount, // amount in the smallest currency unit (paise for INR)
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.send(order);
    } catch (error) {
        console.error('Razorpay Error:', error);
        res.status(500).send({ error: error.message });
    }
});

// Endpoint to verify Razorpay payment signature
app.post('/verify-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '65Cc7oDWxwnCYLJEpKT541Ft')
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        try {
            // Persist to MongoDB
            const user = await User.findById(userId);
            if (user) {
                user.realWallet = (user.realWallet || 0) + (amount / 100); // amount was in paise
                await user.save();
                return res.send({ status: 'success', message: 'Payment verified and wallet updated', user });
            }
            res.status(404).send({ status: 'failure', message: 'User not found' });
        } catch (err) {
            console.error('Wallet update error:', err);
            res.status(500).send({ status: 'failure', message: 'Database update failed' });
        }
    } else {
        res.status(400).send({ status: 'failure', message: 'Invalid payment signature' });
    }
});

// Endpoint to send a confirmation email after successful deposit
app.post('/send-confirmation-email', async (req, res) => {
    const { email, amount, customerName } = req.body;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_USER === 'your-email@gmail.com') {
        console.warn('Email credentials not configured. Skipping email.');
        return res.status(200).send({ message: 'Email credentials not configured' });
    }

    const mailOptions = {
        from: `PrediX Prediction Market <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '💰 Deposit Successful - PrediX',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                <h2 style="color: #4f7df7; text-align: center;">PrediX Receipt</h2>
                <p>Hello <strong>${customerName || 'Trader'}</strong>,</p>
                <p>Your deposit was successful! We've added the funds to your Real Account wallet.</p>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
                    <p style="margin: 0;"><strong>Transaction Amount:</strong> ₹${amount}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Completed ✅</p>
                </div>
                <p>You can now start placing trades in our real-money prediction markets.</p>
                <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.APP_URL || 'https://' + req.get('host')}" style="background-color: #4f7df7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 PrediX Prediction Market. All rights reserved.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', email);
        res.send({ status: 'success', message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send({ error: 'Failed to send email' });
    }
});

// Fallback: serve index.html for any unmatched GET requests
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving static files from: ${rootDir}`);
});
