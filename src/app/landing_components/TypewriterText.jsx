import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function TypewriterText({ text, className }) {
  const [displayedText, setDisplayedText] = useState("");
  
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  useEffect(() => {
    let timeout;
    if (isInView) {
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          const randomDelay = Math.random() * 40 + 40;
          timeout = setTimeout(typeNextChar, randomDelay);
        }
      };
      timeout = setTimeout(typeNextChar, 400);
    } else {
      // Clear the text when scrolling out of view to prepare for a re-type
      setDisplayedText("");
    }
    return () => clearTimeout(timeout);
  }, [isInView, text]);

  const cursorVariants = {
    blinking: {
      opacity: [1, 0, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <div ref={ref} className={className} style={{ display: "inline-block", position: "relative" }}>
      <span>{displayedText}</span>
      <motion.span 
        variants={cursorVariants} 
        animate="blinking" 
        style={{ color: "#10b981", marginLeft: "2px", fontWeight: 300 }}
      >
        |
      </motion.span>
    </div>
  );
}
