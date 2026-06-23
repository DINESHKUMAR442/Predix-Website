export const MARKETS_DATA = []; // Deprecated, using API

export const CATEGORIES = [
    { id: 'all', label: 'All Markets', emoji: '🔥' },
    { id: 'Cricket', label: 'Cricket', emoji: '🏏' },
    { id: 'Finance', label: 'Finance', emoji: '📈' },
    { id: 'Politics', label: 'Politics', emoji: '🏛️' },
    { id: 'Entertainment', label: 'Entertainment', emoji: '🎬' },
    { id: 'Tech', label: 'Tech', emoji: '💻' },
    { id: 'Sports', label: 'Sports', emoji: '⚽' },
    { id: 'Startups', label: 'Startups', emoji: '🚀' },
    { id: 'Space', label: 'Space', emoji: '🚀' }
];

export const formatVolume = (v) => {
    if (typeof v === 'string' && v.includes('₹')) return v;
    if (v >= 10000000) return '₹' + (v / 10000000).toFixed(1) + 'Cr';
    if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
    if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
    return '₹' + v;
};

export const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // Return raw string if not a date
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const MOCK_TRADERS = [
    { id: 'mock-1', name: 'Priya Sharma', roi: 34.7, portfolioValue: 13470, trades: 47 },
    { id: 'mock-2', name: 'Arjun Mehta', roi: 28.2, portfolioValue: 12820, trades: 62 },
    { id: 'mock-3', name: 'Sneha Reddy', roi: 22.5, portfolioValue: 12250, trades: 35 },
    { id: 'mock-4', name: 'Vikram Singh', roi: 18.9, portfolioValue: 11890, trades: 51 },
    { id: 'mock-5', name: 'Ananya Patel', roi: 14.3, portfolioValue: 11430, trades: 28 },
    { id: 'mock-6', name: 'Rohit Gupta', roi: 9.8, portfolioValue: 10980, trades: 41 },
    { id: 'mock-7', name: 'Kavya Nair', roi: 5.2, portfolioValue: 10520, trades: 19 },
    { id: 'mock-8', name: 'Amit Joshi', roi: -2.1, portfolioValue: 9790, trades: 33 }
];
