import { useRef, useEffect, useState } from 'react';
import { LucideIcon, Plus, Minus } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  showMeter?: boolean;
  meterValue?: number;
  maxMeterValue?: number;
  invertMeterColors?: boolean;
  showHealthBar?: boolean;
  healthBarCurrent?: number;
  healthBarMax?: number;
  showControls?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  showMeter, 
  meterValue = 0, 
  maxMeterValue = 1000,
  invertMeterColors = false,
  showHealthBar = false,
  healthBarCurrent = 0,
  healthBarMax = 1000,
  showControls = false,
  onIncrement,
  onDecrement
}: StatCardProps) {
  const meterPercentage = Math.min(Math.max(meterValue / maxMeterValue, 0), 1);
  const healthPercentage = Math.min(Math.max(healthBarCurrent / healthBarMax, 0), 1);
  const needleRef = useRef<HTMLDivElement>(null);
  const healthBarRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(needleRef, { once: false, amount: 0.5 });
  const isHealthBarInView = useInView(healthBarRef, { once: false, amount: 0.5 });
  const [needleAngle, setNeedleAngle] = useState(-90);
  const prevMeterRef = useRef(0);

  // Speedometer-style animation with bounce overshoot
  useEffect(() => {
    if (isInView) {
      const targetAngle = -90 + (meterPercentage * 180);
      const startAngle = prevMeterRef.current === 0 ? -90 : needleAngle;
      const duration = 1800;
      const startTime = performance.now();

      const bounceEase = (t: number): number => {
        // spring-like bounce: overshoot then settle
        if (t < 0.6) {
          // ease out to overshoot
          return (t / 0.6) * 1.08;
        } else if (t < 0.75) {
          // bounce back
          return 1.08 - ((t - 0.6) / 0.15) * 0.12;
        } else if (t < 0.88) {
          // small overshoot again
          return 0.96 + ((t - 0.75) / 0.13) * 0.06;
        } else {
          // settle to 1
          return 1.02 - ((t - 0.88) / 0.12) * 0.02;
        }
      };

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = bounceEase(progress);
        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        setNeedleAngle(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setNeedleAngle(targetAngle); // snap to exact
        }
      };

      requestAnimationFrame(animate);
      prevMeterRef.current = meterPercentage;
    } else {
      setNeedleAngle(-90);
    }
  }, [isInView, meterPercentage]);

  // Gauge color based on position
  const getGaugeColor = () => {
    if (invertMeterColors) {
      if (meterPercentage < 0.4) return '#FF375F';
      if (meterPercentage < 0.7) return '#fbbf24';
      return '#34d399';
    }
    if (meterPercentage < 0.4) return '#34d399';
    if (meterPercentage < 0.7) return '#fbbf24';
    return '#FF375F';
  };

  const gaugeId = title.replace(/\s+/g, '-');

  /* ── Gauge geometry constants (viewBox = 200×120) ────────────
     Centre   = (100, 100)
     Radius   = 75
     Arc goes from 180° to 0° (left to right) — that's the
     half-circle "M 25 100 A 75 75 0 0 1 175 100".

     Tick marks sit on rings at r = 60 (inner end) → r = 75 (outer end)
     for major ticks, and r = 63 → r = 75 for minor ticks.
     This keeps them aligned exactly along the arc rail.
  */
  const GAUGE_CX = 100;
  const GAUGE_CY = 100;
  const TICK_OUTER = 75;         // same as arc radius
  const TICK_INNER_MAJOR = 60;   // long tick
  const TICK_INNER_MINOR = 66;   // short tick
  const TICK_COUNT = 9;          // 0..8 → 9 ticks across 180°

  return (
    <motion.div 
      whileHover="hover"
      initial="initial"
      className="dash-card p-5 flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Subtle violet top highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dash-violet)]/10 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <motion.div className="relative p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.04] group-hover:border-[var(--dash-violet)]/20 transition-colors">
          <motion.div
            variants={{
              initial: { scale: 1, rotate: 0 },
              hover: { scale: 1.05, rotate: [0, -5, 5, 0] }
            }}
            transition={{ duration: 0.4 }}
          >
            <Icon className="w-5 h-5 text-[var(--dash-text-muted)] group-hover:text-[var(--dash-violet)] transition-colors duration-300" />
          </motion.div>
        </motion.div>
      </div>
      
      {showMeter ? (
        <div className="relative w-full flex flex-col items-center mt-2 mb-1" ref={needleRef}>
          <svg viewBox="0 0 200 120" className="w-full max-w-[160px] h-auto overflow-visible">
            <defs>
              <linearGradient id={`gaugeGrad-${gaugeId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={invertMeterColors ? "#FF375F" : "#34d399"} />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor={invertMeterColors ? "#34d399" : "#FF375F"} />
              </linearGradient>

              {/* Neon glow on needle */}
              <filter id={`needleGlow-${gaugeId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur1" />
                <feGaussianBlur stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Glow on the arc itself */}
              <filter id={`arcGlow-${gaugeId}`} x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background arc */}
            <path 
              d="M 25 100 A 75 75 0 0 1 175 100" 
              fill="none" 
              stroke="rgba(255,255,255,0.04)" 
              strokeWidth="14" 
              strokeLinecap="round"
            />

            {/* Colored gauge arc with glow */}
            <path 
              d="M 25 100 A 75 75 0 0 1 175 100" 
              fill="none" 
              stroke={`url(#gaugeGrad-${gaugeId})`}
              strokeWidth="14" 
              strokeLinecap="round"
              opacity="0.9"
              filter={`url(#arcGlow-${gaugeId})`}
            />

            {/* Tick marks — properly aligned to arc geometry */}
            {Array.from({ length: TICK_COUNT }).map((_, index) => {
              const isMajor = index % 2 === 0;
              // Map index 0..8 → angle 180°..0° (left to right, matching arc)
              const angleDeg = 180 - (index / (TICK_COUNT - 1)) * 180;
              const rad = (angleDeg * Math.PI) / 180;
              const innerR = isMajor ? TICK_INNER_MAJOR : TICK_INNER_MINOR;
              const x1 = GAUGE_CX + innerR * Math.cos(rad);
              const y1 = GAUGE_CY - innerR * Math.sin(rad);
              const x2 = GAUGE_CX + TICK_OUTER * Math.cos(rad);
              const y2 = GAUGE_CY - TICK_OUTER * Math.sin(rad);
              return (
                <line 
                  key={index}
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={isMajor ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"} 
                  strokeWidth={isMajor ? "2" : "1"}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Needle with glow */}
            <g transform={`rotate(${needleAngle}, 100, 100)`} filter={`url(#needleGlow-${gaugeId})`}>
              {/* Needle body — tapered */}
              <polygon 
                points="97,100 103,100 100,30" 
                fill={getGaugeColor()}
                opacity="0.9"
              />
              {/* Thin center line for definition */}
              <line 
                x1="100" y1="100" x2="100" y2="32" 
                stroke="white"
                strokeWidth="0.5"
                opacity="0.4"
              />
            </g>

            {/* Center hub — speedometer pin */}
            <circle cx="100" cy="100" r="8" fill="#141416" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle cx="100" cy="100" r="4" fill={getGaugeColor()} />
            <circle cx="100" cy="100" r="2" fill="white" opacity="0.5" />
          </svg>
          
          <div className="mt-3 z-10 text-[var(--dash-text)] text-2xl font-bold tracking-tight">
            <AnimatedNumber value={value} />
          </div>
        </div>
      ) : showHealthBar ? (
        <div className="relative w-full flex flex-col mt-2 mb-1" ref={healthBarRef}>
          <div className="text-[var(--dash-text)] text-2xl font-bold mb-3 tracking-tight">
            <AnimatedNumber value={value} />
          </div>
          
          {/* Health Bar */}
          <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden border border-white/[0.04]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, var(--dash-green) 0%, ${healthPercentage > 0.7 ? 'var(--dash-green)' : healthPercentage > 0.3 ? 'var(--dash-amber)' : 'var(--dash-red)'} 100%)`,
                boxShadow: `0 0 12px ${healthPercentage > 0.7 ? 'rgba(52,211,153,0.4)' : healthPercentage > 0.3 ? 'rgba(251,191,36,0.4)' : 'rgba(255,55,95,0.4)'}`,
              }}
              initial={{ width: 0 }}
              whileInView={{ width: `${healthPercentage * 100}%` }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          
          <div className="text-xs text-[var(--dash-text-muted)] font-medium mt-2 text-center">
            <AnimatedNumber value={healthBarCurrent} /> / {healthBarMax} CR
          </div>
        </div>
      ) : showControls ? (
        <div className="relative w-full flex flex-col items-center mt-2 mb-1">
          <div className="text-[var(--dash-text)] text-[2rem] font-bold mb-4 tracking-tight">
            {value}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onDecrement}
              className="w-10 h-10 rounded-lg bg-white/[0.04] hover:bg-[var(--dash-red)]/10 border border-white/[0.04] hover:border-[var(--dash-red)]/30 flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(255,55,95,0.15)] active:scale-95 group/btn"
            >
              <Minus className="w-4 h-4 text-[var(--dash-text-muted)] group-hover/btn:text-[var(--dash-red)] transition-colors" />
            </button>
            <button
              onClick={onIncrement}
              className="w-10 h-10 rounded-lg bg-white/[0.04] hover:bg-[var(--dash-green)]/10 border border-white/[0.04] hover:border-[var(--dash-green)]/30 flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(52,211,153,0.15)] active:scale-95 group/btn"
            >
              <Plus className="w-4 h-4 text-[var(--dash-text-muted)] group-hover/btn:text-[var(--dash-green)] transition-colors" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[var(--dash-text)] text-[2rem] font-bold mb-1 tracking-tight">
          <AnimatedNumber value={value} />
        </div>
      )}
      
      <div className="text-[var(--dash-text-secondary)] text-sm font-medium mt-2">{title}</div>
    </motion.div>
  );
}