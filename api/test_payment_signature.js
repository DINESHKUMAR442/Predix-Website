const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config({path: '../frontend/.env'}); // To get MONGODB_URI

const SECRET = '65Cc7oDWxwnCYLJEpKT541Ft';
const ORDER_ID = 'order_test_' + Date.now();
const PAYMENT_ID = 'pay_test_' + Date.now();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./models/User');
    const admin = await User.findOne({email: 'admin@bharatx.com'});
    
    if (!admin) throw new Error("Admin not found");

    console.log(`Initial Real Wallet for ${admin.email}: ₹${admin.realWallet || 0}`);

    const body = ORDER_ID + '|' + PAYMENT_ID;
    const signature = crypto.createHmac('sha256', SECRET).update(body).digest('hex');

    console.log("Generated Signature:", signature);

    try {
        const url = 'https://betting-website-drab.vercel.app/api/payments/verify-payment';
        const res = await axios.post(url, {
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: signature,
            userId: admin._id.toString(),
            amount: 50000 // 500 INR in paise
        });

        console.log("Verify Response:", res.data);
    } catch (err) {
        console.error("Error Status:", err.response?.status);
        console.error("Error Data:", err.response?.data || err.message);
    }

    // Refresh user from DB to verify
    const updatedAdmin = await User.findById(admin._id);
    console.log(`Final Real Wallet for ${admin.email}: ₹${updatedAdmin.realWallet || 0}`);
    
    process.exit(0);
}

run();
