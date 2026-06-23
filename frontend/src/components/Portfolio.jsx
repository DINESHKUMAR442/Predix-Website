import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, History, Landmark } from 'lucide-react';
import WithdrawModal from './WithdrawModal';

const Portfolio = () => {
    const { user, accountMode, updateUser } = useAuth();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const fetchLatestUser = async () => {
        const token = localStorage.getItem('PrediX_token');
        if (token) {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    updateUser(data.user);
                }
            } catch (err) {
                console.error('Portfolio refresh failed:', err);
            }
        }
    };

    useEffect(() => {
        fetchLatestUser();
        const interval = setInterval(fetchLatestUser, 15000);
        return () => clearInterval(interval);
    }, []);

    if (!user) return (
        <div className="premium-loader">
            <div className="loader-ring">
                <span className="loader-logo">P<span className="accent">X</span></span>
            </div>
            <div className="loader-bar"><div className="loader-bar-fill"></div></div>
            <span className="loader-text">Please sign in to view your profile</span>
        </div>
    );

    const portfolio = user.portfolio || [];
    const walletBalance = accountMode === 'demo' ? (user.demoWallet || 0) : (user.realWallet || 0);
    
    // Calculate stats from live portfolio data
    const totalInvested = portfolio.reduce((acc, pos) => acc + (pos.totalInvested || 0), 0);
    const currentValue = portfolio.reduce((acc, pos) => acc + (pos.shares * (pos.currentPrice || pos.avgPrice || 0)), 0);
    const totalPnL = currentValue - totalInvested;
    const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const totalPortfolioValue = walletBalance + currentValue;

    const stats = [
        { label: 'Total Value', value: totalPortfolioValue, icon: <Wallet size={20} />, color: 'blue' },
        { label: 'Net P&L', value: totalPnL, icon: <TrendingUp size={20} />, color: totalPnL >= 0 ? 'green' : 'red' },
        { label: 'Active Positions', value: portfolio.length.toString(), icon: <History size={20} />, color: 'purple' },
        { label: 'Return (ROI)', value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'cyan' }
    ];

    return (
        <div className="portfolio-page fade-in">
            <div className="profile-header-card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'var(--bg-secondary)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px', boxShadow: 'var(--shadow-md)', flexWrap: 'wrap' }}>
                <div className="profile-avatar-large" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', flexShrink: 0 }}>
                    {user.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{user.name}</h1>
                        <span style={{ padding: '4px 10px', background: user.role === 'admin' ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-primary)', color: user.role === 'admin' ? 'var(--accent-purple)' : 'var(--text-secondary)', border: `1px solid ${user.role === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'var(--border-color)'}`, borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {user.role === 'admin' ? 'Administrator' : 'Trader'}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 16px 0' }}>{user.email}</p>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ padding: '8px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accountMode === 'real' ? 'var(--accent-green)' : 'var(--accent-yellow)', display: 'inline-block' }}></span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Trading Mode: <span style={{ color: 'var(--text-primary)' }}>{accountMode.toUpperCase()}</span></span>
                        </div>
                        
                        {accountMode === 'real' && (
                            <button 
                                className="trade-btn" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '600', borderRadius: 'var(--radius-sm)' }}
                                onClick={() => setShowWithdrawModal(true)}
                            >
                                <Landmark size={16} /> Withdraw Funds
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.02em' }}>Portfolio Performance</h2>
            <div className="portfolio-stats">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`portfolio-stat-card ${stat.color} stagger-${idx+1}`}>
                        <div className="stat-icon-wrapper">{stat.icon}</div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">
                                {typeof stat.value === 'number' ? `₹${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : stat.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="portfolio-content">
                <div className="content-card">
                    <div className="card-header">
                        <h3>Active Positions</h3>
                    </div>
                    
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Market</th>
                                    <th>Side</th>
                                    <th>Shares</th>
                                    <th>Avg Price</th>
                                    <th>Current</th>
                                    <th>P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {portfolio.length > 0 ? portfolio.map((pos, idx) => {
                                    const currentPrice = pos.currentPrice || pos.avgPrice;
                                    const pnl = (pos.shares * currentPrice) - pos.totalInvested;
                                    return (
                                        <tr key={pos.marketId || idx}>
                                            <td className="market-cell">{pos.question || 'Prediction Market'}</td>
                                            <td><span className={`badge ${pos.side.toLowerCase()}`}>{pos.side.toUpperCase()}</span></td>
                                            <td>{pos.shares.toFixed(2)}</td>
                                            <td>₹{pos.avgPrice.toFixed(2)}</td>
                                            <td>₹{currentPrice.toFixed(2)}</td>
                                            <td className={pnl >= 0 ? 'green' : 'red'}>
                                                {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="6" className="empty-row" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📈</div>
                                            <h3>No active positions</h3>
                                            <p>Your trades will appear here once you place them</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="content-card" style={{ marginTop: '32px' }}>
                    <div className="card-header">
                        <h3>Trade History</h3>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Market</th>
                                    <th>Side</th>
                                    <th>Amount</th>
                                    <th>Result</th>
                                    <th>Payout</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.tradeHistory && user.tradeHistory.length > 0 ? (
                                    user.tradeHistory.slice().reverse().map((trade, idx) => (
                                        <tr key={trade._id || idx}>
                                            <td className="market-cell">{trade.question}</td>
                                            <td><span className={`badge ${trade.side.toLowerCase()}`}>{trade.side.toUpperCase()}</span></td>
                                            <td>₹{trade.amount.toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${trade.result}`}>
                                                    {trade.result.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className={trade.payout > 0 ? 'green' : ''}>
                                                {trade.payout > 0 ? `+₹${trade.payout.toFixed(2)}` : '₹0.00'}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {new Date(trade.tradedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="empty-row" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                            No trade history found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {user.withdrawals && user.withdrawals.length > 0 && (
                    <div className="content-card" style={{ marginTop: '32px' }}>
                        <div className="card-header">
                            <h3>Withdrawal History</h3>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.withdrawals.slice().reverse().map((w, idx) => (
                                        <tr key={w._id || idx}>
                                            <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                                            <td>₹{w.amount.toLocaleString()}</td>
                                            <td>{w.method}</td>
                                            <td>
                                                <span className={`status-badge ${w.status}`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <WithdrawModal 
                isOpen={showWithdrawModal} 
                onClose={() => setShowWithdrawModal(false)}
                onRefresh={fetchLatestUser}
            />
        </div>
    );
};

export default Portfolio;
