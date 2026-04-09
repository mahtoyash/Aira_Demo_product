import React from 'react';
import { motion } from 'framer-motion';

export default function TransitionLayer() {
  return (
    <div className="relative w-full h-[10vh] md:h-[15vh] flex flex-col items-center justify-center bg-white z-10 py-0">
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-gray-400 font-sans tracking-[0.3em] uppercase text-xs md:text-sm"
      >
        Scroll to discover
      </motion.p>
      
      {/* Animated Decorative Vertical Line spanning down */}
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        whileInView={{ height: "60px", opacity: 1 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 w-[1px] bg-gray-300"
      />
    </div>
  );
}
