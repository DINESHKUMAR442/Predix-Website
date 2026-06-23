import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hi! I am PrediX AI. How can I help you with markets today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        // Simulated AI response
        setTimeout(() => {
            let response = "I'm analyzing the markets now. The UP Election market is seeing high volume today!";
            if (userMsg.toLowerCase().includes('status')) {
                response = "All systems are green. Market resolution for cricket is scheduled for midnight.";
            } else if (userMsg.toLowerCase().includes('hi')) {
                response = "Hello! Looking for some profitable trades today?";
            }
            
            setMessages(prev => [...prev, { role: 'bot', content: response }]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className="chatbot-container">
            <button 
                className={`chat-fab ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {!isOpen && <div className="chat-fab-pulse"></div>}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="chat-window"
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="bot-avatar"><Bot size={16} /></div>
                                <div>
                                    <h4>PrediX AI</h4>
                                    <span className="online-status">Online</span>
                                </div>
                            </div>
                            <Sparkles size={16} className="sparkle-icon" />
                        </div>

                        <div className="chat-messages" ref={scrollRef}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chat-msg ${msg.role}`}>
                                    <div className="msg-content">{msg.content}</div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="chat-msg bot typing">
                                    <div className="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="chat-input-area">
                            <input 
                                type="text" 
                                placeholder="Ask AI anything..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className="chat-send" onClick={handleSend}>
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
