const mongoose = require('mongoose');
const User = require('./models/User');
const Market = require('./models/Market');
const dotenv = require('dotenv');
dotenv.config({ path: '../frontend/.env' });

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        const markets = await Market.find({});
        console.log('Total Markets found:', markets.length);
        markets.forEach(m => {
            console.log(`Market: ${m.question}`);
            console.log(`  - Status: ${m.status}, Resolved: ${m.resolved}, Outcome: ${m.outcome}`);
            console.log(`  - Volume: ₹${m.volume}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
