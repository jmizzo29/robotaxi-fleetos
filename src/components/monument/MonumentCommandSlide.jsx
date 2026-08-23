import FleetMonumentPanel from './FleetMonumentPanel';
import MonumentActionFooter from './MonumentActionFooter';
import { monument, monumentType } from './monumentTokens';

function MonumentHero({ label, amount, subline, labelColor, onTapAmount }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
      <p className={monumentType.label} style={{ color: labelColor || monument.inkGhost }}>{label}</p>
      <button
        type="button"
        onClick={onTapAmount}
        className={`mt-6 ${monumentType.monument}`}
        style={{ color: monument.ink }}
      >
        {amount}
      </button>
      <p className={`mt-5 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{subline}</p>
    </div>
  );
}

export default function MonumentCommandSlide({
  page,
  strip,
  onHeroTap,
  onDoIt,
  onFleetStatusSelect,
}) {
  if (!page) return null;

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas, backgroundImage: monument.canvasWash }}>
      <MonumentHero
        {...page.hero}
        onTapAmount={() => onHeroTap(page.id)}
      />
      {page.showFleetPanel && (
        <FleetMonumentPanel
          strip={strip}
          onSelectStatus={onFleetStatusSelect}
        />
      )}
      <MonumentActionFooter
        line={page.footer.line}
        onDoIt={page.footer.onDoItOverride || (() => onDoIt(page.id))}
        doItLabel={page.footer.doItLabel}
        secondaryLabel={page.footer.secondaryLabel}
        onSecondary={page.footer.onSecondary}
        tertiaryLabel={page.footer.tertiaryLabel}
        onTertiary={page.footer.onTertiary}
      />
    </div>
  );
}
