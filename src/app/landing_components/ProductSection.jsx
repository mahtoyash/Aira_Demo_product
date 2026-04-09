import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import StackedPanels from './ui/StackedPanels';

export default function ProductSection() {
  const text = "What we make ?";
  const [displayedText, setDisplayedText] = useState("");
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      setDisplayedText("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(""); // reset when scrolling out of view so it types again
    }
  }, [isInView]);

  return (
    <section className="relative w-full flex flex-col items-center pt-4 sm:pt-8 pb-[150px] sm:pb-[200px] md:pb-[300px] bg-[#fdfbf7] overflow-hidden -mt-10 md:-mt-20 z-30">
      {/* Liquid / Jelly Transition Divider */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20" style={{ transform: 'translateY(-99%)' }}>
        <svg 
          data-name="Layer 1" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-[calc(100%+2px)] h-[120px] md:h-[200px]"
          fill="#fdfbf7"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.69,32.22,118.82,60.89,190.17,68A367.6,367.6,0,0,0,321.39,56.44Z" />
        </svg>
      </div>

      <div
        ref={containerRef}
        className="w-full relative flex items-center justify-center -mt-16 py-10"
      >
        <h2 className="text-[40px] sm:text-[55px] md:text-[90px] lg:text-[130px] font-sans font-bold text-[#1a1a1a] flex items-center tracking-tight">
          {displayedText}
          {/* Blinking Cursor */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 0.6, repeatType: "reverse" }}
            className="inline-block ml-2 md:ml-3 w-[6px] sm:w-[8px] md:w-[16px] h-[40px] sm:h-[55px] md:h-[90px] lg:h-[130px] bg-[#1a1a1a]"
          />
        </h2>
      </div>

      <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 md:px-12 lg:px-20 mt-8 md:mt-16 lg:mt-24 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-20 relative z-50">
        <div className="w-full md:w-[40%] flex flex-col space-y-8 z-10 shrink-0">
           <motion.h3 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="text-3xl sm:text-4xl md:text-[60px] lg:text-[85px] font-sans font-bold text-[#1a1a1a] leading-[1.1] md:leading-[1.05] tracking-tight"
           >
             Understand How Your<br className="hidden md:block" /> Space Affects You
           </motion.h3>
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
             className="text-lg sm:text-xl md:text-2xl lg:text-4xl text-zinc-600 font-medium max-w-xl leading-snug"
           >
             Monitor and analyze your air, anytime, from anywhere.
           </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="w-full md:w-[60%] h-[350px] sm:h-[450px] md:h-[650px] lg:h-[750px] border border-zinc-200/60 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] relative"
        >
          {/* Subtle noise pattern to match Shadway context */}
          <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
          <StackedPanels />
        </motion.div>
      </div>
    </section>
  );
}
