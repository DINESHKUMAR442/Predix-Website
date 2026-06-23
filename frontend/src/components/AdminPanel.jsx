import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../utils/mockData';
import { Plus, CheckCircle, AlertCircle, Users, BarChart2, Calendar, Tag, Info, Loader2, Trash2 } from 'lucide-react';

const AdminPanel = () => {
    const [markets, setMarkets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingMarket, setEditingMarket] = useState(null);
    const [editPrices, setEditPrices] = useState({ yes: 5, no: 5 });
    const [showUsers, setShowUsers] = useState(false);
    const [newMarket, setNewMarket] = useState({
        question: '',
        category: 'Politics',
        endDate: '',
        probability: { yes: 0.5, no: 0.5 }
    });
    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('PrediX_token');
            const [mRes, wRes, uRes] = await Promise.all([
                fetch('/api/markets'),
                fetch('/api/withdraw/admin/pending', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/auth/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            const mData = await mRes.json();
            const wData = await wRes.json();
            const uData = uRes.ok ? await uRes.json() : [];
            
            setMarkets(mData);
            setWithdrawals(Array.isArray(wData) ? wData : []);
            setUsers(Array.isArray(uData) ? uData : []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResolve = async (marketId, outcome) => {
        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch('/api/markets/resolve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ marketId, outcome })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Operation failed' });
        }
    };

    const handleDelete = async (marketId) => {
        console.log('Attempting to delete market:', marketId);
        if (!window.confirm('Are you sure you want to delete this market? This cannot be undone.')) {
            console.log('Delete cancelled by user');
            return;
        }
        
        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch(`/api/markets/${marketId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.error || 'Delete failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Delete failed' });
        }
    };

    const handleWithdrawUpdate = async (userId, withdrawalId, status) => {
        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch('/api/withdraw/admin/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, withdrawalId, status })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: `Withdrawal ${status} successfully` });
                fetchData();
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Update failed' });
        }
    };

    const handleCreateMarket = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch('/api/markets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMarket)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Market created successfully!' });
                fetchData();
                setShowCreateForm(false);
                setNewMarket({ question: '', category: 'Politics', endDate: '', probability: { yes: 0.5, no: 0.5 } });
            } else {
                setMessage({ type: 'error', text: data.error || data.details || 'Creation failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Creation failed' });
        }
    };

    const handleUpdatePrice = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch(`/api/markets/${editingMarket._id}/price`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ yesPrice: editPrices.yes, noPrice: editPrices.no })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Price updated successfully!' });
                fetchData();
                setEditingMarket(null);
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Update failed' });
        }
    };

    if (loading && markets.length === 0) return (
        <div className="premium-loader">
            <div className="loader-ring">
                <span className="loader-logo">P<span className="accent">X</span></span>
            </div>
            <div className="loader-bar"><div className="loader-bar-fill"></div></div>
            <span className="loader-text">Loading Dashboard...</span>
        </div>
    );

    const stats = {
        totalMarkets: markets.length,
        pendingWithdrawals: withdrawals.length,
        activeMarkets: markets.filter(m => !m.resolved).length,
        totalUsers: users.length,
    };

    return (
        <div className="admin-page fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Manage markets and platform health</p>
                </div>
                <button className="trade-btn" onClick={() => setShowCreateForm(true)}>
                    <Plus size={16} style={{ marginRight: '8px' }} /> New Market
                </button>
            </header>

            {message && (
                <div className={`notification ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span style={{ marginLeft: '8px' }}>{message.text}</span>
                </div>
            )}

            <div className="portfolio-stats">
                <div className="portfolio-stat-card blue">
                    <div className="stat-icon-wrapper"><BarChart2 size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Markets</span>
                        <span className="stat-value">{stats.totalMarkets}</span>
                    </div>
                </div>
                <div className="portfolio-stat-card purple">
                    <div className="stat-icon-wrapper"><Calendar size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Active</span>
                        <span className="stat-value">{stats.activeMarkets}</span>
                    </div>
                </div>
                <div className="portfolio-stat-card orange">
                    <div className="stat-icon-wrapper"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Withdrawals</span>
                        <span className="stat-value">{stats.pendingWithdrawals}</span>
                    </div>
                </div>
                <div className="portfolio-stat-card green" onClick={() => setShowUsers(!showUsers)} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon-wrapper"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Users {showUsers ? '▲' : '▼'}</span>
                        <span className="stat-value">{stats.totalUsers}</span>
                    </div>
                </div>
            </div>

            <div className="portfolio-content" style={{ display: 'grid', gap: '32px' }}>
                {withdrawals.length > 0 && (
                    <div className="content-card">
                        <div className="card-header" style={{ background: 'var(--accent-orange)', color: 'white' }}>
                            <h3>Pending Withdrawals</h3>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Details</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map((w, idx) => (
                                        <tr key={w.withdrawal._id || idx}>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{w.userName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.userEmail}</div>
                                            </td>
                                            <td style={{ fontWeight: '700' }}>₹{w.withdrawal.amount.toLocaleString()}</td>
                                            <td>{w.withdrawal.method}</td>
                                            <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>{w.withdrawal.details}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button className="action-btn yes" onClick={() => handleWithdrawUpdate(w.userId, w.withdrawal._id, 'completed')}>Approve</button>
                                                    <button className="action-btn no" onClick={() => handleWithdrawUpdate(w.userId, w.withdrawal._id, 'rejected')}>Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="content-card">
                    <div className="card-header">
                        <h3>Market Oversight</h3>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Market Details</th>
                                    <th>Category</th>
                                    <th>Volume</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markets.map(market => (
                                    <tr key={market._id}>
                                        <td className="market-cell">{market.question}</td>
                                        <td>
                                            <span className={`category-tag ${market.category?.toLowerCase() || 'general'}`}>
                                                {market.category}
                                            </span>
                                        </td>
                                        <td>₹{(market.volume || 0).toLocaleString()}</td>
                                        <td>
                                            {market.resolved ? (
                                                <span className="status-badge resolved">Resolved ({market.outcome?.toUpperCase()})</span>
                                            ) : (
                                                <span className="status-badge active">Active</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                {!market.resolved && (
                                                    <>
                                                        <button className="action-btn yes" onClick={() => handleResolve(market._id, 'yes')}>Yes</button>
                                                        <button className="action-btn no" onClick={() => handleResolve(market._id, 'no')}>No</button>
                                                        <button className="action-btn" style={{ background: 'var(--accent-blue)', color: 'white', padding: '6px 12px' }} onClick={() => {
                                                            setEditingMarket(market);
                                                            setEditPrices({ 
                                                                yes: (market.probability?.yes || 0.5) * 10, 
                                                                no: (market.probability?.no || 0.5) * 10 
                                                            });
                                                        }}>Adjust Price</button>
                                                    </>
                                                )}
                                                <button className="action-btn delete" onClick={() => handleDelete(market._id)} title="Delete Market">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users Section - Toggle */}
                {showUsers && (
                <div className="content-card">
                    <div className="card-header" style={{ background: 'var(--accent-green)', color: 'white' }}>
                        <h3>Registered Users ({users.length})</h3>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Demo Wallet</th>
                                    <th>Real Wallet</th>
                                    <th>Trades</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.role === 'admin' ? 'active' : ''}`}>
                                                {u.role?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>₹{(u.demoWallet || 0).toLocaleString()}</td>
                                        <td>₹{(u.realWallet || 0).toLocaleString()}</td>
                                        <td>{(u.portfolio || []).length}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>

            {showCreateForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
                        <header className="modal-header">
                            <h2 className="modal-title">Create Market</h2>
                        </header>
                        <form onSubmit={handleCreateMarket}>
                            <div className="form-group">
                                <label><Info size={14} /> Question</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Will India win the next match?"
                                    value={newMarket.question}
                                    onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><Tag size={14} /> Category</label>
                                    <select 
                                        value={newMarket.category}
                                        onChange={(e) => setNewMarket({...newMarket, category: e.target.value})}
                                    >
                                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><Calendar size={14} /> End Date</label>
                                    <input 
                                        type="date" 
                                        value={newMarket.endDate}
                                        onChange={(e) => setNewMarket({...newMarket, endDate: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="trade-btn" style={{ width: '100%', marginTop: '20px', padding: '12px' }}>
                                Launch Market
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editingMarket && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setEditingMarket(null)}>×</button>
                        <header className="modal-header">
                            <h2 className="modal-title">Adjust Price</h2>
                            <p className="modal-subtitle" style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-muted)' }}>{editingMarket.question}</p>
                        </header>
                        <form onSubmit={handleUpdatePrice} style={{ marginTop: '20px' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Yes Price (₹)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0.1"
                                        max="9.9"
                                        value={editPrices.yes}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                            setEditPrices({ yes: val, no: val === '' ? '' : Math.max(0, 10 - val).toFixed(2) });
                                        }}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>No Price (₹)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0.1"
                                        max="9.9"
                                        value={editPrices.no}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                            setEditPrices({ no: val, yes: val === '' ? '' : Math.max(0, 10 - val).toFixed(2) });
                                        }}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="trade-btn" style={{ width: '100%', marginTop: '20px', padding: '12px' }}>
                                Save Prices
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
