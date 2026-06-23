import React, { useState, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MarketsGrid from './components/MarketsGrid';
import AuthModal from './components/AuthModal';
import TradeModal from './components/TradeModal';
import DepositModal from './components/DepositModal';
import { MessageSquare } from 'lucide-react';

const Portfolio = React.lazy(() => import('./components/Portfolio'));
const Leaderboard = React.lazy(() => import('./components/Leaderboard'));
const Chatbot = React.lazy(() => import('./components/Chatbot'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));

const AppContent = () => {
    const { user, login } = useAuth();
    const [currentPage, setCurrentPage] = useState('markets');
    
    // Check admin access (case-insensitive and backward compatible)
    const isAdmin = user && user.email && (user.email.toLowerCase() === 'admin@predix.com' || user.email.toLowerCase() === 'admin@bharatx.com');
    
    // Modal states
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [selectedTradeSide, setSelectedTradeSide] = useState('yes');

    const handleNavigate = (page) => {
        if (page === 'login') setIsAuthModalOpen(true);
        else if (page === 'deposit') {
            if (!user) setIsAuthModalOpen(true);
            else setIsDepositModalOpen(true);
        }
        else setCurrentPage(page);
    };

    // Safely handle logout in AppContent
    React.useEffect(() => {
        if (!user && (currentPage === 'portfolio' || currentPage === 'deposit' || currentPage === 'admin')) {
            setCurrentPage('markets');
        }
    }, [user, currentPage]);

    const handleTrade = (market, side) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }
        setSelectedMarket(market);
        setSelectedTradeSide(side);
        setIsTradeModalOpen(true);
    };

    return (
        <div className="app-container">
            <Navbar 
                currentPage={currentPage} 
                onNavigate={handleNavigate} 
            />
            
            <main className="main-content">
                {currentPage === 'markets' && <MarketsGrid onTrade={handleTrade} />}
                
                <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><div className="animate-spin" style={{ width:32, height:32, border:'3px solid var(--border-color)', borderTop:'3px solid var(--primary-color)', borderRadius:'50%' }} /></div>}>
                    {currentPage === 'portfolio' && <Portfolio />}
                    {currentPage === 'leaderboard' && <Leaderboard />}
                    {currentPage === 'admin' && isAdmin && <AdminPanel />}
                </Suspense>
            </main>

            <Suspense fallback={null}>
                <Chatbot />
            </Suspense>
            
            <div className="toast-container" id="toastContainer"></div>

            {/* Modals */}
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
            
            <TradeModal 
                isOpen={isTradeModalOpen} 
                onClose={() => setIsTradeModalOpen(false)} 
                market={selectedMarket}
                initialSide={selectedTradeSide}
            />

            <DepositModal 
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
            />
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;
