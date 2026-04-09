import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useScroll } from 'framer-motion';
import { Users, Droplets, Thermometer, Leaf, Plus, Minus, Activity, Wind, Zap, AlertTriangle, ShieldCheck, BatteryCharging } from 'lucide-react';

// --- Utility: Animated Number ---
const AnimatedNumber = ({ value, suffix = "" }) => {
  const springValue = useSpring(0, { stiffness: 60, damping: 15 });
  const displayValue = useTransform(springValue, (current) => Math.round(current) + suffix);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
};

// --- Glow Component ---
// Extremely clean, thick glowing border without spreading across the whole screen.
// Strictly acts as a moving colored light around the direct border.
const BorderGlow = ({ opacity, borderRadius = "40px" }) => (
  <motion.div 
    style={{ opacity, borderRadius }} 
    className="absolute -inset-[3px] -z-10 pointer-events-none"
  >
    <motion.div 
      animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="w-full h-full opacity-100 blur-[20px]"
      style={{
        borderRadius: "inherit",
        background: "linear-gradient(135deg, #10b981, #ec4899, #3b82f6, #10b981)",
        backgroundSize: "200% 200%"
      }}
    />
  </motion.div>
);

// --- Subcomponents ---
// Bright theme version for Layer 0
const DashCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-xl border border-zinc-100 flex flex-col ${className}`}>
    {children}
  </div>
);

const ControlButton = ({ icon: Icon, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-black hover:border-zinc-300 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
  >
    <Icon className="w-4 h-4" />
  </button>
);

export default function InteractiveDashboard() {
  const [occupancy, setOccupancy] = useState(4);
  const [plants, setPlants] = useState(12);

  const co2 = Math.max(900, 920 + (occupancy * 35) - (plants * 12));
  const humidity = Math.min(100, Math.max(30, 40 + (occupancy * 1.5) + (plants * 0.8)));
  const temperature = 21 + (occupancy * 0.3);

  const baseCredits = 100;
  const penalty = Math.max(0, (co2 - 900) * 0.1);
  const currentCredits = Math.max(0, Math.floor(baseCredits - penalty));

  const predictCO2 = (mins) => Math.max(900, Math.round(co2 + (occupancy * (mins * 0.5)) - (plants * (mins * 0.1))));
  const pred10 = predictCO2(10);
  const pred30 = predictCO2(30);
  const pred60 = predictCO2(60);

  let advisory = { text: "Status Optimal. AI HVAC controls maintaining baseline.", type: 'success', icon: Wind };
  if (co2 >= 1000 && co2 < 1200) {
    advisory = { text: "Warning: Load increasing. Recommended to initiate background filtration.", type: 'warning', icon: Activity };
  } else if (co2 >= 1200) {
    advisory = { text: "Alert: Ventilation required. Automated window actuators and max fan speed recommended.", type: 'danger', icon: AlertTriangle };
  }

  const co2Spring = useSpring(0, { stiffness: 40, damping: 12 });
  useEffect(() => { co2Spring.set(co2); }, [co2, co2Spring]);

  const radius = 45;
  const circumference = Math.PI * radius;
  const dashOffset = useTransform(co2Spring, (current) => {
    const percentage = Math.min(Math.max((current - 900) / (1800 - 900), 0), 1);
    return circumference - (percentage * circumference);
  });

  const radiusFull = 56;
  const circFull = 2 * Math.PI * radiusFull;
  const dashOffsetFull = useTransform(co2Spring, (current) => {
    const percentage = Math.min(Math.max((current - 400) / (1600), 0), 1);
    return circFull - (percentage * circFull);
  });

  const getCO2Color = (val) => {
    if (val < 1000) return "#10b981";
    if (val < 1200) return "#f59e0b";
    return "#ef4444";
  };
  const currentColor = getCO2Color(co2);

  // --- Scroll Stacking Architecture ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Layer 0: Main Grid (Fades right as overlap starts)
  const layer0Scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const layer0BlurOrigin = useTransform(scrollYProgress, [0, 0.15], [0, 10]);
  const layer0Blur = useTransform(layer0BlurOrigin, v => `blur(${v}px)`);
  const layer0Glow = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  // Layer 1: Carbon Credits Card (Starts moving immediately to overlap)
  const layer1Y = useTransform(scrollYProgress, [0, 0.3], ["100dvh", "15dvh"]);
  const layer1Scale = useTransform(scrollYProgress, [0.3, 0.55], [1, 0.94]);
  const layer1BlurOrigin = useTransform(scrollYProgress, [0.3, 0.55], [0, 8]);
  const layer1Blur = useTransform(layer1BlurOrigin, v => `blur(${v}px)`);
  const layer1Glow = useTransform(scrollYProgress, [0.1, 0.25, 0.45, 0.6], [0, 1, 1, 0]);

  // Layer 2: Filter Status Card
  const layer2Y = useTransform(scrollYProgress, [0.25, 0.55], ["100dvh", "25dvh"]);
  const layer2Scale = useTransform(scrollYProgress, [0.55, 0.8], [1, 0.96]);
  const layer2BlurOrigin = useTransform(scrollYProgress, [0.55, 0.8], [0, 6]);
  const layer2Blur = useTransform(layer2BlurOrigin, v => `blur(${v}px)`);
  const layer2Glow = useTransform(scrollYProgress, [0.4, 0.55, 0.7, 0.85], [0, 1, 1, 0]);

  // Layer 3: Energy Impact Card
  const layer3Y = useTransform(scrollYProgress, [0.5, 0.8], ["100dvh", "35dvh"]);
  const layer3Scale = useTransform(scrollYProgress, [0.8, 1], [1, 0.96]);
  const layer3BlurOrigin = useTransform(scrollYProgress, [0.8, 1], [0, 6]);
  const layer3Blur = useTransform(layer3BlurOrigin, v => `blur(${v}px)`);
  const layer3Glow = useTransform(scrollYProgress, [0.65, 0.8, 0.9, 1], [0, 1, 1, 0]);

  // Layer 4: Everything Important For You Card
  const layer4Y = useTransform(scrollYProgress, [0.75, 0.95], ["100dvh", "15dvh"]);
  const layer4Glow = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  return (
    <div className="w-full relative font-[family-name:var(--font-geist)] font-sans mt-24">
      
      {/* ----- LAYER 0 BASE (Sticky to Bottom so user scrolls naturally to its end!) ----- */}
      <div className="sticky bottom-0 w-full min-h-screen pb-4 sm:pb-20 flex justify-center z-0">
        <div className="relative w-full max-w-[1400px] mx-auto px-6 pt-16">
          
          {/* ----- LAYER 0: MAIN DASHBOARD ----- */}
          <motion.div 
            style={{ scale: layer0Scale, filter: layer0Blur }}
            className="flex flex-col items-center pointer-events-auto"
          >
            <div className="relative w-full">
              {/* Using BorderGlow exclusively highlighting the wrapper of the grid */}
              <BorderGlow opacity={layer0Glow} borderRadius="48px" />

              <div className="bg-white border rounded-[48px] p-2 relative z-10 w-full shadow-2xl">
                {/* Grid Content */}
                <div className="w-full bg-zinc-50/50 rounded-[40px] p-4 sm:p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* 1. Project Progress / Current CO2 Card */}
                  <DashCard className="lg:col-span-2 lg:row-span-2 justify-between border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Leaf className="w-5 h-5" />
                        </span>
                        <h3 className="font-semibold text-zinc-900 text-2xl tracking-tight">Current Air Quality</h3>
                      </div>
                      <p className="text-zinc-500 text-base">Real-time room telemetry based on active parameters.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10 mt-10">
                      <div className="relative flex items-end justify-center w-full max-w-[280px] sm:max-w-[320px] aspect-[2/1] overflow-hidden transform scale-100 lg:scale-110 mx-auto">
                        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                          <path d="M 5 50 A 45 45 0 0 1 95 50" stroke="#f4f4f5" strokeWidth="8" fill="none" strokeLinecap="round" />
                          <motion.path d="M 5 50 A 45 45 0 0 1 95 50" stroke={currentColor} strokeWidth="8" fill="none" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }} className="transition-colors duration-500" />
                        </svg>
                        <div className="absolute bottom-0 flex flex-col items-center">
                          <span className="text-[5rem] font-bold text-zinc-900 leading-none tracking-tighter" style={{ color: currentColor }}>
                            <AnimatedNumber value={co2} />
                          </span>
                          <span className="text-base font-semibold text-zinc-400 tracking-widest uppercase">PPM CO₂</span>
                        </div>
                      </div>

                      {/* Scale Labels */}
                      <div className="flex-1 space-y-4 w-full bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                          <span className="text-sm font-semibold text-zinc-500 flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal</span>
                          <span className="text-sm font-medium text-emerald-600">Perfect</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                          <span className="text-sm font-semibold text-zinc-500 flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate</span>
                          <span className="text-sm font-medium text-amber-600">Acceptable</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-zinc-500 flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Alert</span>
                          <span className="text-sm font-medium text-red-600">Ventilate</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Advisory */}
                    <div className={`mt-8 p-4 rounded-2xl flex items-start gap-4 border transition-colors duration-500 ${ advisory.type === 'success' ? 'bg-emerald-50 border-emerald-100' : advisory.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-200' }`}>
                      <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors duration-500 ${ advisory.type === 'success' ? 'bg-emerald-100 text-emerald-600' : advisory.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600' }`}>
                        {React.createElement(advisory.icon, { className: "w-5 h-5" })}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold mb-1 tracking-tight text-zinc-900">AI Ventilation Advisory</h4>
                        <p className="text-xs font-medium text-zinc-700">{advisory.text}</p>
                      </div>
                    </div>
                  </DashCard>

                  {/* 2. Occupancy Control Card */}
                  <DashCard className="justify-between bg-zinc-900 border-none relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.15)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-3 relative z-10 mb-4">
                      <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><Users className="w-5 h-5" /></span>
                      <h3 className="font-semibold text-white/90 text-xl tracking-tight">Occupancy</h3>
                    </div>
                    <div className="flex items-center justify-between relative z-10 my-4">
                      <ControlButton icon={Minus} onClick={() => setOccupancy(Math.max(0, occupancy - 1))} disabled={occupancy === 0} />
                      <span className="text-6xl font-bold tracking-tighter text-white"><AnimatedNumber value={occupancy} /></span>
                      <ControlButton icon={Plus} onClick={() => setOccupancy(Math.min(20, occupancy + 1))} />
                    </div>
                    <p className="text-white/40 text-xs mt-auto font-medium text-center relative z-10">+45ppm per person</p>
                  </DashCard>

                  {/* 3. Plants Control Card */}
                  <DashCard className="justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Leaf className="w-5 h-5" /></span>
                      <h3 className="font-semibold text-zinc-900 text-xl tracking-tight">Greenery</h3>
                    </div>
                    <div className="flex items-center justify-between my-4">
                      <ControlButton icon={Minus} onClick={() => setPlants(Math.max(0, plants - 1))} disabled={plants === 0} />
                      <span className="text-6xl font-bold tracking-tighter text-emerald-600"><AnimatedNumber value={plants} /></span>
                      <ControlButton icon={Plus} onClick={() => setPlants(Math.min(50, plants + 1))} />
                    </div>
                    <p className="text-zinc-400 text-xs mt-auto font-medium text-center">-15ppm per plant unit</p>
                  </DashCard>

                  {/* Bottom Row */}
                  <DashCard className="bg-gradient-to-br from-orange-50 to-pink-50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Thermometer className="w-4 h-4" /></span>
                      <h3 className="font-semibold text-orange-900 text-lg tracking-tight">Temperature</h3>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="text-5xl font-bold tracking-tighter text-orange-600"><AnimatedNumber value={temperature} /></span>
                        <span className="text-xl font-bold text-orange-400">°C</span>
                      </div>
                    </div>
                  </DashCard>

                  <DashCard className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Droplets className="w-4 h-4" /></span>
                      <h3 className="font-semibold text-blue-900 text-lg tracking-tight">Humidity</h3>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="text-5xl font-bold tracking-tighter text-blue-600"><AnimatedNumber value={humidity} /></span>
                        <span className="text-xl font-bold text-blue-400">%</span>
                      </div>
                    </div>
                  </DashCard>

                  <DashCard className="bg-zinc-900 border-none relative overflow-hidden text-white group p-5 shadow-[0_8px_30px_rgb(0,0,0,0.15)]">
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400"><Activity className="w-4 h-4" /></span>
                      <h3 className="font-semibold text-white/90 text-lg tracking-tight">AI Forecaster</h3>
                    </div>
                    <div className="space-y-3 relative z-10 mt-auto">
                      <div className="flex justify-between items-center"><span className="text-zinc-400 text-sm">-10m</span><span className="text-lg font-bold text-white"><AnimatedNumber value={pred10} suffix="ppm" /></span></div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-2"><span className="text-zinc-400 text-sm">-30m</span><span className="text-lg font-bold text-amber-400"><AnimatedNumber value={pred30} suffix="ppm" /></span></div>
                    </div>
                  </DashCard>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ----- LAYERS 1-4 OVERLAY ARCHITECTURE (Sticky to Top viewport) ----- */}
      {/* -100dvh margin perfectly aligns `containerRef` top with viewport top exactly when Layer 0 hits viewport bottom! */}
      <div ref={containerRef} className="w-full h-[400dvh] relative pointer-events-none z-10 -mt-[100dvh]">
        <div className="sticky top-0 w-full h-[100dvh] overflow-hidden flex justify-center pb-20">
          <div className="relative w-full max-w-[1400px] h-full mx-auto px-6">

          {/* ----- LAYER 1: CARBON CREDITS ----- */}
          <motion.div 
            style={{ y: layer1Y, scale: layer1Scale, filter: layer1Blur }}
            className="absolute left-0 right-0 max-w-[1250px] mx-auto z-20 pointer-events-auto"
          >
            <div className="relative w-full">
              <BorderGlow opacity={layer1Glow} borderRadius="44px" />
              
              <div className="p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 bg-[#18181b] rounded-[44px] overflow-hidden">
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <span className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Zap className="w-7 h-7" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-3xl tracking-tight">Daily Carbon Credits</h3>
                      <p className="text-zinc-400 font-medium">Earned by keeping CO2 &lt; 900 ppm</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 w-full flex flex-col items-center lg:items-end">
                  <span className="text-4xl sm:text-6xl md:text-[70px] leading-none font-bold tracking-tighter text-emerald-400 mb-2">
                    <AnimatedNumber value={currentCredits} /> <span className="text-xl sm:text-3xl text-emerald-600 font-semibold tracking-normal">/ 100</span>
                  </span>
                  
                  <div className="w-full h-4 bg-[#27272a] rounded-full overflow-hidden relative shadow-inner mt-4">
                     <motion.div 
                       className={`absolute left-0 top-0 bottom-0 rounded-full flex items-center justify-end pr-2 ${currentCredits > 80 ? 'bg-emerald-400' : currentCredits > 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                       style={{ width: `${currentCredits}%` }}
                       layout
                     >
                       <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
                     </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ----- LAYER 2: AIR PURITY & HEPA STATUS ----- */}
          <motion.div 
            style={{ y: layer2Y, scale: layer2Scale, filter: layer2Blur }}
            className="absolute left-0 right-0 max-w-[1100px] mx-auto z-30 pointer-events-auto"
          >
            <div className="relative w-full">
               <BorderGlow opacity={layer2Glow} borderRadius="36px" />

               <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 bg-[#18181b] rounded-[36px]">
                
                {/* Left: CO2 Differential (Twin Circles) */}
                <div className="flex-1 bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <h4 className="font-bold text-xl text-white">Comparative Differential</h4>
                    <Wind className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center -space-y-4 sm:space-y-0 sm:-space-x-4 relative z-10 my-4">
                    {/* First Circle (Current) */}
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0 z-10">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="#ffffff10" strokeWidth="8" fill="none" />
                        <motion.circle cx="64" cy="64" r="56" stroke={currentColor} strokeWidth="8" fill="none" 
                          strokeDasharray={circFull} 
                          style={{ strokeDashoffset: dashOffsetFull, transition: "stroke 0.5s ease" }}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md bg-zinc-900/40 rounded-full m-3 backdrop-blur-sm border border-white/5">
                        <span className="text-2xl font-bold tracking-tighter text-white leading-none" style={{ textShadow: `0 0 15px ${currentColor}80`}}>
                          <AnimatedNumber value={co2} />
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">Sensor</span>
                      </div>
                    </div>
                    
                    {/* VS Badge */}
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center -my-4 sm:-mx-4 sm:my-0 z-20 shadow-xl">
                      <span className="text-[10px] font-bold text-zinc-300">VS</span>
                    </div>

                    {/* Second Circle (Baseline) */}
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0 z-10">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="#ffffff10" strokeWidth="8" fill="none" />
                        <circle cx="64" cy="64" r="56" stroke="#0ea5e9" strokeWidth="8" fill="none" 
                          strokeDasharray={circFull} 
                          strokeDashoffset={ circFull - (circFull * 0.1) } 
                          strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px rgba(14,165,233,0.5))'}} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md bg-zinc-900/40 rounded-full m-3 backdrop-blur-sm border border-white/5">
                        <span className="text-2xl font-bold tracking-tighter text-sky-400 leading-none">400</span>
                        <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">Baseline</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10 text-center mt-6">
                    <p className="text-xs text-zinc-500 font-medium"><strong className="text-white">+{Math.max(0, co2 - 400)} PPM</strong> excess carbon compared to optimal exterior atmospheric mass.</p>
                  </div>
                </div>

                {/* Right: Graph of Flora vs CO2 Day/Night */}
                <div className="flex-1 bg-zinc-900 rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h4 className="font-bold text-xl text-emerald-400">Flora Efficacy</h4>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="flex items-center gap-2 text-[9px] font-bold text-amber-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]"/> Day Active</span>
                        <span className="flex items-center gap-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1]"/> Night Cycle</span>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium mb-8">Predictive CO₂ reduction potential per plant unit over 24 hours.</p>
                  </div>
                  
                  <div className="w-full relative h-[140px] mt-auto">
                    <svg viewBox="0 0 400 140" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="dayFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="0" x2="400" y2="0" stroke="#ffffff08" strokeWidth="1" />
                      <line x1="0" y1="70" x2="400" y2="70" stroke="#ffffff10" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="140" x2="400" y2="140" stroke="#ffffff08" strokeWidth="1" />
                      
                      {/* Night Curve */}
                      <path d="M 0 30 Q 200 35 400 25" fill="none" stroke="#6366f1" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 5px rgba(99,102,241,0.5))'}} strokeLinecap="round" />
                      
                      {/* Day Area & Curve */}
                      <path d="M 0 30 Q 150 120 400 130 L 400 140 L 0 140 Z" fill="url(#dayFill)" />
                      <path d="M 0 30 Q 150 120 400 130" fill="none" stroke="#f59e0b" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))'}} strokeLinecap="round" />
                      
                      {/* Indicator Line based on current `plants` state */}
                      <motion.g animate={{ x: (plants / 50) * 400 }} transition={{ type: "spring", stiffness: 60, damping: 15 }}>
                        <line x1="0" y1="0" x2="0" y2="160" stroke="#ffffff40" strokeWidth="1.5" strokeDasharray="4 4" />
                      </motion.g>
                    </svg>
                    
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-zinc-600">
                      <span>0</span>
                      <span>25 PLANTS</span>
                      <span>50+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ----- LAYER 3: ENERGY IMPACT ----- */}
          <motion.div 
            style={{ y: layer3Y, scale: layer3Scale, filter: layer3Blur }}
            className="absolute left-0 right-0 max-w-[950px] mx-auto z-40 pointer-events-auto"
          >
            <div className="relative w-full">
              <BorderGlow opacity={layer3Glow} borderRadius="36px" />

              <div className="p-6 md:p-10 flex flex-col lg:flex-row items-center gap-6 md:gap-10 bg-zinc-900 rounded-[36px]">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <BatteryCharging className="w-8 h-8 text-teal-400" />
                </div>
                <div className="flex-1 w-full">
                  <h3 className="font-bold text-white text-2xl tracking-tight mb-2">Energy Efficiency Impact</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-lg">Aira's predictive CO2 management prevented 14 hours of unnecessary HVAC operation this week.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-md">
                    <div className="flex flex-col">
                      <span className="text-teal-400 text-4xl font-bold tracking-tighter">142 <span className="text-lg">kWh</span></span>
                      <span className="text-xs font-semibold text-zinc-500 uppercase mt-1">Saved This Month</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-4xl font-bold tracking-tighter">$84</span>
                      <span className="text-xs font-semibold text-zinc-500 uppercase mt-1">Cost Reduction</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ----- LAYER 4: EVERYTHING IMPORTANT FOR YOU ----- */}
          <motion.div 
            style={{ y: layer4Y }}
            className="absolute left-0 right-0 max-w-[850px] mx-auto z-50 pointer-events-auto"
          >
            <div className="relative w-full">
              <BorderGlow opacity={layer4Glow} borderRadius="36px" />

              <div className="p-6 md:p-10 flex flex-col items-center gap-6 md:gap-8 bg-[#18181b] rounded-[36px] border border-white/5 shadow-2xl">
                <div className="text-center">
                  <h3 className="font-bold text-white text-3xl tracking-tight mb-2">Everything Important For You</h3>
                  <p className="text-zinc-400 text-sm max-w-lg mx-auto">Access mission critical information directly aligned with the core architecture.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-center">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 group flex-1">
                    <img 
                      src="/stack-image-1.jpeg" 
                      alt="Overview 1" 
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 group flex-1">
                    <img 
                      src="/stack-image-2.jpeg" 
                      alt="Overview 2" 
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          </div>
        </div>
      </div>
      
      {/* Anchor for Features Navigation point */}
      <div className="absolute top-[85%] w-full h-1" />
    </div>
  );
}
