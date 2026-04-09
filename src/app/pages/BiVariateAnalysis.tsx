import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl';
import { Wind, Thermometer, Droplets, Users, Info, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RoomSelector } from '../components/RoomSelector';
import { useOutletContext } from 'react-router';
import { useCo2Data } from '../hooks/useCo2Data';
import { BiVariateSkeleton } from '../components/DashboardSkeleton';
import { useI18n } from '../contexts/I18nContext';

// ── Color system: distinct glow-highlighted colors per room ──────────────────
const ROOM1 = { main: '#06B6D4', glow: 'rgba(6,182,212,0.35)', label: 'text-cyan-400', fillId: 'colorBV1_cyan' };
const ROOM2 = { main: '#F97316', glow: 'rgba(249,115,22,0.35)', label: 'text-orange-400', fillId: 'colorBV2_orange' };

// ── 3D Sphere Sprite Generator ───────────────────────────────────────────────
const getSphereImg = (): string => {
  if (typeof document === 'undefined') return 'circle';
  if ((window as any).__sphereBase64) return (window as any).__sphereBase64;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(24, 24, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Highlight
    grad.addColorStop(0.3, 'rgba(200, 200, 200, 0.9)');  // Mid
    grad.addColorStop(0.8, 'rgba(50, 50, 50, 0.8)');     // Shadow core
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');           // Soft edge to avoid aliasing
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    (window as any).__sphereBase64 = 'image://' + canvas.toDataURL('image/png');
  }
  return (window as any).__sphereBase64 || 'circle';
};

// ── Aggregate into 10-min buckets ────────────────────────────────────────────
function aggregateTo10Min(readings: { co2: number; hour: number; minute: number }[]) {
  if (readings.length === 0) return [];
  const buckets: Record<string, { sum: number; count: number }> = {};
  for (const r of readings) {
    const slot = Math.floor(r.minute / 10) * 10;
    const key = `${r.hour}:${String(slot).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { sum: 0, count: 0 };
    buckets[key].sum += r.co2;
    buckets[key].count++;
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    })
    .map(([label, b]) => ({ label, co2: Math.round(b.sum / b.count) }));
}

// ── Custom tooltip for the CO2 comparison chart ──────────────────────────────
function ComparisonTooltip({ active, payload, label, r1Label, r2Label }: any) {
  if (!active || !payload || payload.length < 2) return null;
  const v1 = payload[0]?.value ?? 0;
  const v2 = payload[1]?.value ?? 0;
  const delta = v1 - v2;
  const higher = delta > 0 ? r1Label : delta < 0 ? r2Label : 'Equal';

  return (
    <div style={{
      backgroundColor: '#111827',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: 200,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ color: '#5A5A65', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: ROOM1.main, fontSize: 12, fontWeight: 600 }}>{r1Label}</span>
        <span style={{ color: '#E5E7EB', fontWeight: 700, fontSize: 14 }}>{v1} ppm</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: ROOM2.main, fontSize: 12, fontWeight: 600 }}>{r2Label}</span>
        <span style={{ color: '#E5E7EB', fontWeight: 700, fontSize: 14 }}>{v2} ppm</span>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#9CA3AF', fontSize: 11 }}>Diff</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: delta === 0 ? '#9CA3AF' : delta > 0 ? ROOM1.main : ROOM2.main }}>
          {Math.abs(delta)} ppm {delta !== 0 ? `(${higher} higher)` : ''}
        </span>
      </div>
      {v1 > 0 && v2 > 0 && (
        <div style={{ marginTop: 4, fontSize: 10, color: '#6B7280' }}>
          {v1 === v2 ? '● Lines intersect at this point' : Math.abs(delta) < 30 ? '● Rooms near parity — overlap zone' : ''}
        </div>
      )}
    </div>
  );
}

export function BiVariateAnalysis() {
  const { rooms, dashboardRoom, getRoomConfig, handleAddRoom } = useOutletContext<any>();
  const { t } = useI18n();

  // ── Both room selectors are fully INDEPENDENT local state ─────────────────
  const [bivarRoom1, setBivarRoom1] = useState<string>(dashboardRoom ?? '');
  const [bivarRoom2, setBivarRoom2] = useState<string>('');
  const [scatterTimeRange, setScatterTimeRange] = useState<number>(0);

  // Init room2 to a different room when list loads
  useEffect(() => {
    if (rooms.length > 1 && !bivarRoom2) {
      const other = rooms.find((r: string) => r !== bivarRoom1);
      if (other) setBivarRoom2(other);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // ── Fetch data for each room independently ────────────────────────────────
  const { currentRecord: r1Rec, history: r1Hist } = useCo2Data(bivarRoom1 || undefined);
  const { currentRecord: r2Rec, history: r2Hist } = useCo2Data(bivarRoom2 || undefined);

  const r1Config = getRoomConfig(bivarRoom1 || '__default__');
  const r2Config = getRoomConfig(bivarRoom2 || '__default__');

  // ── Skeleton while loading ────────────────────────────────────────────────
  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    if (r1Rec !== null || r1Hist.length > 0 || r2Rec !== null || r2Hist.length > 0) {
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      return () => clearTimeout(timer);
    }
  }, [r1Rec, r2Rec, r1Hist.length, r2Hist.length]);

  // ── Stable display labels ──────────────────────────────────────────────────
  const r1Label = bivarRoom1 || 'Default';
  const r2LabelRaw = bivarRoom2 || 'Default';
  const r2Label = r1Label === r2LabelRaw ? `${r2LabelRaw} (2)` : r2LabelRaw;

  // ── Current snapshot values ───────────────────────────────────────────────
  const data1 = {
    co2:         r1Rec?.co2         ?? 0,
    occupancy:   r1Config.occupancy ?? r1Rec?.occupancy ?? 0,
    plants:      r1Config.plants    ?? 0,
    humidity:    r1Rec?.humidity    ?? 0,
    temperature: r1Rec?.temperature ?? 0,
  };

  const data2 = {
    co2:         r2Rec?.co2         ?? 0,
    occupancy:   r2Config.occupancy ?? r2Rec?.occupancy ?? 0,
    plants:      r2Config.plants    ?? 0,
    humidity:    r2Rec?.humidity    ?? 0,
    temperature: r2Rec?.temperature ?? 0,
  };

  // ── Build chart datasets ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // Aggregate each room's history into 10-min buckets
    const r1Agg = aggregateTo10Min(r1Hist);
    const r2Agg = aggregateTo10Min(r2Hist);

    // Merge on time labels (last 30 pts)
    const allLabels = new Set([...r1Agg.map(d => d.label), ...r2Agg.map(d => d.label)]);
    const sortedLabels = Array.from(allLabels).sort((a, b) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    }).slice(-30);

    const r1Map = new Map(r1Agg.map(d => [d.label, d.co2]));
    const r2Map = new Map(r2Agg.map(d => [d.label, d.co2]));

    const timeData = sortedLabels.length > 0
      ? sortedLabels.map(label => ({
          hour: label,
          [r1Label]: r1Map.get(label) ?? 0,
          [r2Label]: r2Map.get(label) ?? 0,
        }))
      : [{ hour: '--:--', [r1Label]: 0, [r2Label]: 0 }];

    // CO2 vs Occupancy (scatter-like — last 10 points)
    const occLen = Math.min(Math.max(r1Hist.length, r2Hist.length), 10);
    const occupancyData = occLen > 0
      ? Array.from({ length: occLen }).map((_, i) => {
          const h1 = r1Hist[r1Hist.length - occLen + i];
          const h2 = r2Hist[r2Hist.length - occLen + i];
          return {
            occupancy: h1?.occupancy ?? h2?.occupancy ?? 0,
            [r1Label]: h1?.co2 ?? 0,
            [r2Label]: h2?.co2 ?? 0,
          };
        })
      : [{ occupancy: 0, [r1Label]: 0, [r2Label]: 0 }];

    // Environmental snapshot comparison (temp + humidity)
    const envData = [
      { period: 'Temperature (°C)', [r1Label]: data1.temperature, [r2Label]: data2.temperature },
      { period: 'Humidity (%)',      [r1Label]: data1.humidity,    [r2Label]: data2.humidity    },
    ];

    // Occupancy & CO2 bar comparison
    const occBarData = [
      { metric: 'Occupancy', [r1Label]: data1.occupancy, [r2Label]: data2.occupancy },
      { metric: 'CO2 (ppm)', [r1Label]: data1.co2,       [r2Label]: data2.co2       },
    ];

    // 3D Scatter data (Occupancy vs Room x Time)
    let r1ScatterSrc = r1Hist;
    let r2ScatterSrc = r2Hist;
    if (scatterTimeRange > 0) {
      r1ScatterSrc = r1Hist.slice(-scatterTimeRange);
      r2ScatterSrc = r2Hist.slice(-scatterTimeRange);
    }
    const buildScatter = (hist: any[], roomName: string) => {
      return hist.map(h => [
        `${h.hour}:${String(h.minute).padStart(2, '0')}`,
        roomName,
        h.occupancy,
        h.co2
      ]);
    };
    const scatter3DRoom1 = buildScatter(r1ScatterSrc, r1Label);
    const scatter3DRoom2 = buildScatter(r2ScatterSrc, r2Label);

    return { timeData, occupancyData, envData, occBarData, scatter3DRoom1, scatter3DRoom2 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r1Label, r2Label, r1Hist, r2Hist, data1.temperature, data1.humidity, data1.occupancy, data1.co2, data2.temperature, data2.humidity, data2.occupancy, data2.co2, scatterTimeRange]);

  // ── Comparison metric cards data ─────────────────────────────────────────
  const comparisonData = [
    { metric: 'Occupancy',   v1: data1.occupancy,   v2: data2.occupancy,   unit: 'people', icon: Users,        color1: ROOM1.main, color2: ROOM2.main },
    { metric: 'Temperature', v1: data1.temperature, v2: data2.temperature, unit: '°C',     icon: Thermometer,  color1: ROOM1.main, color2: ROOM2.main },
    { metric: 'Humidity',    v1: data1.humidity,    v2: data2.humidity,    unit: '%',       icon: Droplets,     color1: ROOM1.main, color2: ROOM2.main },
    { metric: 'CO2',         v1: data1.co2,         v2: data2.co2,         unit: 'ppm',     icon: Wind,         color1: ROOM1.main, color2: ROOM2.main },
  ];

  const tooltipStyle = { backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderRadius: '0.75rem' };
  const panelBase    = 'dash-card p-6';

  const getRoomAdvisory = (data: typeof data1, name: string) => {
    const issues: string[] = [];
    if (data.co2 >= 700)        issues.push(`High CO2 (${data.co2} ppm): Increase ventilation`);
    if (data.temperature > 25)  issues.push(`Warm (${data.temperature}°C): Turn on AC`);
    if (data.temperature < 20)  issues.push(`Cool (${data.temperature}°C): Heating needed`);
    if (data.humidity > 50)     issues.push(`High Humidity (${data.humidity}%): Dehumidify`);
    if (data.humidity < 35)     issues.push(`Low Humidity (${data.humidity}%): Humidify`);

    if (issues.length === 0) return (
      <span className="text-[var(--dash-text)]">All conditions in <strong>{name}</strong> are optimal. No action required.</span>
    );
    return (
      <span className="text-[var(--dash-text)]">
        Actions for <strong>{name}</strong>: <span className="text-[var(--dash-text-muted)]">{issues.join(' • ')}</span>
      </span>
    );
  };

  if (showSkeleton) {
    return <BiVariateSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between shrink-0 flex-wrap gap-4">
        <div>
          <h2 className="text-[var(--dash-text)] text-xl md:text-2xl font-semibold tracking-tight">Bi-Variate Analysis</h2>
          <p className="text-[var(--dash-text-muted)] mt-0.5 text-sm font-normal">Comparing conditions across different zones</p>
        </div>

        {/* Independent room pickers — z-40 so sidebar mobile overlay (z-60) renders above */}
        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-40">
          <div className="flex items-center p-2 gap-1 rounded-xl" style={{
            background: 'rgba(6,182,212,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '0 4px 16px rgba(6,182,212,0.08)',
          }}>
            <span className={`text-sm font-medium mx-2 shrink-0 ${ROOM1.label}`}>Room 1:</span>
            <RoomSelector
              rooms={rooms}
              selectedRoom={bivarRoom1}
              setSelectedRoom={setBivarRoom1}
              handleAddRoom={handleAddRoom}
            />
          </div>
          <div className="flex items-center p-2 gap-1 rounded-xl" style={{
            background: 'rgba(249,115,22,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(249,115,22,0.2)',
            boxShadow: '0 4px 16px rgba(249,115,22,0.08)',
          }}>
            <span className={`text-sm font-medium mx-2 shrink-0 ${ROOM2.label}`}>Room 2:</span>
            <RoomSelector
              rooms={rooms}
              selectedRoom={bivarRoom2}
              setSelectedRoom={setBivarRoom2}
              handleAddRoom={handleAddRoom}
            />
          </div>
        </div>
      </div>

      {/* ── 4 Metric Comparison Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {comparisonData.map(({ metric, v1, v2, unit, icon: Icon, color1, color2 }) => {
          const maxVal = Math.max(v1, v2, 1);
          const w1 = `${(v1 / maxVal) * 100}%`;
          const w2 = `${(v2 / maxVal) * 100}%`;
          return (
            <div key={metric} className={`${panelBase} flex flex-col min-h-0`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <Icon className="w-5 h-5 text-[var(--dash-text)]" />
                </div>
                <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight">{metric} Comparison</h3>
              </div>

              <div className="flex flex-col gap-5 flex-1 justify-center">
                {/* Room 1 bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`${ROOM1.label} font-medium`}>{r1Label}</span>
                    <span className="text-[var(--dash-text)] font-bold">{v1} <span className="text-[var(--dash-text-muted)] font-normal">{unit}</span></span>
                  </div>
                  <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: w1, backgroundColor: color1, boxShadow: `0 0 12px ${ROOM1.glow}` }}
                    />
                  </div>
                </div>

                {/* Room 2 bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`${ROOM2.label} font-medium`}>{r2Label}</span>
                    <span className="text-[var(--dash-text)] font-bold">{v2} <span className="text-[var(--dash-text-muted)] font-normal">{unit}</span></span>
                  </div>
                  <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: w2, backgroundColor: color2, boxShadow: `0 0 12px ${ROOM2.glow}` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="flex flex-col gap-6">

        {/* CO2 over time — Area chart (10-min intervals, distinct colors + glow) */}
        <div className={panelBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight">{t('co2_levels_over_time')}</h3>
            <span className="text-[0.65rem] text-[var(--dash-text-muted)] bg-white/5 px-2 py-1 rounded border border-white/5">{t('10_min_intervals')}</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Cyan glow gradient for Room 1 */}
                  <linearGradient id={ROOM1.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ROOM1.main} stopOpacity={0.35} />
                    <stop offset="50%" stopColor={ROOM1.main} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={ROOM1.main} stopOpacity={0}   />
                  </linearGradient>
                  {/* Orange glow gradient for Room 2 */}
                  <linearGradient id={ROOM2.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ROOM2.main} stopOpacity={0.35} />
                    <stop offset="50%" stopColor={ROOM2.main} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={ROOM2.main} stopOpacity={0}   />
                  </linearGradient>
                  {/* Glow filters */}
                  <filter id="glowCyan" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="glowOrange" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ComparisonTooltip r1Label={r1Label} r2Label={r2Label} />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value: string) => (
                    <span style={{ color: value === r1Label ? ROOM1.main : ROOM2.main, fontWeight: 600 }}>{value}</span>
                  )}
                />
                <Area type="monotone" dataKey={r1Label} stroke={ROOM1.main} strokeWidth={2.5} fillOpacity={1} fill={`url(#${ROOM1.fillId})`}
                  dot={{ r: 3, fill: '#141416', stroke: ROOM1.main, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: ROOM1.main, stroke: '#0B0B0D', strokeWidth: 2, filter: 'url(#glowCyan)' }}
                  filter="url(#glowCyan)"
                />
                <Area type="monotone" dataKey={r2Label} stroke={ROOM2.main} strokeWidth={2.5} fillOpacity={1} fill={`url(#${ROOM2.fillId})`}
                  dot={{ r: 3, fill: '#141416', stroke: ROOM2.main, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: ROOM2.main, stroke: '#0B0B0D', strokeWidth: 2, filter: 'url(#glowOrange)' }}
                  filter="url(#glowOrange)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Overlap legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: ROOM1.main, opacity: 0.3 }} /> {r1Label} fill
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: ROOM2.main, opacity: 0.3 }} /> {r2Label} fill
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <span className="w-2 h-2 rounded-full bg-white/10" /> Overlapping areas show where rooms converge
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CO2 vs Occupancy */}
          <div className={panelBase}>
            <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight mb-4">{t('co2_vs_occupancy')}</h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="occupancy" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false}
                    label={{ value: 'Occupants', position: 'bottom', fill: '#9CA3AF', fontSize: 12, offset: 0 }} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9CA3AF', paddingTop: '15px' }}
                    formatter={(value: string) => (<span style={{ color: value === r1Label ? ROOM1.main : ROOM2.main, fontWeight: 600 }}>{value}</span>)}
                  />
                  <Line type="monotone" dataKey={r1Label} stroke={ROOM1.main} strokeWidth={3}
                    dot={{ r: 4, fill: '#141416', strokeWidth: 2, stroke: ROOM1.main }}
                    activeDot={{ r: 6, fill: ROOM1.main, filter: 'url(#glowCyan)' }}
                  />
                  <Line type="monotone" dataKey={r2Label} stroke={ROOM2.main} strokeWidth={3}
                    dot={{ r: 4, fill: '#141416', strokeWidth: 2, stroke: ROOM2.main }}
                    activeDot={{ r: 6, fill: ROOM2.main, filter: 'url(#glowOrange)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Environmental Comparison (Temp + Humidity) */}
          <div className={panelBase}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight">{t('environmental_comparison')}</h3>
              <div className="text-right text-xs flex flex-col gap-1">
                <span className={`${ROOM1.label} font-medium`}>{r1Label}</span>
                <span className={`${ROOM2.label} font-medium`}>{r2Label}</span>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.envData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                    formatter={(value: string) => (<span style={{ color: value === r1Label ? ROOM1.main : ROOM2.main, fontWeight: 600 }}>{value}</span>)}
                  />
                  <Bar dataKey={r1Label} fill={ROOM1.main} radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey={r2Label} fill={ROOM2.main} radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy & CO2 3D Scatter */}
          <div className={`${panelBase} lg:col-span-2`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-[var(--dash-text)] text-lg font-semibold tracking-tight">{t('multivariate_analysis')}</h3>
              <select 
                value={scatterTimeRange} 
                onChange={(e) => setScatterTimeRange(Number(e.target.value))}
                className="bg-black/20 border border-white/10 text-[var(--dash-text)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--dash-violet)] cursor-pointer"
              >
                <option value={0}>{t('all_available_data')}</option>
                <option value={30}>{t('last_30_readings')}</option>
                <option value={60}>{t('last_60_readings')}</option>
                <option value={120}>{t('last_120_readings')}</option>
              </select>
            </div>
            <div className="h-[400px] w-full bg-[var(--dash-card-solid)] rounded-xl overflow-hidden border border-[var(--dash-card-border)] relative">
              {chartData.scatter3DRoom1.length > 0 || chartData.scatter3DRoom2.length > 0 ? (
                <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/40 border border-[var(--dash-card-border)] rounded-full text-[10px] md:text-xs text-[var(--dash-text-muted)] pointer-events-none backdrop-blur-md">
                  {t('drag_to_rotate')}
                </span>
              ) : null}
              {(chartData.scatter3DRoom1.length > 0 || chartData.scatter3DRoom2.length > 0) && typeof window !== 'undefined' ? (
                <ReactECharts
                  option={{
                    legend: {
                      data: [r1Label, r2Label],
                      textStyle: { color: '#E5E7EB', fontSize: 13 },
                      bottom: 20,
                      left: 20,
                      orient: 'vertical',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: 8,
                      padding: 10,
                      itemWidth: 14,
                      selectedMode: 'single'
                    },
                    tooltip: {
                      formatter: (params: any) => {
                        const [time, roomName, occ, co2] = params.value;
                        return `<div style="font-weight:600;color:var(--dash-text)">${roomName}</div>
                                <div style="color:var(--dash-text-secondary)">Time:</div> <div style="color:var(--dash-text)">${time}</div>
                                <div style="color:var(--dash-text-secondary)">Occupancy:</div> <div style="color:var(--dash-text)">${occ} people</div>
                                <div style="color:var(--dash-text-secondary)">CO2 Level:</div> <div style="color:var(--dash-text)">${co2} ppm</div>`;
                      },
                      backgroundColor: 'var(--dash-bg)',
                      borderColor: 'var(--dash-violet)',
                      padding: 12,
                      textStyle: { color: 'var(--dash-text)', fontSize: 13, fontFamily: 'Inter, sans-serif' }
                    },
                    visualMap: {
                      show: true,
                      min: 400,
                      max: 1000,
                      dimension: 3,
                      inRange: {
                        color: ['#06B6D4', '#22C55E', '#F97316', '#EF4444']
                      },
                      textStyle: { color: '#64748B' },
                      bottom: 20,
                      right: 20,
                      itemWidth: 10,
                      itemHeight: 80,
                      calculable: true,
                      text: ['High CO2', 'Low CO2']
                    },
                    xAxis3D: {
                      type: 'category',
                      name: 'Time',
                      nameTextStyle: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
                      axisLabel: { textStyle: { color: '#9CA3AF' } },
                      axisLine: { lineStyle: { color: '#475569' } },
                      splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    yAxis3D: {
                      type: 'category',
                      data: [r1Label, r2Label],
                      name: 'Room',
                      nameTextStyle: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
                      axisLabel: { textStyle: { color: '#9CA3AF' }, margin: 20 },
                      axisLine: { lineStyle: { color: '#475569' } },
                      splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    zAxis3D: {
                      type: 'value',
                      name: 'Occupancy',
                      nameTextStyle: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
                      axisLabel: { textStyle: { color: '#9CA3AF' } },
                      axisLine: { lineStyle: { color: '#475569' } },
                      splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    grid3D: {
                      viewControl: {
                        autoRotate: true,
                        autoRotateSpeed: 5,
                        autoRotateAfterStill: 3,
                        distance: 250,
                        alpha: 20,
                        beta: 40,
                      },
                      environment: 'transparent',
                      axisPointer: { lineStyle: { color: '#A855F7', width: 2 } },
                      light: {
                        main: { intensity: 1.5, shadow: true },
                        ambient: { intensity: 0.6 }
                      },
                      boxWidth: 100,
                      boxDepth: 60,
                      boxHeight: 60,
                    },
                    series: [
                      {
                        name: r1Label,
                        type: 'scatter3D',
                        data: chartData.scatter3DRoom1,
                        symbol: getSphereImg(),
                        symbolSize: (val: any) => Math.min(Math.max(16, (val[3] || 400) / 20), 40),
                        itemStyle: { opacity: 0.95 },
                        emphasis: { itemStyle: { opacity: 1, borderColor: '#FFF', borderWidth: 2 } }
                      },
                      {
                        name: r2Label,
                        type: 'scatter3D',
                        data: chartData.scatter3DRoom2,
                        symbol: getSphereImg(),
                        symbolSize: (val: any) => Math.min(Math.max(16, (val[3] || 400) / 20), 40),
                        itemStyle: { opacity: 0.95 },
                        emphasis: { itemStyle: { opacity: 1, borderColor: '#FFF', borderWidth: 2 } }
                      }
                    ]
                  }}
                  style={{ height: '100%', width: '100%' }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-[var(--dash-text-secondary)] text-sm">
                  Waiting for synchronized room data...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Room Advisories ── */}
      <div className="dash-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <Info className="w-5 h-5 text-[var(--dash-text)]" />
          </div>
          <h3 className="text-[var(--dash-text)] text-xl font-bold tracking-tight">Room Advisories</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-black/20 p-5 rounded-xl border border-white/5 relative">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: ROOM1.main }} />
            <h4 className={`${ROOM1.label} font-semibold mb-2 flex items-center gap-2`}>
              Room 1 ({r1Label}) <ArrowRight className="w-4 h-4" />
            </h4>
            <p className="text-[var(--dash-text-muted)] leading-relaxed text-sm">{getRoomAdvisory(data1, r1Label)}</p>
          </div>

          <div className="bg-black/20 p-5 rounded-xl border border-white/5 relative">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: ROOM2.main }} />
            <h4 className={`${ROOM2.label} font-semibold mb-2 flex items-center gap-2`}>
              Room 2 ({r2Label}) <ArrowRight className="w-4 h-4" />
            </h4>
            <p className="text-[var(--dash-text-muted)] leading-relaxed text-sm">{getRoomAdvisory(data2, r2Label)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}