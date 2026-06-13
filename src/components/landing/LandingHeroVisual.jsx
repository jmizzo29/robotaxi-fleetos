const HERO_IMAGE = '/vehicles/tesla-hero.jpg';

export default function LandingHeroVisual() {
  return (
    <div className="relative mx-auto mt-5 w-full max-w-2xl">
      <div
        className="pointer-events-none absolute -inset-x-6 bottom-0 top-[35%] -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(139,92,246,0.42),transparent_68%)]"
        aria-hidden="true"
      />
      <div className="relative h-[min(50vh,26rem)] w-full overflow-hidden sm:h-[min(52vh,28rem)]">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full scale-[1.03] object-cover object-[50%_58%] saturate-[0.92] contrast-[1.06]"
          loading="eager"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black/10 to-black/80"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black via-black/90 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
