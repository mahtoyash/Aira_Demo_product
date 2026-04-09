import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import type { Co2Reading } from '../hooks/useCo2Data';
import { useI18n } from '../contexts/I18nContext';

interface ChartSectionProps {
  history: Co2Reading[];
}

/* ── Custom Tooltip ─────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, baseline }: any) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;
  const delta = value - baseline;
  const isAbove = delta > 0;

  return (
    <div
      style={{
        backgroundColor: '#18181B',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: '14px',
        color: '#E8E8EC',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.1)',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        minWidth: 160,
      }}
    >
      <div style={{ color: '#5A5A65', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 4 }}>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>Value</span>
        <span style={{ color: '#A855F7', fontWeight: 700, fontSize: 14 }}>{value} ppm</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 6 }}>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>Baseline</span>
        <span style={{ color: '#5A5A65', fontWeight: 600, fontSize: 14 }}>{baseline} ppm</span>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>Delta</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: isAbove ? '#FF375F' : '#34d399',
          }}
        >
          {isAbove ? '+' : ''}{delta} ppm
        </span>
      </div>
    </div>
  );
}

export function ChartSection({ history }: ChartSectionProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [baseline, setBaseline] = useState(500);
  const [baselineInput, setBaselineInput] = useState('500');

  const data = history.slice(-24).map((r, i) => ({
    id: i,
    name: `${r.hour}:${String(r.minute).padStart(2, '0')}`,
    value: Math.round(r.co2),
  }));

  useEffect(() => {
    setIsMounted(true);
    
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleBaselineChange = (val: string) => {
    setBaselineInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 2000) {
      setBaseline(n);
    }
  };

  return (
    <div className="dash-card p-5 xl:p-6 h-full flex flex-col relative overflow-hidden">
      {/* Subtle violet top highlight line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dash-violet)]/12 to-transparent" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-3">
        <div>
          <h2 className="text-[var(--dash-text)] text-base font-semibold flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[var(--dash-violet)] rounded-sm inline-block" />
            {t('co2_history')} ({data.length} {t('readings')})
          </h2>
          <p className="text-[var(--dash-text-muted)] text-xs font-normal mt-0.5">
            {data.length === 0 ? t('waiting_for_data') : t('live_data_from_esp32')}
          </p>
        </div>
        <div className="flex gap-4 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--dash-violet)] shadow-[0_0_8px_var(--chart-glow-primary)]" />
            <span className="text-xs font-medium text-[var(--dash-text)]">{t('actual_ppm')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--dash-text-muted)] border border-dashed border-white/20" />
            <span className="text-xs font-medium text-[var(--dash-text-muted)]">{t('baseline_ppm')}</span>
          </div>
        </div>
      </div>

      {/* Baseline input */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <label className="text-xs text-[var(--dash-text-muted)] font-medium whitespace-nowrap">{t('baseline_preferred')}</label>
        <input
          type="number"
          value={baselineInput}
          onChange={(e) => handleBaselineChange(e.target.value)}
          min={0}
          max={2000}
          className="w-20 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--dash-text)] bg-white/[0.04] border border-white/[0.06] focus:border-[var(--dash-violet)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--dash-violet)]/20 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-[var(--dash-text-muted)]">ppm</span>
        <div className="h-4 w-px bg-white/[0.06] hidden sm:block" />
        <span className="text-[10px] text-[var(--dash-text-muted)] italic hidden sm:inline">{t('above_baseline')}</span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full min-h-[220px] min-w-[200px]" 
        style={{ position: 'relative' }}
      >
        {isMounted && dimensions.width > 0 && dimensions.height > 0 && data.length > 0 && (
          <AreaChart width={dimensions.width} height={dimensions.height} data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {/* Violet-to-blue gradient fill under the line */}
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.2} />
                  <stop offset="30%" stopColor="#A855F7" stopOpacity={0.08} />
                  <stop offset="70%" stopColor="#0A84FF" stopOpacity={0.03} />
                  <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                </linearGradient>

                {/* Violet-to-blue gradient for the line stroke */}
                <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#0A84FF" />
                </linearGradient>

                {/* Neon glow filter for the line itself */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur1" />
                  <feGaussianBlur stdDeviation="8" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Glow filter for active dots */}
                <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} key="grid" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.06)"
                tick={{ fill: '#5A5A65', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                dy={8}
                key="xaxis"
              />
              <YAxis 
                stroke="none"
                tick={{ fill: '#5A5A65', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dx={-5}
                key="yaxis"
              />
              <Tooltip 
                content={<CustomTooltip baseline={baseline} />}
                cursor={{ stroke: 'rgba(168,85,247,0.2)', strokeWidth: 1 }}
                key="tooltip"
              />

              {/* Gradient area fill — glowing under the line */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#chartAreaGradient)"
                animationDuration={1500}
                key="area-fill"
              />

              {/* Main neon glowing line with gradient */}
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="url(#chartLineGradient)" 
                strokeWidth={2.5}
                fill="none"
                dot={{ fill: '#141416', stroke: '#A855F7', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 7, fill: '#A855F7', stroke: '#0B0B0D', strokeWidth: 3, filter: 'url(#dotGlow)' }}
                animationDuration={1500}
                filter="url(#neonGlow)"
                key="line-value"
              />

              {/* Baseline reference */}
              <ReferenceLine
                y={baseline}
                stroke="#5A5A65"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                opacity={0.5}
                key="baseline"
                label={{
                  value: `Baseline ${baseline}`,
                  position: 'insideTopRight',
                  fill: '#5A5A65',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            </AreaChart>
        )}
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--dash-text-muted)] text-sm">
            {t('waiting_for_esp32_data')}
          </div>
        )}
      </div>
    </div>
  );
}