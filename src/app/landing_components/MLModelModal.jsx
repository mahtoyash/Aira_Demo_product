import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function MLModelModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-white/20 font-[family-name:var(--font-geist)]"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl p-6 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 text-center shrink-0">
              <h2 className="text-3xl font-bold text-black tracking-tight mb-2">Our Machine Learning Model</h2>
              <p className="text-zinc-600">The intelligence behind Aether's unrivaled predictive accuracy.</p>
            </div>

            <div className="w-full flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-50">
              <img 
                src={`${import.meta.env.BASE_URL}ml-model.jpeg`}
                alt="Machine Learning Model" 
                className="w-full h-full object-contain"
              />
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
