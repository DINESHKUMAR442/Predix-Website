import React, { useState, useEffect, useMemo } from 'react';
import MarketCard from './MarketCard';
import { CATEGORIES } from '../utils/mockData';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';

const MarketsGrid = ({ onTrade }) => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const res = await fetch('/api/markets');
                if (!res.ok) throw new Error('Failed to fetch markets');
                const data = await res.json();
                setMarkets(data);
            } catch (err) {
                console.error('Error fetching markets:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMarkets();
        const interval = setInterval(fetchMarkets, 15000);
        return () => clearInterval(interval);
    }, []);

    const filteredMarkets = useMemo(() => {
        return markets.filter(market => {
            const matchesCategory = activeCategory === 'all' || 
                market.category?.toLowerCase() === activeCategory.toLowerCase();
            const matchesSearch = market.question?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery, markets]);

    if (loading) {
        return (
            <div className="premium-loader">
                <div className="loader-ring">
                    <span className="loader-logo">P<span className="accent">X</span></span>
                </div>
                <div className="loader-bar"><div className="loader-bar-fill"></div></div>
                <span className="loader-text">Loading Markets...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <h3 style={{ color: '#ff4d4d' }}>Unable to load markets</h3>
                <p style={{ color: 'var(--text-muted)' }}>{error}</p>
                <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="markets-section fade-in">
            <div className="markets-hero">
                <h1>Trade on Your <span className="text-gradient">Conviction</span></h1>
                <p>The prediction market for everything that matters in India</p>
                <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal size={16} />
                    {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
            </div>

            {showFilters && (
            <div className="controls-bar" style={{ animation: 'fadeSlideDown 0.3s ease' }}>
                <div className="categories-scroll">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="cat-icon">{cat.emoji}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="search-bar">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search markets..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            )}

            <div className="markets-grid">
                {filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => (
                        <MarketCard 
                            key={market._id} 
                            market={market} 
                            onTrade={onTrade}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>No markets found</h3>
                        <p>Try adjusting your filters or search query</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketsGrid;
