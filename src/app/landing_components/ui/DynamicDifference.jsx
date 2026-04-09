import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";

const variations = [
  "Différence", // French
  "Diferencia", // Spanish
  "違い", // Japanese
  "Unterschied", // German
  "Differenza", // Italian
  "차이", // Korean
  "Difference", // English (final)
];

export default function DynamicDifference() {
  const [currentIndex, setCurrentIndex] = useState(variations.length - 1);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false });

  // Handle intersection observer to trigger animation
  useEffect(() => {
    if (isInView) {
      setIsAnimating(true);
      setCurrentIndex(0);
    } else {
      setIsAnimating(false);
      setCurrentIndex(variations.length - 1);
    }
  }, [isInView]);

  // Handle the interval timing
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= variations.length - 1) {
          clearInterval(interval);
          setIsAnimating(false);
          return variations.length - 1; 
        }
        return nextIndex;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const textVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -25, opacity: 0 },
  };

  const safeIndex = Math.min(currentIndex, variations.length - 1);

  return (
    <span ref={containerRef} className="inline-grid align-bottom text-blue-600 ml-3">
      {/* Invisible placeholder of the longest word to preserve document flow width */}
      <span className="col-start-1 row-start-1 opacity-0 pointer-events-none">
        Unterschied?
      </span>
      <span className="col-start-1 row-start-1 flex items-end justify-start">
        {isAnimating ? (
          <AnimatePresence mode="popLayout">
            <motion.span
              animate={textVariants.visible}
              exit={textVariants.exit}
              initial={textVariants.hidden}
              key={safeIndex}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="inline-block whitespace-nowrap"
            >
              {variations[safeIndex]}<span className="text-[#1a1a1a]">?</span>
            </motion.span>
          </AnimatePresence>
        ) : (
          <span className="inline-block whitespace-nowrap">
            {variations[variations.length - 1]}<span className="text-[#1a1a1a]">?</span>
          </span>
        )}
      </span>
    </span>
  );
}
