import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { TrendingUp, Clock } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { useI18n } from '../contexts/I18nContext';

interface PredictionCardProps {
  currentValue: number;
  predict10: number | null;
  predict30: number | null;
  predict60: number | null;
  maxMeterValue?: number;
}

export function PredictionCard({ 
  currentValue,
  predict10,
  predict30,
  predict60,
  maxMeterValue = 1000 
}: PredictionCardProps) {
  const { t } = useI18n();
  const p10 = predict10 ?? currentValue;
  const p30 = predict30 ?? currentValue;
  const p60 = predict60 ?? currentValue;
  const isLoading = predict10 === null;

  // Selected time horizon — default +10 min
  const [selectedTime, setSelectedTime] = useState<10 | 30 | 60>(10);

  const displayValue = selectedTime === 10 ? p10 : selectedTime === 30 ? p30 : p60;
  const meterPercentage = Math.min(Math.max(displayValue / maxMeterValue, 0), 1);

  const needleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(needleRef, { once: false, amount: 0.5 });
  const [needleAngle, setNeedleAngle] = useState(-90);
  const prevAngleRef = useRef(-90);

  // Animate needle when selectedTime or values change
  useEffect(() => {
    if (isInView) {
      const targetAngle = -90 + (meterPercentage * 180);
      const startAngle = prevAngleRef.current;
      const duration = 1200;
      const startTime = performance.now();

      const bounceEase = (t: number): number => {
        if (t < 0.6) return (t / 0.6) * 1.06;
        if (t < 0.78) return 1.06 - ((t - 0.6) / 0.18) * 0.10;
        if (t < 0.90) return 0.96 + ((t - 0.78) / 0.12) * 0.05;
        return 1.01 - ((t - 0.90) / 0.10) * 0.01;
      };

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = bounceEase(progress);
        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        setNeedleAngle(currentAngle);
        if (progress < 1) requestAnimationFrame(animate);
        else {
          setNeedleAngle(targetAngle);
          prevAngleRef.current = targetAngle;
        }
      };

      requestAnimationFrame(animate);
    } else {
      setNeedleAngle(-90);
      prevAngleRef.current = -90;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, meterPercentage, selectedTime]);

  // Color based on value
  const getColor = () => {
    if (displayValue < 600) return '#34d399';
    if (displayValue < 800) return '#fbbf24';
    return '#FF375F';
  };

  const CX = 100, CY = 100, OUTER = 75, INNER_MAJ = 62, INNER_MIN = 68;
  const timeOptions = [10, 30, 60] as const;
  const timeColors = { 10: 'var(--dash-green)', 30: 'var(--dash-violet)', 60: 'var(--dash-pink)' };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-card p-5 flex flex-col h-full relative overflow-hidden group"
    >
      {/* Top highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dash-violet)]/10 to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[var(--dash-violet)]/10 rounded-xl border border-[var(--dash-violet)]/15">
            <TrendingUp className="w-4 h-4 text-[var(--dash-violet)]" />
          </div>
          <div>
            <h3 className="text-[var(--dash-text)] font-semibold text-sm tracking-tight">{t('co2_forecast')}</h3>
            <p className="text-[var(--dash-text-muted)] text-[10px] font-medium">{t('predictive_ai')}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 flex-1" ref={needleRef}>
        {/* Gauge */}
        <div className="relative w-full flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-full max-w-[140px] h-auto overflow-visible">
            <defs>
              <linearGradient id="predictGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#FF375F" />
              </linearGradient>
              <filter id="predNeedleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur1" />
                <feGaussianBlur stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="predArcGlow" x="-10%" y="-10%" width="120%" height="120%">
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
              strokeWidth="12" 
              strokeLinecap="round"
            />

            {/* Full colored arc with gradient + glow */}
            <path 
              d="M 25 100 A 75 75 0 0 1 175 100" 
              fill="none" 
              stroke="url(#predictGaugeGrad)"
              strokeWidth="12" 
              strokeLinecap="round"
              opacity="0.85"
              filter="url(#predArcGlow)"
            />

            {/* Aligned tick marks */}
            {Array.from({ length: 9 }).map((_, i) => {
              const isMaj = i % 2 === 0;
              const deg = 180 - (i / 8) * 180;
              const rad = (deg * Math.PI) / 180;
              const ir = isMaj ? INNER_MAJ : INNER_MIN;
              return (
                <line key={i}
                  x1={CX + ir * Math.cos(rad)} y1={CY - ir * Math.sin(rad)}
                  x2={CX + OUTER * Math.cos(rad)} y2={CY - OUTER * Math.sin(rad)}
                  stroke={isMaj ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isMaj ? "1.5" : "1"} strokeLinecap="round"
                />
              );
            })}

            {/* Tapered needle with glow */}
            <g transform={`rotate(${needleAngle}, 100, 100)`} filter="url(#predNeedleGlow)">
              <polygon 
                points="97,100 103,100 100,32" 
                fill={getColor()}
                opacity="0.9"
              />
              <line x1="100" y1="100" x2="100" y2="34" stroke="white" strokeWidth="0.5" opacity="0.3" />
            </g>

            {/* Center hub */}
            <circle cx="100" cy="100" r="6" fill="#141416" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="3" fill={getColor()} />
            <circle cx="100" cy="100" r="1.5" fill="white" opacity="0.4" />
          </svg>

          {/* Value below gauge */}
          <div className="mt-1 flex flex-col items-center min-h-[48px] justify-center">
            {isLoading ? (
              <div className="h-7 w-20 bg-white/[0.04] rounded-lg animate-pulse mb-1" />
            ) : (
              <span className="text-[var(--dash-text)] text-xl font-bold tracking-tight">
                <AnimatedNumber value={String(displayValue)} />
                <span className="text-xs font-medium text-[var(--dash-text-muted)] ml-1">ppm</span>
              </span>
            )}
            <span className="text-[10px] font-semibold" style={{ color: timeColors[selectedTime] }}>
              {isLoading ? t('loading_model') : `+${selectedTime}m ${t('forecast')}`}
            </span>
          </div>
        </div>

        {/* Time selection buttons */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {timeOptions.map((tt) => {
            const val = tt === 10 ? p10 : tt === 30 ? p30 : p60;
            const isActive = selectedTime === tt;
            const color = timeColors[tt];
            return (
              <button
                key={tt}
                onClick={() => setSelectedTime(tt)}
                className={`rounded-lg p-2.5 flex items-center justify-between transition-all duration-300 border text-sm cursor-pointer ${
                  isActive 
                    ? 'border-white/[0.1] shadow-[0_0_16px_-4px] scale-[1.02]' 
                    : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                }`}
                style={isActive ? { 
                  backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                  boxShadow: `0 0 16px -4px ${color}`,
                } : {}} 
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 transition-colors" style={{ color: isActive ? color : 'var(--dash-text-muted)' }} />
                  <span className="text-[var(--dash-text)] text-xs font-medium">+{tt} {t('mins')}</span>
                </div>
                {isLoading ? (
                  <div className="h-4 w-12 bg-white/[0.04] rounded animate-pulse" />
                ) : (
                  <div className="font-bold text-sm" style={{ color: isActive ? color : 'var(--dash-text-secondary)' }}>
                    {val} <span className="text-[10px] text-[var(--dash-text-muted)] font-normal">ppm</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}