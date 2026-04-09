import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function FeaturesSection() {
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section className="relative w-full bg-[#050505] text-white py-16 sm:py-24 md:py-32 px-4 sm:px-6 flex flex-col items-center overflow-hidden font-[family-name:var(--font-geist)]">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Context */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-[800px] text-center mb-12 sm:mb-16 md:mb-24 relative z-10 px-2"
      >
        <h2 className="text-[12px] sm:text-[14px] md:text-[16px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-4 sm:mb-6">Invisible Threats, Visible Data</h2>
        <h3 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[54px] leading-[1.15] sm:leading-[1.1] font-semibold tracking-[-0.02em] text-gray-100">
          Gain total awareness of the <br className="hidden sm:block" /> environment you create.
        </h3>
      </motion.div>

      {/* Grid of Features */}
      <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative z-10">
        
        {/* Feature 1: Live Telemetry */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="group relative flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
        >
          <div>
            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="text-[20px] sm:text-[24px] md:text-[28px] font-semibold mb-3 md:mb-4 text-gray-100">Live Telemetry</h4>
            <p className="text-[15px] sm:text-[16px] md:text-[18px] text-gray-400 leading-relaxed font-light">
              Don't guess what you're breathing. We tap into your proprietary sensor hardware to deliver ultra low-latency CO2 ppm readings inside any closed space.
            </p>
          </div>
          
          {/* Simulated UI for Feature 1 */}
          <div className="mt-12 p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center">
             <span className="text-gray-500 text-[14px] uppercase tracking-wider mb-2">Current CO2 Level</span>
             <div className="flex items-baseline gap-2">
               <span className="text-[64px] font-[family-name:var(--font-pixel)] text-emerald-400 tracking-tighter">840</span>
               <span className="text-[20px] text-emerald-600 font-bold">ppm</span>
             </div>
             <span className="mt-2 text-emerald-400/80 text-[14px] bg-emerald-400/10 px-3 py-1 rounded-full">Optimal Airflow</span>
          </div>
        </motion.div>

        {/* Feature 2: Spatial Benchmarking */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="group relative flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
        >
          <div>
            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h4 className="text-[20px] sm:text-[24px] md:text-[28px] font-semibold mb-3 md:mb-4 text-gray-100">Cross-Room Audits</h4>
            <p className="text-[15px] sm:text-[16px] md:text-[18px] text-gray-400 leading-relaxed font-light">
              Instantly compare toxic build-up in your current location against other environments safely monitored by Aira. Isolate ventilation failures fast.
            </p>
          </div>

          {/* Simulated UI for Feature 2 */}
          <div className="mt-12 p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-4">
             <div className="w-full">
               <div className="flex justify-between text-[14px] text-gray-300 mb-2"><span>Boardroom A (Current)</span> <span className="text-red-400">1200 ppm</span></div>
               <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-red-500 rounded-full"></motion.div>
               </div>
             </div>
             <div className="w-full">
               <div className="flex justify-between text-[14px] text-gray-300 mb-2"><span>Open Office B</span> <span className="text-emerald-400">450 ppm</span></div>
               <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} whileInView={{ width: '30%' }} transition={{ duration: 1, delay: 0.7 }} className="h-full bg-emerald-500 rounded-full"></motion.div>
               </div>
             </div>
          </div>
        </motion.div>

        {/* Feature 3: LSTM Prediction */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="group relative flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-white/[0.08] to-white/[0.01] border border-blue-500/30 hover:shadow-[0_0_40px_0_rgba(59,130,246,0.15)] transition-all"
        >
          <div>
            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h4 className="text-[20px] sm:text-[24px] md:text-[28px] font-semibold mb-3 md:mb-4 text-white">LSTM AI Forecasting</h4>
            <p className="text-[15px] sm:text-[16px] md:text-[18px] text-gray-300 leading-relaxed font-light">
              Why react when you can predict? Our custom LSTM deep learning model forecasts CO2 saturation <span className="text-indigo-400 font-medium">10, 30, and 60 minutes</span> into the future, stopping poor air quality before it happens.
            </p>
          </div>

          {/* Simulated UI for Feature 3 */}
          <div className="mt-12 p-6 rounded-2xl bg-black/60 border border-indigo-500/20 flex flex-col gap-3 relative overflow-hidden">
            {/* Fake grid graph background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="relative z-10 flex items-end justify-between h-[80px] px-2">
               {/* 10 min */}
               <div className="flex flex-col items-center gap-2">
                 <span className="text-white text-[15px] font-bold">1100</span>
                 <motion.div initial={{ height: 0 }} whileInView={{ height: '40px' }} transition={{ duration: 0.8, delay: 0.5 }} className="w-3 bg-indigo-500 rounded-t-sm shadow-[0_0_10px_rgba(99,102,241,0.5)]"></motion.div>
                 <span className="text-gray-500 text-[12px]">+10m</span>
               </div>
               
               {/* 30 min */}
               <div className="flex flex-col items-center gap-2">
                 <span className="text-orange-400 text-[15px] font-bold">1850</span>
                 <motion.div initial={{ height: 0 }} whileInView={{ height: '70px' }} transition={{ duration: 0.8, delay: 0.7 }} className="w-3 bg-orange-500 rounded-t-sm shadow-[0_0_10px_rgba(249,115,22,0.5)]"></motion.div>
                 <span className="text-gray-500 text-[12px]">+30m</span>
               </div>

               {/* 60 min */}
               <div className="flex flex-col items-center gap-2">
                 <span className="text-red-500 text-[15px] font-bold">2400</span>
                 <motion.div initial={{ height: 0 }} whileInView={{ height: '100px' }} transition={{ duration: 0.8, delay: 0.9 }} className="w-3 bg-red-600 rounded-t-sm shadow-[0_0_15px_rgba(220,38,38,0.8)]"></motion.div>
                 <span className="text-gray-500 text-[12px]">+60m</span>
               </div>
            </div>
            <div className="relative z-10 w-full text-center mt-2 border-t border-gray-800 pt-2">
              <span className="text-red-500 text-[12px] font-medium tracking-wide">⚠ CRITICAL BUILDUP IMMINENT</span>
            </div>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
