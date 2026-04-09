import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Droplets, Leaf } from 'lucide-react';

export default function VisionModal({ isOpen, onClose }) {
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
            className="relative w-full max-w-2xl bg-white rounded-3xl p-8 md:p-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden"
          >
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-black tracking-tight mb-3">Our Vision</h2>
              <p className="text-zinc-600 leading-relaxed text-lg">
                Solving real-life problems by empowering you with invisible telemetry. Aira ensures you live in a perfectly balanced environment.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-8">
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-black mb-2">CO2 Level Monitoring</h3>
                <p className="text-sm text-zinc-500">Reads and tracks CO2 levels across rooms in your home to maintain optimal breathing conditions.</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-black mb-2">Daily Carbon Limits</h3>
                <p className="text-sm text-zinc-500">Shows daily carbon limits and checks the efficiency of each room, promoting a sustainable lifestyle.</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 md:col-span-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Droplets className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-black mb-2">Comprehensive Air Quality Analysis</h3>
                <p className="text-sm text-zinc-500">Continuously analyzes air quality, detecting invisible pollutants, controlling humidity, and predicting potential health risks before they become a problem.</p>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
