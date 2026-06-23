const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    marketId: { type: String, required: true },
    question: { type: String },
    side: { type: String, enum: ['yes', 'no'], required: true },
    shares: { type: Number, required: true },
    avgPrice: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
    accountMode: { type: String, enum: ['demo', 'real'], default: 'demo' }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    demoWallet: { type: Number, default: 10000 },
    realWallet: { type: Number, default: 0 },
    portfolio: [portfolioSchema],
    tradeHistory: [{
        marketId: { type: String, required: true },
        question: { type: String },
        side: { type: String, enum: ['yes', 'no'], required: true },
        shares: { type: Number, required: true },
        price: { type: Number, required: true },
        amount: { type: Number, required: true },
        accountMode: { type: String, enum: ['demo', 'real'], default: 'demo' },
        result: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
        payout: { type: Number, default: 0 },
        tradedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date }
    }],
    withdrawals: [{
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
        method: { type: String, default: 'UPI' },
        details: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
