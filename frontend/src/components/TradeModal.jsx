import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, TrendingUp, Wallet, Loader2 } from 'lucide-react';

const TradeModal = ({ isOpen, onClose, market, initialSide }) => {
    const { user, accountMode, updateUser } = useAuth();
    const [side, setSide] = useState(initialSide || 'yes');
    const [amount, setAmount] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!market) return null;

    const price = side === 'yes' ? (market.probability?.yes || 0.5) : (market.probability?.no || 0.5);
    const shares = amount / price;
    const potentialReturn = shares * 1;
    const potentialProfit = potentialReturn - amount;
    const currentBalance = user ? (accountMode === 'demo' ? user.demoWallet : user.realWallet) : 0;
    const canAfford = currentBalance >= amount;

    const handleConfirm = async () => {
        if (!user || !canAfford || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch('/api/markets/trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    marketId: market._id,
                    side: side,
                    amount: amount,
                    accountMode: accountMode
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Trade failed');

            // Update local user state with new balances/portfolio from server
            updateUser(data.user);
            
            // Show success toast (assuming there's a global method or just close)
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerText = 'Trade Successful! 🚀';
            document.getElementById('toastContainer')?.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

            onClose();
        } catch (err) {
            console.error('Trade Submission Error:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Place Order"
            subtitle={market.question}
        >
            <div className="trade-container">
                <div className="trade-tabs">
                    <button 
                        className={`trade-tab ${side === 'yes' ? 'active yes' : ''}`} 
                        onClick={() => setSide('yes')}
                    >
                        <span>Yes</span>
                        <span className="tab-price">₹{(market.probability?.yes || 0.5).toFixed(2)}</span>
                    </button>
                    <button 
                        className={`trade-tab ${side === 'no' ? 'active no' : ''}`} 
                        onClick={() => setSide('no')}
                    >
                        <span>No</span>
                        <span className="tab-price">₹{(market.probability?.no || 0.5).toFixed(2)}</span>
                    </button>
                </div>

                <div className="trade-amount-wrapper">
                    <div className="trade-amount-header">
                        <span className="trade-label">Amount</span>
                        <span className="trade-balance">
                            <Wallet size={12} /> ₹{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className={`trade-input-box ${side}`}>
                        <span className="currency-symbol">₹</span>
                        <input 
                            type="number" 
                            value={amount || ''} 
                            onChange={(e) => setAmount(Number(e.target.value) || 0)}
                            onClick={(e) => e.target.select()}
                            min="1"
                        />
                    </div>
                    <div className="trade-quick-amts">
                        {[50, 100, 500, 1000].map(amt => (
                            <button key={amt} className="qt-btn" onClick={() => setAmount(amount + amt)}>
                                +₹{amt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="trade-details">
                    <div className="detail-row">
                        <span>Avg. Price</span>
                        <span>₹{price.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                        <span>Expected Shares</span>
                        <span>{shares.toFixed(shares > 100 ? 0 : 2)}</span>
                    </div>
                    <div className="detail-row highlight">
                        <span>Potential Return</span>
                        <span className="green">₹{potentialReturn.toFixed(2)}</span>
                    </div>
                </div>

                {error && (
                    <div className="trade-error visible">
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}

                {!canAfford && !error && (
                    <div className="trade-warning visible">
                        <AlertTriangle size={14} /> Insufficient balance to place this trade
                    </div>
                )}

                <button 
                    className={`trade-submit-btn ${side}`} 
                    disabled={!canAfford || isSubmitting || amount <= 0}
                    onClick={handleConfirm}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : `Buy ${side.toUpperCase()}`}
                </button>
            </div>
        </Modal>
    );
};

export default TradeModal;
