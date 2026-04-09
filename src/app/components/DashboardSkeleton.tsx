import { motion } from 'motion/react';

/* ── Shimmer animated block ──────────────────────────────────────────── */
function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl bg-white/[0.04] overflow-hidden relative ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.06) 40%, rgba(168,85,247,0.10) 50%, rgba(168,85,247,0.06) 60%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ── Dashboard (Home) skeleton ───────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 xl:gap-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-32" />
        </div>
        <Bone className="h-8 w-36 rounded-lg" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dash-card p-5 flex flex-col gap-3">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="h-8 w-20" />
            <Bone className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Chart + sidebar area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-3 flex flex-col gap-4 md:gap-6">
          <div className="dash-card p-5 h-[380px] flex flex-col gap-4">
            <div className="flex justify-between">
              <Bone className="h-5 w-44" />
              <Bone className="h-5 w-32" />
            </div>
            <Bone className="flex-1 rounded-lg" />
          </div>
          <div className="dash-card p-5 h-[200px] flex flex-col gap-3">
            <Bone className="h-5 w-28" />
            <div className="flex flex-col gap-2 flex-1">
              <Bone className="h-14 w-full" />
              <Bone className="h-14 w-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="dash-card p-5 h-[380px] flex flex-col items-center gap-4">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="h-36 w-36 rounded-full" />
            <Bone className="h-6 w-16" />
            <Bone className="h-4 w-28" />
          </div>
          <div className="dash-card p-5 h-[200px] flex flex-col gap-3">
            <Bone className="h-5 w-28" />
            <Bone className="h-20 w-full rounded-lg" />
            <div className="flex flex-col gap-2">
              <Bone className="h-10 w-full rounded-lg" />
              <Bone className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Room Analysis skeleton ──────────────────────────────────────────── */
export function RoomAnalysisSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-44" />
          <Bone className="h-4 w-36" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-8 w-40 rounded-lg" />
          <Bone className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Advisory */}
      <Bone className="h-20 w-full rounded-xl" />

      {/* 4 Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-card p-4 flex items-center gap-4">
            <Bone className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Bone className="h-3 w-16" />
              <Bone className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-card p-6 flex flex-col gap-4 min-h-[280px]">
            <Bone className="h-5 w-40" />
            <Bone className="flex-1 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bi-Variate Analysis skeleton ────────────────────────────────────── */
export function BiVariateSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header + room pickers */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-52" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-44 rounded-xl" />
          <Bone className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* 4 comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Bone className="w-10 h-10 rounded-xl" />
              <Bone className="h-5 w-40" />
            </div>
            <div className="flex flex-col gap-4">
              <Bone className="h-6 w-full rounded-full" />
              <Bone className="h-6 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* CO2 over time chart */}
      <div className="dash-card p-6 flex flex-col gap-4">
        <Bone className="h-5 w-44" />
        <Bone className="h-[280px] rounded-lg" />
      </div>

      {/* 2 smaller charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dash-card p-6 flex flex-col gap-4">
          <Bone className="h-5 w-36" />
          <Bone className="h-[240px] rounded-lg" />
        </div>
        <div className="dash-card p-6 flex flex-col gap-4">
          <Bone className="h-5 w-48" />
          <Bone className="h-[240px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Settings skeleton ───────────────────────────────────────────────── */
export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-2">
        <Bone className="h-7 w-28" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="dash-card p-8 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Bone className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
        <Bone className="h-px w-full" />
        <div className="flex flex-col gap-4">
          <Bone className="h-5 w-28" />
          <div className="grid grid-cols-2 gap-4">
            <Bone className="h-40 rounded-2xl" />
            <Bone className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
