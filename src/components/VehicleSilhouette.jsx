export default function VehicleSilhouette({ className = '' }) {
  return (
    <svg
      viewBox="0 0 420 190"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="vehicleBody" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="vehicleGlass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <filter id="vehicleShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#vehicleShadow)">
        <path
          d="M52 118c10-35 35-59 76-70 36-10 86-15 150-14 31 1 54 10 68 28l31 40c9 12 12 26 8 43H39c0-10 4-19 13-27Z"
          fill="url(#vehicleBody)"
        />
        <path
          d="M145 54c32-7 78-10 138-9 19 1 35 8 47 22l24 31H120c4-21 12-36 25-44Z"
          fill="url(#vehicleGlass)"
        />
        <path d="M246 46v52" stroke="#94a3b8" strokeWidth="3" opacity="0.55" />
        <path
          d="M79 122h273"
          stroke="#f8fafc"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="112" cy="145" r="24" fill="#020617" />
        <circle cx="112" cy="145" r="10" fill="#94a3b8" />
        <circle cx="321" cy="145" r="24" fill="#020617" />
        <circle cx="321" cy="145" r="10" fill="#94a3b8" />
        <path d="M370 113h22" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
        <path d="M48 126h24" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}
