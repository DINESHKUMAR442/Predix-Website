const mongoose = require('mongoose');
const User = require('./api/models/User');
require('dotenv').config({ path: './frontend/.env' });

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ 'portfolio.0': { $exists: true } });
        console.log('Users with portfolio found:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.email}`);
            u.portfolio.forEach(p => {
                console.log(`  - Market: ${p.question}, Mode: ${p.accountMode}, Side: ${p.side}, Shares: ${p.shares}`);
            });
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
