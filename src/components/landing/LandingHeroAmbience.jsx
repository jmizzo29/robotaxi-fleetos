/** Full-bleed night photograph. Type sits on this. */
export default function LandingHeroAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/landing/night-command.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,11,0.55)_0%,rgba(8,9,11,0.18)_38%,rgba(8,9,11,0.42)_62%,rgba(8,9,11,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_78%,transparent_20%,rgba(8,9,11,0.45)_100%)]" />
    </div>
  );
}
