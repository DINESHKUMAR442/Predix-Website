import React, { useState } from 'react';
import { X, ArrowRight, Wallet, Info, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WithdrawModal = ({ isOpen, onClose, onRefresh }) => {
    const { user, updateUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('UPI');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: string }

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const token = localStorage.getItem('PrediX_token');
            const res = await fetch('/api/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                    details
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', text: 'Withdrawal request submitted successfully!' });
                updateUser(data.user);
                setTimeout(() => {
                    onClose();
                    if (onRefresh) onRefresh();
                }, 2000);
            } else {
                setStatus({ type: 'error', text: data.error || 'Withdrawal failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '450px' }}>
                <button className="modal-close" onClick={onClose}><X size={20} /></button>
                
                <header className="modal-header">
                    <h2 className="modal-title">Withdraw Funds</h2>
                    <p className="modal-subtitle">Transfer your winnings to your bank account</p>
                </header>

                <div className="wallet-card" style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Available Balance</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-green)' }}>₹{(user?.realWallet || 0).toLocaleString()}</div>
                        </div>
                        <Wallet size={32} color="var(--accent-green)" opacity={0.5} />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input 
                            type="number" 
                            className="form-input"
                            placeholder="Min ₹100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="100"
                            max={user?.realWallet || 0}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select 
                            className="form-input"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
                            <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{method === 'UPI' ? 'UPI ID' : 'Bank Account Details'}</label>
                        <textarea 
                            className="form-input"
                            placeholder={method === 'UPI' ? 'e.g. username@okaxis' : 'A/C Number: 1234...\nIFSC: SBIN00...'}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            required
                            rows={method === 'UPI' ? 1 : 3}
                        />
                    </div>

                    {status && (
                        <div className={`notification ${status.type}`} style={{ marginBottom: '20px' }}>
                            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span style={{ marginLeft: '8px' }}>{status.text}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading || !amount || amount > (user?.realWallet || 0)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Request Withdrawal'}
                    </button>
                    
                    <p style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Withdrawals are typically processed within 24-48 hours.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default WithdrawModal;
