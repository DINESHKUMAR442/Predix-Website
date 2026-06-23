import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, subtitle, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay open" onClick={onClose}>
                    <motion.div 
                        className="modal" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <button className="modal-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                        
                        {(title || subtitle) && (
                            <div className="modal-header">
                                {title && <h2 className="modal-title">{title}</h2>}
                                {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                            </div>
                        )}
                        
                        <div className="modal-body">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
