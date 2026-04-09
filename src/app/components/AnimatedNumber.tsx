import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface AnimatedNumberProps {
  value: string | number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const valueStr = String(value);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  const characters = valueStr.split('');

  return (
    <span ref={ref} className={`inline-flex items-center tabular-nums ${className || ''}`}>
      {characters.map((char, index) => {
        const isNumber = !isNaN(Number(char)) && char !== ' ';
        
        if (isNumber) {
          const numValue = Number(char);
          const digits = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
          
          return (
            <span 
              key={index} 
              className="relative inline-flex flex-col overflow-hidden align-middle" 
              style={{ height: '1.2em', lineHeight: '1.2em', width: '1ch' }}
            >
              <motion.div
                initial={{ y: "-10.8em" }}
                animate={isInView ? { y: `-${(9 - numValue) * 1.2}em` } : { y: "-10.8em" }}
                transition={{ 
                  duration: 1.2,
                  delay: 0.1 + (index * 0.1),
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="absolute left-0 right-0 flex flex-col items-center"
              >
                {digits.map((d) => (
                  <span 
                    key={d} 
                    className="flex justify-center items-center w-full" 
                    style={{ height: '1.2em', lineHeight: '1.2em' }}
                  >
                    {d}
                  </span>
                ))}
              </motion.div>
            </span>
          );
        }
        
        return (
          <span 
            key={index} 
            className="inline-flex flex-col justify-center overflow-hidden align-middle" 
            style={{ height: '1.2em', lineHeight: '1.2em' }}
          >
            <motion.span
               initial={{ y: "-1.2em", opacity: 0 }}
               animate={isInView ? { y: 0, opacity: 1 } : { y: "-1.2em", opacity: 0 }}
               transition={{ duration: 0.8, delay: 0.2 + (index * 0.1) }}
               className="flex items-center"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
