const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Market = require('../models/Market');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'PrediX_secure_secret_2026';

// Fetch all live markets
router.get('/', async (req, res) => {
    try {
        const markets = await Market.find({}).sort({ createdAt: -1 }).lean();
        res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
        res.json(markets);
    } catch (error) {
        console.error('Market Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});

// Create Market (Admin Only)
router.post('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const market = new Market(req.body);
        await market.save();
        res.json(market);
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ error: 'Creation failed', details: error.message });
    }
});

// Execute a Trade (Secure with JWT)
router.post('/trade', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const { marketId, side, amount, accountMode } = req.body;
        
        const user = await User.findById(decoded.id);
        const market = await Market.findById(marketId);
        
        if (!user || !market) return res.status(404).json({ error: 'User or Market not found' });
        
        if (market.resolved) return res.status(400).json({ error: 'Market is closed and has already been resolved.' });

        const price = market.probability[side];
        if (!price) return res.status(400).json({ error: 'Invalid side' });

        const shares = amount / price;
        const totalCost = amount;
        
        // Deduct from wallet
        if (accountMode === 'demo') {
            if (user.demoWallet < totalCost) return res.status(400).json({ error: 'Insufficient Demo Wallet balance' });
            user.demoWallet -= totalCost;
        } else {
            if (user.realWallet < totalCost) return res.status(400).json({ error: 'Insufficient Real Wallet balance' });
            user.realWallet -= totalCost;
        }

        // Add to portfolio
        const newTrade = {
            marketId: market._id.toString(),
            question: market.question,
            side: side,
            shares: shares,
            avgPrice: price,
            totalInvested: totalCost,
            accountMode: accountMode
        };
        
        const existingIdx = user.portfolio.findIndex(p => p.marketId === marketId && p.side === side && p.accountMode === accountMode);
        if (existingIdx > -1) {
            const pos = user.portfolio[existingIdx];
            const newTotalInvested = pos.totalInvested + totalCost;
            const newTotalShares = pos.shares + shares;
            user.portfolio[existingIdx] = {
                ...pos,
                shares: newTotalShares,
                totalInvested: newTotalInvested,
                avgPrice: newTotalInvested / newTotalShares
            };
        } else {
            user.portfolio.push(newTrade);
        }

        // Add to permanent trade history
        user.tradeHistory.push({
            marketId: market._id.toString(),
            question: market.question,
            side: side,
            shares: shares,
            price: price,
            amount: totalCost,
            accountMode: accountMode,
            result: 'pending',
            tradedAt: new Date()
        });

        await user.save();
        market.volume = (market.volume || 0) + totalCost;
        await market.save();

        res.json({ 
            message: 'Trade executed successfully', 
            user: { id: user._id, demoWallet: user.demoWallet, realWallet: user.realWallet, portfolio: user.portfolio, tradeHistory: user.tradeHistory || [] } 
        });
    } catch (error) {
        console.error('Trade Execution Error:', error);
        res.status(500).json({ error: 'Trade failed. Please check your session.' });
    }
});

// Resolve a Market (Admin Only)
router.post('/resolve', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const { marketId, outcome } = req.body;
        const market = await Market.findById(marketId);
        
        if (!market || market.resolved) {
            return res.status(400).json({ error: 'Market not found or already resolved' });
        }

        market.resolved = true;
        market.outcome = outcome;
        market.status = 'resolved';
        await market.save();

        const users = await User.find({ "portfolio.marketId": marketId });
        for (let user of users) {
             const positions = user.portfolio.filter(p => p.marketId === marketId);
             
             // 1. Calculate and add winnings
             for (const pos of positions) {
                  if (pos.side === outcome) {
                      if (pos.accountMode === 'real') {
                          user.realWallet += pos.shares;
                      } else {
                          user.demoWallet += pos.shares;
                      }
                  }
             }

             // 2. Remove all positions for this market from active portfolio
             user.portfolio = user.portfolio.filter(p => p.marketId !== marketId);

             // 3. Update history entries for this market
             if (user.tradeHistory && user.tradeHistory.length > 0) {
                 user.tradeHistory = user.tradeHistory.map(h => {
                     if (h.marketId === marketId && h.result === 'pending') {
                         const isWin = h.side === outcome;
                         return {
                             ...h.toObject(),
                             result: isWin ? 'won' : 'lost',
                             payout: isWin ? h.shares : 0,
                             resolvedAt: new Date()
                         };
                     }
                     return h;
                 });
             }

             await user.save();
        }
        res.json({ message: `Market resolved as ${outcome.toUpperCase()}.` });
    } catch (error) {
        console.error('Resolution Error:', error);
        res.status(500).json({ error: 'Resolution failed', details: error.message });
    }
});

// Delete Market (Admin Only)
router.delete('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        await Market.findByIdAndDelete(req.params.id);
        res.json({ message: 'Market deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Adjust Market Price (Admin Only)
router.put('/:id/price', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const { yesPrice, noPrice } = req.body;
        
        if (yesPrice === undefined || noPrice === undefined) {
            return res.status(400).json({ error: 'Both yesPrice and noPrice are required' });
        }

        const market = await Market.findById(req.params.id);
        if (!market) return res.status(404).json({ error: 'Market not found' });

        // Prices in UI are out of 10. (e.g., ₹6 = 0.6 probability)
        market.probability.yes = yesPrice / 10;
        market.probability.no = noPrice / 10;
        await market.save();

        res.json({ message: 'Market price updated successfully', market });
    } catch (error) {
        console.error('Update Price Error:', error);
        res.status(500).json({ error: 'Failed to update price' });
    }
});

module.exports = router;
