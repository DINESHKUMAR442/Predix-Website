const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

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
const paymentLimiter = rateLimiter(10, 15 * 60 * 1000);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Create Order
router.post('/create-order', paymentLimiter, async (req, res) => {
    const { amount, currency } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const options = {
        amount: amount,
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`
    };
    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (err) {
        console.error('Order Creation Error:', err.message);
        res.status(500).json({ error: 'Order creation failed' });
    }
});

// Verify Payment
router.post('/verify-payment', paymentLimiter, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
        return res.status(400).json({ status: 'failure', message: 'Missing required fields' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");
    
    if (expectedSignature === razorpay_signature) {
        try {
            const user = await User.findById(userId);
            if (user) {
                user.realWallet = (user.realWallet || 0) + (amount / 100);
                await user.save();
                return res.status(200).json({ status: 'success', message: 'Payment verified and wallet updated', user });
            }
            res.status(404).json({ status: 'failure', message: 'User not found' });
        } catch (err) {
            console.error('[PAYMENT] DB Error:', err.message);
            res.status(500).json({ status: 'failure', message: 'Payment processing failed' });
        }
    } else {
        res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }
});

// Send Confirmation Email
router.post('/send-confirmation-email', async (req, res) => {
    const { email, amount, customerName } = req.body;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        return res.status(200).json({ message: 'Email credentials not configured' });
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
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 PrediX Prediction Market. All rights reserved.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ status: 'success', message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

module.exports = router;
