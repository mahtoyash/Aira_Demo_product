import { useOutletContext } from 'react-router';
import { RoomEfficiencyCard } from '../components/RoomEfficiencyCard';
import { RoomSelector } from '../components/RoomSelector';
import { Info, Users, Droplets, Thermometer, Leaf, WifiOff, Plus, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, Cell, LabelList, ZAxis } from 'recharts';
import { useCo2Data, type Co2Reading } from '../hooks/useCo2Data';
import { useEffect, useState, useRef } from 'react';
import { RoomAnalysisSkeleton } from '../components/DashboardSkeleton';
import { useI18n } from '../contexts/I18nContext';

// ─── Aggregate into 30-min buckets ───────────────────────────────────────────
function aggregateTo30Min(readings: Co2Reading[]) {
  if (readings.length === 0) return [];

  const buckets: Record<string, { co2Sum: number; tempSum: number; humSum: number; count: number }> = {};

  for (const r of readings) {
    const slot = r.minute < 30 ? 0 : 30;
    const key = `${r.hour}:${String(slot).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { co2Sum: 0, tempSum: 0, humSum: 0, count: 0 };
    buckets[key].co2Sum  += r.co2;
    buckets[key].tempSum += r.temperature;
    buckets[key].humSum  += r.humidity;
    buckets[key].count++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    })
    .map(([label, b]) => ({
      label,
      co2:         Math.round(b.co2Sum  / b.count),
      temperature: Math.round((b.tempSum / b.count) * 10) / 10,
      humidity:    Math.round((b.humSum  / b.count) * 10) / 10,
    }));
}

// ─── Hexbin Histogram ─────────────────────────────────────────────────────────
const CO2_BINS = [
  { label: '900+',    min: 900, max: Infinity },
  { label: '800-899', min: 800, max: 899 },
  { label: '700-799', min: 700, max: 799 },
  { label: '600-699', min: 600, max: 699 },
  { label: '500-599', min: 500, max: 599 },
  { label: '400-499', min: 400, max: 499 },
  { label: '300-399', min: 300, max: 399 },
];

function buildHexbinData(readings: Co2Reading[]) {
  if (readings.length === 0) return { timeBins: [] as string[], counts: [] as number[][], maxCount: 1 };

  const timeSet = new Set<string>();
  for (const r of readings) {
    const slot = Math.floor(r.minute / 10) * 10;
    timeSet.add(`${r.hour}:${String(slot).padStart(2, '0')}`);
  }
  const timeBins = Array.from(timeSet).sort((a, b) => {
    const [aH, aM] = a.split(':').map(Number);
    const [bH, bM] = b.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  // Pad to min 30 columns
  if (timeBins.length > 0 && timeBins.length < 30) {
    const last = timeBins[timeBins.length - 1];
    const [lh, lm] = last.split(':').map(Number);
    let totalMins = lh * 60 + lm;
    while (timeBins.length < 30) {
      totalMins += 10;
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const key = `${h}:${String(m).padStart(2, '0')}`;
      if (!timeBins.includes(key)) timeBins.push(key);
    }
  }

  const counts: number[][] = CO2_BINS.map(() => new Array(timeBins.length).fill(0));
  for (const r of readings) {
    const slot = Math.floor(r.minute / 10) * 10;
    const timeLabel = `${r.hour}:${String(slot).padStart(2, '0')}`;
    const timeIdx = timeBins.indexOf(timeLabel);
    if (timeIdx === -1) continue;
    for (let ci = 0; ci < CO2_BINS.length; ci++) {
      if (r.co2 >= CO2_BINS[ci].min && r.co2 <= CO2_BINS[ci].max) { counts[ci][timeIdx]++; break; }
    }
  }
  const maxCount = Math.max(1, ...counts.flat());
  return { timeBins, counts, maxCount };
}

// Deep blue → bright cyan color ramp (matching reference hexbin)
function hexIntensityColor(intensity: number): string {
  if (intensity === 0) return 'rgba(255,255,255,0.03)';
  // 0→deep indigo, 0.5→medium blue, 1.0→bright cyan
  const r = Math.round(8   + intensity * (6   - 8));
  const g = Math.round(30  + intensity * (182 - 30));
  const b = Math.round(80  + intensity * (212 - 80));
  return `rgba(${r},${g},${b},${0.25 + intensity * 0.75})`;
}

// Pointy-top hexagon path for SVG
function hexPath(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

// ─── Hexbin Histogram component ───────────────────────────────────────────────
function Histogram2D({ readings }: { readings: Co2Reading[] }) {
  const { t } = useI18n();
  const { timeBins, counts, maxCount } = buildHexbinData(readings);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  if (timeBins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--dash-text-muted)] text-sm">
        {t('no_data_available')}
      </div>
    );
  }

  const COLS = timeBins.length;
  const ROWS = CO2_BINS.length;
  const HEX_SIZE = 14;
  const HEX_W = Math.sqrt(3) * HEX_SIZE; // ~24.25
  const HEX_H = HEX_SIZE * 2;            // 28
  const X_SPACING = HEX_W;
  const Y_SPACING = HEX_H * 0.75;
  const PAD_LEFT = 70;
  const PAD_TOP = 15;
  const PAD_BOTTOM = 35;
  const PAD_RIGHT = 15;

  const svgW = PAD_LEFT + COLS * X_SPACING + HEX_W / 2 + PAD_RIGHT;
  const svgH = PAD_TOP + ROWS * Y_SPACING + HEX_H / 2 + PAD_BOTTOM;

  // Show every Nth X label
  const labelStep = Math.max(1, Math.ceil(COLS / 12));

  return (
    <div className="flex flex-col h-full min-h-[220px] select-none">
      <div className="flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          className="min-w-full"
          style={{ minWidth: Math.max(svgW, 500) }}
        >
          <defs>
            <filter id="hexGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Y-axis labels */}
          {CO2_BINS.map((bin, rowIdx) => {
            const cy = PAD_TOP + rowIdx * Y_SPACING;
            return (
              <text key={bin.label} x={PAD_LEFT - 12} y={cy + 4} textAnchor="end" fill="#6B7280" fontSize="9" fontWeight="500" fontFamily="Inter, sans-serif">
                {bin.label}
              </text>
            );
          })}

          {/* Hexagons */}
          {CO2_BINS.map((_, rowIdx) =>
            timeBins.map((_, colIdx) => {
              const cx = PAD_LEFT + colIdx * X_SPACING + (rowIdx % 2 === 1 ? X_SPACING / 2 : 0);
              const cy = PAD_TOP + rowIdx * Y_SPACING;
              const count = counts[rowIdx][colIdx];
              const intensity = count / maxCount;
              const fill = hexIntensityColor(intensity);
              const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

              return (
                <g key={`${rowIdx}-${colIdx}`}>
                  <path
                    d={hexPath(cx, cy, HEX_SIZE - 0.5)}
                    fill={fill}
                    stroke={count > 0 ? `rgba(6,182,212,${0.1 + intensity * 0.3})` : 'rgba(255,255,255,0.04)'}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    filter={count > 0 && intensity > 0.5 ? 'url(#hexGlow)' : undefined}
                    style={{ cursor: count > 0 ? 'pointer' : 'default', transition: 'fill 0.15s, stroke-width 0.15s' }}
                    onMouseEnter={() => count > 0 && setHoveredCell({ row: rowIdx, col: colIdx })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                  {/* Tooltip on hover */}
                  {isHovered && count > 0 && (
                    <g>
                      <rect x={cx - 50} y={cy - 36} width={100} height={26} rx={6} fill="#111827" stroke="rgba(6,182,212,0.3)" strokeWidth={1} />
                      <text x={cx} y={cy - 19} textAnchor="middle" fill="#E5E7EB" fontSize="8.5" fontWeight="600" fontFamily="Inter, sans-serif">
                        {count} {count === 1 ? t('readings').slice(0,-1) : t('readings')} · {CO2_BINS[rowIdx].label} ppm
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* X-axis labels */}
          {timeBins.map((label, colIdx) => {
            if (colIdx % labelStep !== 0) return null;
            const cx = PAD_LEFT + colIdx * X_SPACING;
            const y = PAD_TOP + ROWS * Y_SPACING + 16;
            return (
              <text key={colIdx} x={cx} y={y} textAnchor="middle" fill="#6B7280" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 justify-end text-[0.65rem] text-[var(--dash-text-muted)] shrink-0">
        <span>{t('low')}</span>
        <div className="flex gap-0.5">
          {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0].map((v, i) => (
            <div key={i} className="w-4 h-3" style={{ backgroundColor: hexIntensityColor(v), borderRadius: 2 }} />
          ))}
        </div>
        <span>{t('high')}</span>
      </div>
    </div>
  );
}


// ─── CO2 Gauge (matching StatCard style) ──────────────────────────────────────
function Co2Gauge({ co2 }: { co2: number }) {
  const [needleAngle, setNeedleAngle] = useState(-90);
  const prevRef = useRef(0);
  const pct = Math.min(Math.max((co2 - 400) / 600, 0), 1);

  useEffect(() => {
    const targetAngle = -90 + pct * 180;
    const startAngle = prevRef.current === 0 ? -90 : needleAngle;
    const duration = 1800;
    const startTime = performance.now();

    const bounceEase = (t: number): number => {
      if (t < 0.6) return (t / 0.6) * 1.08;
      if (t < 0.75) return 1.08 - ((t - 0.6) / 0.15) * 0.12;
      if (t < 0.88) return 0.96 + ((t - 0.75) / 0.13) * 0.06;
      return 1.02 - ((t - 0.88) / 0.12) * 0.02;
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = bounceEase(progress);
      const currentAngle = startAngle + (targetAngle - startAngle) * eased;
      setNeedleAngle(currentAngle);
      if (progress < 1) requestAnimationFrame(animate);
      else setNeedleAngle(targetAngle);
    };

    requestAnimationFrame(animate);
    prevRef.current = pct;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  const getColor = () => {
    if (pct < 0.4) return '#34d399';
    if (pct < 0.7) return '#fbbf24';
    return '#FF375F';
  };

  const CX = 100, CY = 100, OUTER = 75, INNER_MAJ = 60, INNER_MIN = 66, TICKS = 9;

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px] h-auto overflow-visible">
        <defs>
          <linearGradient id="co2GaugeGradRoom" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#FF375F" />
          </linearGradient>
          <filter id="needleGlowRoom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="arcGlowRoom" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" strokeLinecap="round" />

        {/* Colored arc with glow */}
        <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="url(#co2GaugeGradRoom)" strokeWidth="14" strokeLinecap="round" opacity="0.9" filter="url(#arcGlowRoom)" />

        {/* Tick marks */}
        {Array.from({ length: TICKS }).map((_, i) => {
          const isMajor = i % 2 === 0;
          const angleDeg = 180 - (i / (TICKS - 1)) * 180;
          const rad = (angleDeg * Math.PI) / 180;
          const innerR = isMajor ? INNER_MAJ : INNER_MIN;
          return (
            <line
              key={i}
              x1={CX + innerR * Math.cos(rad)}
              y1={CY - innerR * Math.sin(rad)}
              x2={CX + OUTER * Math.cos(rad)}
              y2={CY - OUTER * Math.sin(rad)}
              stroke={isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isMajor ? '2' : '1'}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle with glow */}
        <g transform={`rotate(${needleAngle}, 100, 100)`} filter="url(#needleGlowRoom)">
          <polygon points="97,100 103,100 100,30" fill={getColor()} opacity="0.9" />
          <line x1="100" y1="100" x2="100" y2="32" stroke="white" strokeWidth="0.5" opacity="0.4" />
        </g>

        {/* Center hub */}
        <circle cx="100" cy="100" r="8" fill="#141416" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle cx="100" cy="100" r="4" fill={getColor()} />
        <circle cx="100" cy="100" r="2" fill="white" opacity="0.5" />
      </svg>

      <div className="mt-3 text-[var(--dash-text)] text-2xl font-bold tracking-tight">
        {co2} <span className="text-sm font-normal text-[var(--dash-text-muted)]">ppm</span>
      </div>
    </div>
  );
}


// ─── Main RoomAnalysis page ───────────────────────────────────────────────────
export function RoomAnalysis() {
  const {
    rooms,
    analysisRoom,
    setAnalysisRoom,
    activeEspRoom,
    getRoomConfig,
    updateRoomConfig,
    seedRoomConfig,
    handleAddRoom,
  } = useOutletContext<any>();
  const { t } = useI18n();

  // Fetch data for the ANALYSIS room (independent of Dashboard)
  const { currentRecord, history } = useCo2Data(analysisRoom || undefined);

  const roomKey = analysisRoom || '__default__';
  const config  = getRoomConfig(roomKey);

  // Seed occupancy from DB when record arrives (only if not manually overridden)
  useEffect(() => {
    if (currentRecord && currentRecord.occupancy > 0) {
      seedRoomConfig(roomKey, currentRecord.occupancy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRecord?.occupancy, roomKey]);

  // ── Is the analysis room "LIVE" or "OFFLINE"? ────────────────────────────
  const isLive = analysisRoom === activeEspRoom;
  const isRoomOffline = !isLive && history.length === 0 && currentRecord === null;

  // Show skeleton on initial load
  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    if (currentRecord !== null || (history.length > 0)) {
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [currentRecord, history.length]);

  if (showSkeleton && !isRoomOffline) {
    return <RoomAnalysisSkeleton />;
  }

  // Current data
  const data = {
    co2:         currentRecord?.co2         ?? 0,
    occupancy:   config.occupancy,
    plants:      config.plants,
    humidity:    currentRecord?.humidity    ?? 0,
    temperature: currentRecord?.temperature ?? 0,
    ventilation: 4,
  };

  // 30-min aggregated
  const aggregated = aggregateTo30Min(history);

  const correlationData = aggregated.map(d => ({ metric: d.temperature, co2: d.co2 }));
  const barData         = aggregated.map(d => ({ name: d.label, co2: d.co2 }));

  // ── Plant controls ───────────────────────────────────────────────────────
  const handlePlantsIncrement = () =>
    updateRoomConfig(roomKey, { plants: Math.min(config.plants + 1, 20) });
  const handlePlantsDecrement = () =>
    updateRoomConfig(roomKey, { plants: Math.max(config.plants - 1, 0) });

  // ── Advisory ─────────────────────────────────────────────────────────────
  let advisory   = t('conditions_optimal');
  let alertLevel = 'success';

  if (data.co2 > 750 && data.plants < 4) {
    advisory   = t('high_co2_plants', { co2: data.co2, occ: data.occupancy, plants: data.plants });
    alertLevel = 'danger';
  } else if (data.co2 > 700) {
    advisory   = t('co2_elevated_room', { co2: data.co2 });
    alertLevel = 'warning';
  } else if (data.occupancy > 15 && data.plants < 3) {
    advisory   = t('high_occ_plants', { occ: data.occupancy });
    alertLevel = 'warning';
  }

  const alertColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-violet-500/10  border-violet-500/20  text-violet-400',
    danger:  'bg-red-500/10    border-red-500/20    text-red-400',
  };

  const cardBase = 'dash-card p-4 flex items-center gap-4';
  const panelBase = 'dash-card p-6 flex flex-col min-h-0';

  return (
    <div className="flex flex-col gap-6 h-full pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between shrink-0 gap-3">
        <div className="flex-1 w-full max-w-full min-w-0">
          <h2 className="text-[var(--dash-text)] text-xl md:text-2xl font-semibold tracking-tight gap-2 flex flex-col md:flex-row md:items-center">
            <span className="shrink-0">{t('room_analysis')}</span>
            <div className="w-full sm:w-auto mt-2 md:mt-0">
              <RoomSelector rooms={rooms} selectedRoom={analysisRoom} setSelectedRoom={setAnalysisRoom} handleAddRoom={handleAddRoom} />
            </div>
          </h2>
          <p className="text-[var(--dash-text-muted)] mt-1.5 md:mt-0.5 text-sm font-normal">{t('detailed_breakdown')}</p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {!isLive && (
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 rounded-lg whitespace-nowrap">
              <WifiOff className="w-3.5 h-3.5" />
              {isRoomOffline ? t('room_offline') : t('viewing_historical')}
            </div>
          )}
          <div className="text-[10px] md:text-xs text-[var(--dash-text-secondary)] font-medium dash-card px-3 py-1.5 rounded-lg whitespace-nowrap">
            {isRoomOffline
              ? <span className="text-violet-400 font-bold">{t('room_offline')}</span>
              : <>{t('avg_co2')}: <span className="text-[var(--dash-accent)] font-bold">{data.co2} ppm</span></>
            }
          </div>
        </div>
      </div>

      {/* Not-live info banner */}
      {!isLive && (
        <div className="flex items-start md:items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-violet-300 text-xs md:text-sm">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5 md:mt-0" />
          <span>
            {t('viewing_room_data', { room: analysisRoom || 'Default' })}
            {' '}
            {t('live_sensor_writing', { room: activeEspRoom || 'Default (/readings)' })}
            {isRoomOffline && ' ' + t('no_data_recorded')}
          </span>
        </div>
      )}

      {/* ── Advisory ── */}
      <div className={`p-4 rounded-xl border flex items-start gap-4 ${alertColors[alertLevel as keyof typeof alertColors]}`}>
        <Info className="mt-1 shrink-0 w-5 h-5" />
        <div>
          <h4 className="font-semibold mb-1 text-sm md:text-base">{t('room_advisory')}</h4>
          <p className="text-[var(--dash-text)] text-xs md:text-sm leading-relaxed">{advisory}</p>
        </div>
      </div>

      {/* ── Metric Cards (with plants controls) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-2">

        {/* Occupancy */}
        <div className={cardBase}>
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-[var(--dash-text-muted)] text-xs font-medium mb-1">{t('occupancy')}</p>
            <p className="text-[var(--dash-text)] text-xl font-bold">{data.occupancy} <span className="text-sm font-normal text-[var(--dash-text-muted)]">{t('people')}</span></p>
          </div>
        </div>

        {/* Humidity */}
        <div className={cardBase}>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[var(--dash-text-muted)] text-xs font-medium mb-1">{t('humidity')}</p>
            <p className="text-[var(--dash-text)] text-xl font-bold">{data.humidity}<span className="text-sm font-normal text-[var(--dash-text-muted)]">%</span></p>
          </div>
        </div>

        {/* Temperature */}
        <div className={cardBase}>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <Thermometer className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[var(--dash-text-muted)] text-xs font-medium mb-1">{t('temperature')}</p>
            <p className="text-[var(--dash-text)] text-xl font-bold">{data.temperature}<span className="text-sm font-normal text-[var(--dash-text-muted)]">°C</span></p>
          </div>
        </div>

        {/* Plants — with manual controls */}
        <div className={cardBase}>
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-[var(--dash-text-muted)] text-xs font-medium mb-1">{t('plants')}</p>
            <div className="flex items-center gap-2">
              <p className="text-[var(--dash-text)] text-xl font-bold">{data.plants} <span className="text-sm font-normal text-[var(--dash-text-muted)]">{t('total')}</span></p>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={handlePlantsDecrement}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-90"
                >
                  <Minus className="w-3 h-3 text-[var(--dash-text-muted)] hover:text-red-400" />
                </button>
                <button
                  onClick={handlePlantsIncrement}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 flex items-center justify-center transition-all active:scale-90"
                >
                  <Plus className="w-3 h-3 text-[var(--dash-text-muted)] hover:text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">

        {/* Current Room Status */}
        <div className={panelBase}>
          <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight mb-4 shrink-0">{t('current_room_status')}</h3>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center min-h-[250px]">
            <div className="h-full flex flex-col justify-center relative">
              <h4 className="text-[var(--dash-text-muted)] text-sm font-medium mb-2 text-center">{t('room_efficiency')}</h4>
              <div className="flex-1 h-[200px]">
                <RoomEfficiencyCard co2={data.co2} occupancy={data.occupancy} plants={data.plants} ventilation={data.ventilation} />
              </div>
            </div>

            <div className="h-full flex flex-col justify-center relative bg-white/5 rounded-xl border border-white/5 p-4 mt-6 md:mt-0">
              <h4 className="text-[var(--dash-text-muted)] text-sm font-medium mb-4 text-center">
                {isRoomOffline ? t('room_offline') : t('current_co2_level')}
              </h4>
              {isRoomOffline ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <WifiOff className="w-10 h-10 text-violet-400/60" />
                  <p className="text-violet-400 text-sm font-medium text-center">{t('no_live_data')}</p>
                  <p className="text-[var(--dash-text-muted)] text-xs text-center">{t('switch_to_active')}</p>
                </div>
              ) : (
                <Co2Gauge co2={data.co2} />
              )}
            </div>
          </div>
        </div>

        {/* 2D Histogram */}
        <div className={panelBase}>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight truncate pr-2">{t('co2_hexbin_heatmap')}</h3>
            <span className="text-[0.65rem] md:text-[0.7rem] text-[var(--dash-text-muted)] bg-white/5 px-2 py-1 rounded border border-white/5 whitespace-nowrap">
              {t('co2_range_slot')}
            </span>
          </div>
          <div className="flex-1 min-h-[220px]">
            <Histogram2D readings={history} />
          </div>
        </div>

        {/* Temperature vs CO2 */}
        <div className={panelBase}>
          <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight mb-4 shrink-0">{t('temp_vs_co2')}</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="metric" stroke="#475569" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#334155' }}
                  label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -15, fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={false}
                  label={{ value: 'CO2 (ppm)', angle: -90, position: 'insideLeft', offset: -10, fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(168,85,247,0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#A855F7', fontWeight: 'bold' }} labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                  formatter={(val: number) => [`${val} ppm`, 'Avg CO2']} labelFormatter={(val: number) => `${val}°C`} />
                <Line type="monotone" dataKey="co2" stroke="#A855F7" strokeWidth={3}
                  dot={{ r: 4, fill: '#141416', stroke: '#A855F7', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#A855F7' }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CO2 vs Time Scatter chart */}
        <div className={panelBase}>
          <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight mb-4 shrink-0">{t('co2_vs_time_scatter')}</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" type="category" name="Time" stroke="#475569" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#334155' }}
                  label={{ value: 'Time (30-min slots)', position: 'insideBottom', offset: -15, fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="co2" name="CO2" stroke="#475569" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={false}
                  label={{ value: 'Avg CO2 (ppm)', angle: -90, position: 'insideLeft', offset: -10, fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(168,85,247,0.2)' }}
                  contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(168,85,247,0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#E5E7EB', fontWeight: 'bold' }} labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                />
                <Scatter name="Average CO2" data={barData} animationDuration={1000}>
                  {barData.map((entry, index) => {
                    const color = entry.co2 >= 800 ? '#EF4444' : entry.co2 >= 600 ? '#F97316' : '#22C55E';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                  <LabelList dataKey="co2" position="top" style={{ fill: '#E5E7EB', fontSize: 10, fontWeight: 500 }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}