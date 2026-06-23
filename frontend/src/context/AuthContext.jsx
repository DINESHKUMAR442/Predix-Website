import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accountMode, setAccountMode] = useState('demo'); // 'demo' | 'real'
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('PrediX_token');
            if (token) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('PrediX_token');
                    }
                } catch (error) {
                    console.error('Session restoration failed:', error);
                }
            }
            
            const savedMode = localStorage.getItem('PrediX_mode') || 'demo';
            setAccountMode(savedMode);

            const savedTheme = localStorage.getItem('PrediX_theme') || 'dark';
            setTheme(savedTheme);
            document.body.setAttribute('data-theme', savedTheme);
            
            setLoading(false);
        };
        
        initAuth();
    }, []);

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        localStorage.setItem('PrediX_token', data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        
        localStorage.setItem('PrediX_token', data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('PrediX_token');
    };

    const toggleAccountMode = () => {
        const newMode = accountMode === 'demo' ? 'real' : 'demo';
        setAccountMode(newMode);
        localStorage.setItem('PrediX_mode', newMode);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('PrediX_theme', newTheme);
    };

    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    const value = {
        user,
        accountMode,
        theme,
        loading,
        login,
        register,
        logout,
        toggleAccountMode,
        toggleTheme,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
