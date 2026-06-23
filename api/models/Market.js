const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
    question: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String },
    poolSize: { type: String, default: '₹0L' },
    volume: { type: Number, default: 0 },
    probability: {
        yes: { type: Number, required: true, default: 0.5 },
        no: { type: Number, required: true, default: 0.5 }
    },
    status: { type: String, enum: ['live', 'resolved', 'cancelled'], default: 'live' },
    outcome: { type: String, enum: ['yes', 'no', null], default: null },
    resolved: { type: Boolean, default: false },
    endDate: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Market', marketSchema);
