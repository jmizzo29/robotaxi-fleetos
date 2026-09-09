import FleetMonumentPanel from './FleetMonumentPanel';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import { monument } from './monumentTokens';

export default function MonumentCommandSlide({
  page,
  strip,
  onHeroTap,
  onDoIt,
  onFleetStatusSelect,
}) {
  if (!page) return null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: monument.canvas, backgroundImage: monument.canvasWash }}>
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
