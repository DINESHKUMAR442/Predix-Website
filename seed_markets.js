const mongoose = require('mongoose');
require('dotenv').config({ path: './frontend/.env' });
const Market = require('./api/models/Market');

const MARKETS_DATA = [
    {
        question: "Will India win the next T20 Series?",
        category: "Cricket",
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400",
        probability: { yes: 0.65, no: 0.35 },
        endDate: "30 Sep 2026",
        poolSize: "₹45L"
    },
    {
        question: "Bitcoin to cross $100k by end of 2026?",
        category: "Crypto",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
        probability: { yes: 0.42, no: 0.58 },
        endDate: "31 Dec 2026",
        poolSize: "₹120L"
    },
    {
        question: "Will the Nifty 50 touch 25,000 this month?",
        category: "Finance",
        image: "https://images.unsplash.com/photo-1611974717482-48ea922c0919?w=400",
        probability: { yes: 0.30, no: 0.70 },
        endDate: "31 Oct 2026",
        poolSize: "₹85L"
    },
    {
        question: "Will any Indian movie win an Oscar in 2026?",
        category: "Entertainment",
        image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400",
        probability: { yes: 0.15, no: 0.85 },
        endDate: "28 Feb 2026",
        poolSize: "₹12L"
    },
    {
        question: "Will BJP win the 2027 UP Assembly Elections?",
        category: "Politics",
        image: "https://images.unsplash.com/photo-1541534741688-6078c64b52d2?w=400",
        probability: { yes: 0.62, no: 0.38 },
        endDate: "15 Mar 2027",
        poolSize: "₹28L"
    },
    {
        question: "Will Apple launch its first Foldable iPhone in 2026?",
        category: "Tech",
        image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=400",
        probability: { yes: 0.48, no: 0.52 },
        endDate: "30 Sep 2026",
        poolSize: "₹55L"
    },
    {
        question: "Will India reach 8% GDP growth in 2026?",
        category: "Finance",
        image: "https://images.unsplash.com/photo-1611974717482-48ea922c0919?w=400",
        probability: { yes: 0.55, no: 0.45 },
        endDate: "31 Mar 2027",
        poolSize: "₹150L"
    },
    {
        question: "Will RCB win IPL 2026?",
        category: "Cricket",
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400",
        probability: { yes: 0.18, no: 0.82 },
        endDate: "01 Jun 2026",
        poolSize: "₹67L"
    },
    {
        question: "Will Sensex cross 1,00,000 by end of 2026?",
        category: "Finance",
        image: "https://images.unsplash.com/photo-1611974717482-48ea922c0919?w=400",
        probability: { yes: 0.67, no: 0.33 },
        endDate: "31 Dec 2026",
        poolSize: "₹44L"
    },
    {
        question: "Will a SpaceX starship land on Mars in 2026?",
        category: "Space",
        image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=400",
        probability: { yes: 0.08, no: 0.92 },
        endDate: "31 Dec 2026",
        poolSize: "₹90L"
    },
    {
        question: "Will Pushpa 3 cross ₹1000 Crore worldwide?",
        category: "Entertainment",
        image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400",
        probability: { yes: 0.71, no: 0.29 },
        endDate: "30 Jun 2027",
        poolSize: "₹31L"
    },
    {
        question: "Will Neeraj Chopra break the 90m javelin barrier in 2026?",
        category: "Sports",
        image: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=400",
        probability: { yes: 0.52, no: 0.48 },
        endDate: "15 Aug 2026",
        poolSize: "₹19L"
    },
    {
        question: "Will India officially host the 2036 Olympics?",
        category: "Sports",
        image: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=400",
        probability: { yes: 0.41, no: 0.59 },
        endDate: "31 Dec 2027",
        poolSize: "₹35L"
    },
    {
        question: "Will Flipkart IPO launch in 2026?",
        category: "Startups",
        image: "https://images.unsplash.com/photo-1611974717482-48ea922c0919?w=400",
        probability: { yes: 0.47, no: 0.53 },
        endDate: "31 Dec 2026",
        poolSize: "₹42L"
    },
    {
        question: "Will UPI cross 20 Billion monthly transactions?",
        category: "Startups",
        image: "https://images.unsplash.com/photo-1611974717482-48ea922c0919?w=400",
        probability: { yes: 0.69, no: 0.31 },
        endDate: "31 Dec 2026",
        poolSize: "₹30L"
    },
    {
        question: "Will Zomato deliver via drones in 2026?",
        category: "Startups",
        image: "https://images.unsplash.com/photo-1508614589041-895b9c39f1f2?w=400",
        probability: { yes: 0.12, no: 0.88 },
        endDate: "31 Dec 2026",
        poolSize: "₹15L"
    }
];

const seedMarkets = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');
        
        await Market.deleteMany({});
        console.log('Cleared existing markets.');
        
        await Market.insertMany(MARKETS_DATA);
        console.log('Successfully seeded 18 markets!');
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedMarkets();
