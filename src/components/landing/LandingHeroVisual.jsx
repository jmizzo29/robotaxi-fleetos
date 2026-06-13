const HERO_IMAGE = '/vehicles/tesla-hero.jpg';

/** Vehicle layer — sits below headline/CTA; dark silhouette, not behind copy. */
export default function LandingHeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] overflow-hidden sm:top-[36%]" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-[6%] h-[55%] bg-[radial-gradient(ellipse_80%_55%_at_50%_100%,rgba(139,92,246,0.22),transparent_70%)]" />

      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[50%_72%] saturate-[0.55] contrast-[1.12] brightness-[0.58]"
        loading="eager"
        decoding="async"
      />

      {/* Silhouette treatment — crush brightness, preserve edge highlights */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black via-black/95 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black to-transparent" />
    </div>
  );
}
