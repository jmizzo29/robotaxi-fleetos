import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { monument } from './monumentTokens';

const STATUS_META = {
  normal: {
    color: '#0F6E4A',
    wash: '#EAF6EF',
    Icon: CheckCircle2,
  },
  recommended: {
    color: '#9A6700',
    wash: '#FFF5D6',
    Icon: Wrench,
  },
  attention: {
    color: '#B42318',
    wash: '#FEEBE9',
    Icon: AlertTriangle,
  },
  growth: {
    color: '#1A5FFF',
    wash: '#EAF0FF',
    Icon: TrendingUp,
  },
  neutral: {
    color: monument.inkGhost,
    wash: '#F4F4F0',
    Icon: Gauge,
  },
};

const ITEM_ICONS = {
  Operations: Gauge,
  Revenue: LineChart,
  Protection: ShieldCheck,
  Growth: TrendingUp,
};

function StatusMark({ state }) {
  const meta = STATUS_META[state] || STATUS_META.neutral;
  const Icon = meta.Icon;

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: meta.wash, color: meta.color }}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </div>
  );
}

function PulseItem({ item }) {
  const meta = STATUS_META[item.tone] || STATUS_META.neutral;
  const Icon = ITEM_ICONS[item.label] || Gauge;

  return (
    <div className="flex items-center gap-3 border-t py-3" style={{ borderColor: monument.hairline }}>
      <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} strokeWidth={2.1} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: monument.inkGhost }}>
          {item.label}
        </p>
        <p className="mt-0.5 truncate text-[13px] leading-snug" style={{ color: monument.inkMuted }}>
          {item.detail}
        </p>
      </div>
      <p className="max-w-[7.5rem] truncate text-right text-[18px] font-semibold leading-none" style={{ color: monument.ink }}>
        {item.value}
      </p>
    </div>
  );
}

export default function FleetStatusCard({ payload }) {
  if (!payload) return null;
  const meta = STATUS_META[payload.state] || STATUS_META.neutral;

  return (
    <section
      className="w-full max-w-[22rem] rounded-lg border px-5 py-5 text-left shadow-[0_18px_45px_rgba(18,20,26,0.08)]"
      style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}
      aria-label="Fleet status"
    >
      <div className="flex items-start gap-4">
        <StatusMark state={payload.state} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta.color }}>
            Fleet Status
          </p>
          <h2 className="mt-2 text-[25px] font-semibold leading-[1.04] tracking-[-0.01em]" style={{ color: monument.ink }}>
            {payload.headline}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: monument.inkMuted }}>
            {payload.detail}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {payload.items.map((item) => (
          <PulseItem key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
