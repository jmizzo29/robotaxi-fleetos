const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

/** Minimal software-product ambience — no vehicle imagery. */
export default function LandingHeroAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 opacity-40" style={gridStyle} />
      <div className="absolute inset-x-0 top-[12%] h-[48%] bg-[radial-gradient(ellipse_85%_55%_at_50%_40%,rgba(139,92,246,0.12),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
