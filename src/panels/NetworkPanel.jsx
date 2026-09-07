import { ClipboardList } from 'lucide-react';
import { AppCard, AppHeader, AppSection, AppShell } from '../components/shell';
import useNetworkEvents from '../hooks/useNetworkEvents';
import { typography, spacing } from '../design/roboagentTokens';

export default function NetworkPanel() {
  const live = useNetworkEvents();

  return (
    <AppShell>
      <AppHeader badge="Network" />
      <AppSection title="Public events" tier="secondary" className="!mt-0">
        {live.loading ? (
          <AppCard>
            <p className={typography.cardTitle}>Loading public events…</p>
          </AppCard>
        ) : !live.configured ? (
          <AppCard data-testid="network-empty">
            <p className={typography.cardTitle}>No event feed configured</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This tab does not invent concerts, stadium lifts, or demand scores.
              {live.setupNote ? ` ${live.setupNote}` : ''}
            </p>
          </AppCard>
        ) : live.events.length === 0 ? (
          <AppCard data-testid="network-empty">
            <p className={typography.cardTitle}>No upcoming public events</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {live.disclaimer}
              {live.asOf ? ` As of ${live.asOf}.` : ''}
            </p>
          </AppCard>
        ) : (
          <ul className={spacing.stackSm} data-testid="network-events">
            {live.events.map((event) => (
              <li key={event.id}>
                <AppCard variant="subdued" className="px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{event.city}</p>
                  <p className={`mt-1 ${typography.cardTitle}`}>{event.title}</p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {[event.startLabel, event.venue, event.category].filter(Boolean).join(' · ')}
                  </p>
                </AppCard>
              </li>
            ))}
          </ul>
        )}
      </AppSection>
      <AppSection title="Honesty" tier="tertiary">
        <AppCard variant="alert">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <p className={typography.sectionSm}>Not live robotaxi operations</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {live.disclaimer}
            {live.source ? ` Source: ${live.source}.` : ''}
          </p>
        </AppCard>
      </AppSection>
    </AppShell>
  );
}
