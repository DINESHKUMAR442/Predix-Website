import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatVolume, formatDate } from '../utils/mockData';

const MarketCard = ({ market, onTrade }) => {
    const yesPrice = market.probability?.yes || 0.5;
    const noPrice = market.probability?.no || 0.5;

    return (
        <div className={`market-card fade-in ${market.resolved ? 'resolved-card' : ''}`}>
            <div className="market-card-header">
                <span className={`category-tag ${market.category?.toLowerCase()}`}>
                    {market.category}
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={`live-badge ${market.status === 'live' && !market.resolved ? 'active' : ''}`} style={market.resolved ? { color: 'var(--text-muted)' } : {}}>
                        {market.status === 'live' && !market.resolved && <span className="live-dot"></span>}
                        {market.status === 'live' ? 'LIVE' : market.status.toUpperCase()}
                    </span>
                    <span className="volume-tag">{formatVolume(market.volume || 0)}</span>
                </div>
            </div>
            
            <h3 className="market-question" style={market.resolved ? { opacity: 0.7 } : {}}>{market.question}</h3>
            
            {!market.resolved ? (
                <>
                    <div className="market-prices">
                        <div className="market-price-box yes">
                            <span className="price-label">YES</span>
                            <span className="price-value">₹{yesPrice.toFixed(2)}</span>
                        </div>
                        <div className="market-price-box no">
                            <span className="price-label">NO</span>
                            <span className="price-value">₹{noPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="market-card-footer">
                        <span className="end-date">Ends {market.endDate}</span>
                        <button className="trade-btn" onClick={() => onTrade(market, 'yes')}>
                            Trade
                        </button>
                    </div>
                </>
            ) : (
                <div className="market-resolved-state">
                    <span className="resolved-badge">
                        <span className="resolved-dot"></span> Market Closed
                    </span>
                    <span className="resolved-outcome" style={{ color: market.outcome === 'yes' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        Outcome: {market.outcome}
                    </span>
                </div>
            )}
        </div>
    );
};

export default React.memo(MarketCard);
