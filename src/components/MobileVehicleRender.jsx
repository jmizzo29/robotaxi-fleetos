export default function MobileVehicleRender({ className = '' }) {
  return (
    <svg viewBox="0 0 360 190" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="mobileBody" x1="72" x2="286" y1="42" y2="152" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.42" stopColor="#dce6f2" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="mobileGlass" x1="128" x2="235" y1="28" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.46" stopColor="#256d92" />
          <stop offset="1" stopColor="#06111d" />
        </linearGradient>
        <radialGradient id="mobileGlow" cx="50%" cy="48%" r="50%">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="mobileShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <ellipse cx="180" cy="158" rx="134" ry="24" fill="#020617" opacity="0.5" />
      <ellipse cx="180" cy="90" rx="170" ry="88" fill="url(#mobileGlow)" />

      <g filter="url(#mobileShadow)">
        <path
          d="M63 123c8-27 28-48 60-63l34-16c16-8 34-12 54-12 23 0 42 5 57 15l23 16c22 15 36 35 42 60l4 16H58l5-16Z"
          fill="url(#mobileBody)"
        />
        <path
          d="M92 121c13-33 43-54 90-64 43 8 72 29 87 64H92Z"
          fill="#f8fafc"
          opacity="0.48"
        />
        <path
          d="M136 63c13-14 29-21 49-21 25 0 45 7 59 21l18 33H114l22-33Z"
          fill="url(#mobileGlass)"
        />
        <path d="M185 44v51" stroke="#dbeafe" strokeWidth="3" opacity="0.35" />
        <path d="M118 125h126c28 0 51 6 70 18H46c18-12 42-18 72-18Z" fill="#d7e0ec" />
        <path d="M63 137h235" stroke="#334155" strokeWidth="5" strokeLinecap="round" opacity="0.42" />
        <path d="M51 128h39" stroke="#bae6fd" strokeWidth="7" strokeLinecap="round" />
        <path d="M276 128h38" stroke="#fb7185" strokeWidth="7" strokeLinecap="round" />

        {[105, 254].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="142" r="25" fill="#020617" />
            <circle cx={cx} cy="142" r="16" fill="#111827" stroke="#64748b" strokeWidth="3" />
            <circle cx={cx} cy="142" r="6" fill="#e2e8f0" />
          </g>
        ))}
      </g>
    </svg>
  );
}
