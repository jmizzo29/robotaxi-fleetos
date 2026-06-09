import RoboLogo from './RoboLogo';
import {
  TrendingUp,
  Car,
  Sparkles,
  Gauge,
  MapPin,
} from 'lucide-react';

function GlowDot({ left, top, tone = 'ready', delay = '0s' }) {
  const color = tone === 'ready' ? '#10b981' : '#f59e0b';
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-60"
        style={{ backgroundColor: color, animationDelay: delay }}
      />
      <span
        className="relative block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 12px 4px ${color}99` }}
      />
    </span>
  );
}

function DarkKpi({ label, value, sub, Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
      <div className="flex items-center gap-1.5 text-white/45">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-status-ready">{sub}</p>
    </div>
  );
}

export default function DashboardPreview() {
  const dots = [
    { left: '22%', top: '34%', tone: 'ready', delay: '0s' },
    { left: '54%', top: '52%', tone: 'ready', delay: '0.6s' },
    { left: '74%', top: '30%', tone: 'caution', delay: '1.1s' },
    { left: '40%', top: '72%', tone: 'ready', delay: '0.3s' },
  ];

  const gridStyle = {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
  };

  const donutStyle = {
    background: 'conic-gradient(#10b981 0% 82%, rgba(255,255,255,0.08) 82% 100%)',
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-status-ready/10 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-ink/40">
        {/* Window header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-[#161d2b] to-[#0d1117] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <RoboLogo className="h-7 w-7" />
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">Fleet Command</p>
              <p className="text-[10px] text-white/40">Live telemetry · 3 vehicles</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ready/30 bg-status-ready/10 px-2.5 py-1 text-[11px] font-medium text-status-ready">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ready opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-ready" />
            </span>
            Live
          </span>
        </div>

        {/* Body: map + KPIs */}
        <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[1.5fr_1fr]">
          {/* Glowing dark map */}
          <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0e16] sm:min-h-[240px]">
            <div className="absolute inset-0" style={gridStyle} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-ready/15 blur-3xl" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M22 34 Q40 46 54 52 T74 30"
                fill="none"
                stroke="rgba(16,185,129,0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {dots.map((dot) => (
              <GlowDot key={`${dot.left}-${dot.top}`} {...dot} />
            ))}
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm">
              <MapPin className="h-3 w-3 text-status-ready" />
              Orlando · Tampa metro
            </div>
          </div>

          {/* KPI column */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <DarkKpi label="Earnings" value="$12,480" sub="+18% week" Icon={TrendingUp} />
              <DarkKpi label="Active" value="3 / 3" sub="all ready" Icon={Car} />
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="relative h-[72px] w-[72px] shrink-0 rounded-full" style={donutStyle}>
                <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-[#0d1117]">
                  <span className="text-base font-semibold leading-none text-white">82%</span>
                  <span className="mt-0.5 text-[9px] text-white/40">ready</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-white/45">
                  <Gauge className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em]">Utilization</span>
                </div>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">82%</p>
                <p className="text-[11px] font-medium text-status-ready">+6% vs last week</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI recommendation strip */}
        <div className="flex items-center gap-3 border-t border-white/10 bg-status-ready/[0.06] px-4 py-3 sm:px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-ready/15 text-status-ready">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-status-ready">AI agent recommendation</p>
            <p className="truncate text-sm text-white/85">Charge Fleet 2 &amp; 3 to 87% at 2:15 AM — save $9 tonight.</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-status-ready px-4 py-2 text-sm font-semibold text-[#0d1117] transition hover:brightness-110"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
