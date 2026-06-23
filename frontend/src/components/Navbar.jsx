import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Wallet, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';

const Navbar = ({ currentPage, onNavigate }) => {
    const { user, accountMode, toggleAccountMode, logout, theme, toggleTheme } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const navLinks = [
        { id: 'markets', label: 'Markets', icon: '🏛️' },
        { id: 'portfolio', label: 'Profile', icon: '👤' },
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
    ];

    // Check admin access (case-insensitive and backward compatible)
    const isAdmin = user && user.email && (user.email.toLowerCase() === 'admin@predix.com' || user.email.toLowerCase() === 'admin@bharatx.com');
    if (isAdmin) {
        navLinks.push({ id: 'admin', label: 'Admin', icon: '⚙️' });
    }

    return (
        <>
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="logo" onClick={() => onNavigate('markets')}>
                        <span className="logo-icon">P</span>
                        <div className="logo-text">Predi<span className="logo-accent">X</span></div>
                    </div>
                </div>

                <div className="nav-links">
                    {navLinks.map(link => (
                        <button 
                            key={link.id}
                            className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
                            onClick={() => onNavigate(link.id)}
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                <div className="nav-right">
                    <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    
                    {user ? (
                        <>
                            <div className="wallet-info" onClick={() => onNavigate('deposit')}>
                                <div className={`wallet-badge ${accountMode}`}>
                                    <Wallet size={14} style={{ marginRight: '6px' }} />
                                    ₹{((accountMode === 'demo' ? user.demoWallet : user.realWallet) || 0).toLocaleString()}
                                </div>
                            </div>
                            
                            <div className="user-menu-container">
                                <button className="user-menu-btn" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                    <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                                    <ChevronDown size={14} className={isUserMenuOpen ? 'rotate-180' : ''} />
                                </button>
                                
                                {isUserMenuOpen && (
                                    <div className="user-dropdown">
                                        <div className="user-dropdown-header">
                                            <div className="user-name">{user.name}</div>
                                            <div className="user-email">{user.email}</div>
                                        </div>
                                        
                                        <div className="mode-toggle-area">
                                            <span className="mode-label">Account Mode</span>
                                            <div className="mode-switch" onClick={toggleAccountMode}>
                                                <div className={`mode-switch-track ${accountMode}`}>
                                                    <div className="mode-switch-thumb"></div>
                                                </div>
                                                <span className="mode-name">{accountMode.charAt(0).toUpperCase() + accountMode.slice(1)}</span>
                                            </div>
                                        </div>

                                        <button className="user-dropdown-item" onClick={() => { onNavigate('portfolio'); setIsUserMenuOpen(false); }}>
                                            <User size={14} style={{ marginRight: '8px' }} /> Profile
                                        </button>
                                        <button className="user-dropdown-item danger" onClick={() => { logout(); setIsUserMenuOpen(false); }}>
                                            <LogOut size={14} style={{ marginRight: '8px' }} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button className="nav-login-btn" onClick={() => onNavigate('login')}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-header">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Menu</h3>
                    <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <div className="mobile-menu-links">
                    {navLinks.map(link => (
                        <button 
                            key={link.id}
                            className={`mobile-nav-link ${currentPage === link.id ? 'active' : ''}`}
                            onClick={() => { onNavigate(link.id); setIsMobileMenuOpen(false); }}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                    {!user && (
                        <button className="btn btn-primary btn-block" style={{ marginTop: '20px' }} onClick={() => { onNavigate('login'); setIsMobileMenuOpen(false); }}>
                            Login / Signup
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;
