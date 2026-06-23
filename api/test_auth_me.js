const axios = require('axios');

async function testAuthMe() {
    try {
        const loginUrl = 'https://betting-website-drab.vercel.app/api/auth/login';
        const loginRes = await axios.post(loginUrl, {
            email: 'admin@bharatx.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        const meUrl = 'https://betting-website-drab.vercel.app/api/auth/me';
        const meRes = await axios.get(meUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User Payload from /api/auth/me:');
        console.log(JSON.stringify(meRes.data.user, null, 2));

    } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
    }
}

testAuthMe();
