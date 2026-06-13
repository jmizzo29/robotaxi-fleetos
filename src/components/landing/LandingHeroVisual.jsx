const HERO_IMAGE = '/vehicles/tesla-hero.jpg';

/** Full-bleed hero backdrop — vehicle fills the viewport; copy floats above in LandingScreenFlow. */
export default function LandingHeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-[8%] h-[62%] bg-[radial-gradient(ellipse_85%_60%_at_50%_100%,rgba(139,92,246,0.38),transparent_72%)]" />

      <div className="absolute inset-x-0 bottom-0 top-[22%] sm:top-[26%]">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-[50%_68%] saturate-[0.9] contrast-[1.08] brightness-[0.88]"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Legibility scrim for floating headline */}
      <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-black via-black/75 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />

      {/* Floor fade into page + dashboard peek */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black via-black/90 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-black/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-black/50 to-transparent" />
    </div>
  );
}
