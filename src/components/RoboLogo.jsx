export default function RoboLogo({ className = 'h-12 w-12', title = 'ROBOAGENT' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id="robo-logo-fill" x1="22" x2="100" y1="18" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="0.48" stopColor="#263142" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <clipPath id="robo-logo-clip">
          <path d="M28 31h46c20 0 34 12 34 30 0 15-9 26-24 30l22 26H80L59 90H50v27H26V68h24v4h23c8 0 13-4 13-11 0-8-6-12-15-12H41C33 49 29 43 28 31Z" />
          <path d="M24 50c8 10 18 15 31 15h17c4 0 6-2 6-5s-2-5-6-5H37c-7 0-12-2-16-7 0 13 7 24 20 31l38 38h29L62 70c-17-1-29-8-38-20Z" />
        </clipPath>
      </defs>

      <path
        fill="url(#robo-logo-fill)"
        d="M28 31h46c20 0 34 12 34 30 0 15-9 26-24 30l22 26H80L59 90H50v27H26V68h24v4h23c8 0 13-4 13-11 0-8-6-12-15-12H41C33 49 29 43 28 31Z"
      />
      <path
        fill="url(#robo-logo-fill)"
        d="M24 50c8 10 18 15 31 15h17c4 0 6-2 6-5s-2-5-6-5H37c-7 0-12-2-16-7 0 13 7 24 20 31l38 38h29L62 70c-17-1-29-8-38-20Z"
      />

      <g clipPath="url(#robo-logo-clip)" opacity="0.7">
        <path d="M18 38h45m8 0h20M35 47h26l7 7h34M29 59h25m12 0h24M31 73h18l12 12h36M38 87h17l28 28M43 100h13" stroke="#cbd5e1" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M54 28v20m14-17v14m17 7v30m-42 22V78m31 10v17" stroke="#94a3b8" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M43 47h4m18-9h4m23 16h4m-48 32h4m33 18h4m-48-2h4" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="69" cy="54" r="3.5" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
        <circle cx="51" cy="86" r="2.5" fill="#cbd5e1" />
        <circle cx="84" cy="88" r="2.2" fill="#94a3b8" />
      </g>
    </svg>
  );
}
