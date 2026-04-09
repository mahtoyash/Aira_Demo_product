import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Activity, Wind, AlertTriangle, Zap, Droplets, Thermometer, CloudRain } from 'lucide-react';

const MobileScreen = ({ children, className, style, initial, animate, transition }) => (
  <motion.div
    initial={initial}
    animate={animate}
    transition={transition}
    style={style}
    className={`absolute w-[280px] h-[580px] rounded-[40px] bg-zinc-950 border-[6px] border-zinc-800 shadow-[0_0_40px_rgba(250,204,21,0.15)] overflow-hidden flex flex-col ${className}`}
  >
    {/* Fake Notch */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-zinc-800 rounded-b-[14px] z-50 shadow-inner" />
    
    {/* Screen Content */}
    <div className="w-full h-full relative z-10 p-5 pt-12 text-white bg-gradient-to-b from-zinc-900 to-black">
      {children}
    </div>
    
    {/* Subtle Glow Overlay */}
    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-transparent pointer-events-none z-40" />
  </motion.div>
);

export default function CinematicShowcase() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const controls = useAnimation();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  // Camera Pan & Zoom Animation
  const cameraVariants = {
    hidden: { 
      rotateX: 55, 
      rotateZ: -20, 
      scale: 0.7,
      y: 100
    },
    visible: {
      rotateX: 45,
      rotateZ: -5,
      scale: 1.1,
      y: -50,
      transition: {
        duration: 15,
        ease: "linear",
      }
    }
  };

  // Screen Entrance Animations
  const leftScreenVariants = {
    hidden: { x: -600, y: 100, z: -200, opacity: 0 },
    visible: { 
      x: isMobile ? -160 : -320, 
      y: isMobile ? 60 : 40, 
      z: isMobile ? -150 : -100, 
      opacity: 1,
      transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }
    }
  };

  const centerScreenVariants = {
    hidden: { y: 600, z: 0, opacity: 0 },
    visible: { 
      y: 0, 
      z: 50, 
      opacity: 1,
      transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
    }
  };

  const rightScreenVariants = {
    hidden: { x: 600, y: 100, z: -200, opacity: 0 },
    visible: { 
      x: isMobile ? 160 : 320, 
      y: isMobile ? -60 : -40, 
      z: isMobile ? -150 : -100, 
      opacity: 1,
      transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }
    }
  };

  return (
    <section ref={containerRef} className="relative w-full h-[120vh] bg-[#050505] overflow-hidden flex items-center justify-center font-sans">
      
      {/* Soft Ambient Lighting Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px] mix-blend-screen" />
      </motion.div>

      {/* 3D Camera Container */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
        <motion.div
          variants={cameraVariants}
          initial="hidden"
          animate={controls}
          className={`relative w-full h-full flex items-center justify-center ${isMobile ? 'scale-75' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Main Center Screen: Real-Time Air Quality */}
          <MobileScreen variants={centerScreenVariants} initial="hidden" animate={controls} className="shadow-[0_20px_100px_rgba(250,204,21,0.2)]">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-zinc-400">Living Room</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ delay: 1.5, duration: 1 }}
                  className="relative w-40 h-40 rounded-full border border-zinc-800 flex flex-col items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full border-t-2 border-yellow-400 animate-[spin_3s_linear_infinite]" />
                  <span className="text-5xl font-bold text-white tracking-tighter shadow-yellow-500/50 drop-shadow-md">412</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">ppm CO2</span>
                </motion.div>
                
                <p className="text-sm text-yellow-400 font-medium mt-4 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  Optimal Air Quality
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/50">
                  <Thermometer className="w-5 h-5 text-zinc-400 mb-2" />
                  <p className="text-xl font-semibold">22°<span className="text-sm text-zinc-500">C</span></p>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/50">
                  <Droplets className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-xl font-semibold">45<span className="text-sm text-zinc-500">%</span></p>
                </div>
              </div>
            </div>
          </MobileScreen>

          {/* Left Screen: Predictive AI Insights */}
          <MobileScreen variants={leftScreenVariants} initial="hidden" animate={controls} className="opacity-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-8">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium text-zinc-300">AI Forecast</span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                  <p className="text-xs text-zinc-400 mb-1">Estimated Peak</p>
                  <p className="text-2xl font-bold text-white mb-2">850 <span className="text-sm font-normal text-zinc-500">ppm</span></p>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={isInView ? { width: '60%' } : { width: 0 }}
                      transition={{ delay: 2, duration: 2 }}
                      className="h-full bg-yellow-500" 
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Expected at 6:00 PM</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 p-4 rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mb-2" />
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                    Ventilation recommended in 45 minutes to maintain optimal cognitive function.
                  </p>
                </div>
              </div>
            </div>
          </MobileScreen>

          {/* Right Screen: Spatial Comparison */}
          <MobileScreen variants={rightScreenVariants} initial="hidden" animate={controls} className="opacity-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Space Overview</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: "Living Room", val: 412, status: "good", fill: "w-[40%]" },
                  { name: "Bedroom", val: 650, status: "moderate", fill: "w-[65%]" },
                  { name: "Kitchen", val: 890, status: "warning", fill: "w-[85%]" }
                ].map((room, i) => (
                  <motion.div 
                    key={room.name}
                    initial={{ x: 20, opacity: 0 }}
                    animate={isInView ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
                    transition={{ delay: 2 + (i * 0.2), duration: 0.5 }}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-300">{room.name}</span>
                      <span className={`text-sm font-bold ${room.status === 'good' ? 'text-green-400' : room.status === 'moderate' ? 'text-yellow-400' : 'text-orange-400'}`}>
                        {room.val}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${room.status === 'good' ? 'bg-green-400' : room.status === 'moderate' ? 'bg-yellow-400' : 'bg-orange-400'} ${room.fill}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </MobileScreen>
          
        </motion.div>
      </div>

      {/* Cinematic Text Overlay */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ delay: 3, duration: 1.5 }}
        className="absolute bottom-16 left-0 right-0 text-center z-50 pointer-events-none"
      >
        <h3 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4 drop-shadow-2xl">
          Intelligence in Every Breath.
        </h3>
        <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto drop-shadow-lg">
          Experience real-time AI forecasting designed for your well-being.
        </p>
      </motion.div>

    </section>
  );
}
