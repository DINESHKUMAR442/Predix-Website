import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

const DepositModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // 'idle' | 'processing' | 'success' | 'fail'

    const handleDeposit = async () => {
        if (amount < 1) return;
        setLoading(true);
        setStatus('processing');

        try {
            // 1. Create order on backend
            const response = await axios.post('/api/payments/create-order', {
                amount: amount * 100, // paise
                currency: "INR"
            });
            const order = response.data;
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
                amount: order.amount,
                currency: order.currency,
                name: "PrediX",
                description: "Wallet Refill",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 2. Verify payment on backend
                        const verifyRes = await axios.post('/api/payments/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.id || user._id,
                            amount: amount * 100 // passing paise to match Razorpay unit
                        });

                        if (verifyRes.data.status === 'success') {
                            updateUser(verifyRes.data.user); // Update local user state with data from DB
                            
                            // 3. Send confirmation email
                            await axios.post('/api/payments/send-confirmation-email', {
                                email: user.email,
                                amount: amount,
                                customerName: user.name
                            }).catch(e => console.error("Email failed, but payment succeeded", e));

                            setStatus('success');
                            setLoading(false);
                            setTimeout(() => onClose(), 2000);
                        } else {
                            setStatus('fail');
                            setLoading(false);
                            alert("Payment verification failed: " + (verifyRes.data.message || "Unknown error"));
                        }
                    } catch (error) {
                        console.error("Verification failed", error);
                        setStatus('fail');
                        setLoading(false);
                        alert("Database update failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: "" // Can be added if user has phone
                },
                notes: {
                    address: "PrediX Corporate Office"
                },
                theme: { color: "#4f7df7" },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        setStatus('idle');
                    }
                },
                config: {
                    display: {
                        blocks: {
                            gpay: {
                                name: "Google Pay & UPI",
                                instruments: [
                                    { method: 'upi' },
                                    { method: 'wallet' }
                                ]
                            },
                            cards: {
                                name: "Netbanking & Cards",
                                instruments: [
                                    { method: 'netbanking' },
                                    { method: 'card' }
                                ]
                            }
                        },
                        sequence: ['block.gpay', 'block.cards'],
                        preferences: { show_default_blocks: false }
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setStatus('fail');
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            console.error("Payment initiation failed", err);
            setStatus('fail');
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Refill Your Wallet"
            subtitle="Add real funds to start trading on real outcomes"
        >
            {status === 'success' ? (
                <div className="payment-status success">
                    <ShieldCheck size={48} className="status-icon" />
                    <h3>Payment Successful!</h3>
                    <p>₹{amount} has been added to your Real Wallet.</p>
                </div>
            ) : (
                <div className="deposit-container">
                    <div className="amount-selection">
                        <label className="form-label">Amount (INR)</label>
                        <div className="input-group">
                            <IndianRupee size={18} className="input-icon" />
                            <input 
                                type="number" 
                                className="form-input" 
                                value={amount}
                                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="quick-amounts">
                        {[100, 500, 1000, 5000].map(amt => (
                            <button 
                                key={amt}
                                className={`amt-btn ${amount === amt ? 'active' : ''}`}
                                onClick={() => setAmount(amt)}
                            >
                                +₹{amt}
                            </button>
                        ))}
                    </div>

                    <div className="payment-methods">
                        <div className="method-pill active">
                            <CreditCard size={18} /> Razorpay Secure
                        </div>
                    </div>

                    <button 
                        className={`btn btn-primary btn-block ${loading ? 'disabled' : ''}`}
                        onClick={handleDeposit}
                        disabled={loading}
                        style={{ marginTop: '24px' }}
                    >
                        {loading && <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />}
                        Proceed to Pay ₹{amount}
                    </button>
                    
                    <p className="secure-text">
                        <ShieldCheck size={12} /> Securely processed by Razorpay
                    </p>
                </div>
            )}
        </Modal>
    );
};

export default DepositModal;
