const axios = require('axios');

async function testPayment() {
    // Test Payment Verify
    try {
        const url = 'https://betting-website-drab.vercel.app/api/payments/verify-payment';
        console.log(`Testing POST ${url}...`);
        const res = await axios.post(url, {
            razorpay_order_id: 'order_test',
            razorpay_payment_id: 'pay_test',
            razorpay_signature: 'sig_test',
            userId: '69c51e5e2908ba3', 
            amount: 10000
        });
        console.log('Payment Response:', res.data);
    } catch (err) {
        console.error('Payment Status:', err.response?.status);
        console.error('Payment Data:', err.response?.data);
    }

    // Test Login
    try {
        const loginUrl = 'https://betting-website-drab.vercel.app/api/auth/login';
        console.log(`Testing POST ${loginUrl}...`);
        const loginRes = await axios.post(loginUrl, {
            email: 'admin@bharatx.com',
            password: 'admin123'
        });
        console.log('Login Response:', loginRes.data);
    } catch (err) {
        console.error('Login Status:', err.response?.status);
        console.error('Login Data:', err.response?.data);
    }
}

testPayment();
