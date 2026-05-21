export default function VehicleSilhouette({ className = '' }) {
  return (
    <svg viewBox="0 0 640 280" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="paintTop" x1="120" x2="520" y1="70" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.38" stopColor="#dbe4ef" />
          <stop offset="0.72" stopColor="#8b98a9" />
          <stop offset="1" stopColor="#445164" />
        </linearGradient>
        <linearGradient id="paintSide" x1="90" x2="550" y1="130" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eef3f8" />
          <stop offset="0.42" stopColor="#aeb9c8" />
          <stop offset="1" stopColor="#293445" />
        </linearGradient>
        <linearGradient id="glass" x1="185" x2="438" y1="66" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8bd8ff" stopOpacity="0.72" />
          <stop offset="0.36" stopColor="#1f3a55" />
          <stop offset="1" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="softReflection" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tire" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="0.28" stopColor="#182234" />
          <stop offset="0.78" stopColor="#050812" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <filter id="drop" x="-12%" y="-18%" width="124%" height="150%">
          <feDropShadow dx="0" dy="24" stdDeviation="18" floodColor="#000000" floodOpacity="0.38" />
        </filter>
        <filter id="lampGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="paintClip">
          <path d="M68 167c16-28 42-45 78-52l48-10c34-31 85-47 151-47 47 0 84 10 111 30 19 14 39 33 61 57l51 14c22 6 37 19 45 41l8 24H36c3-24 13-43 32-57Z" />
        </clipPath>
      </defs>

      <style>
        {`
          .body-sheen {
            animation: bodySheen 7s ease-in-out infinite;
          }

          @keyframes bodySheen {
            0%, 32% { transform: translateX(-360px) skewX(-14deg); opacity: 0; }
            45% { opacity: 0.42; }
            62% { transform: translateX(420px) skewX(-14deg); opacity: 0; }
            100% { transform: translateX(420px) skewX(-14deg); opacity: 0; }
          }
        `}
      </style>

      <ellipse cx="320" cy="231" rx="250" ry="24" fill="#020617" opacity="0.38" />

      <g filter="url(#drop)">
        <path
          d="M68 167c16-28 42-45 78-52l48-10c34-31 85-47 151-47 47 0 84 10 111 30 19 14 39 33 61 57l51 14c22 6 37 19 45 41l8 24H36c3-24 13-43 32-57Z"
          fill="url(#paintTop)"
        />

        <path
          d="M61 172c53-19 118-29 195-30h206c64 0 108 25 131 74l4 8H37c4-23 12-40 24-52Z"
          fill="url(#paintSide)"
        />

        <g clipPath="url(#paintClip)">
          <rect className="body-sheen" x="160" y="56" width="62" height="178" fill="url(#softReflection)" />
          <path
            d="M72 181c96-17 198-25 307-23 78 1 145 10 201 26"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.32"
          />
        </g>

        <path
          d="M208 102c30-24 77-36 141-36 43 0 76 8 98 24 16 12 32 28 48 48H164c11-14 26-26 44-36Z"
          fill="url(#glass)"
        />
        <path d="M323 70v66" stroke="#64748b" strokeWidth="3" opacity="0.58" />
        <path d="M447 92l39 45" stroke="#64748b" strokeWidth="3" opacity="0.5" />

        <path
          d="M194 104c35-22 84-33 148-33"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.38"
        />

        <path d="M88 199h444" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" opacity="0.62" />
        <path d="M551 174h42" stroke="#fb7185" strokeWidth="7" strokeLinecap="round" filter="url(#lampGlow)" />
        <path d="M45 187h46" stroke="#bae6fd" strokeWidth="7" strokeLinecap="round" filter="url(#lampGlow)" />
        <path d="M487 151c21 2 39 6 55 13" stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round" opacity="0.62" />

        {[
          [156, 220],
          [480, 220],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="39" fill="url(#tire)" />
            <circle cx={cx} cy={cy} r="27" fill="#111827" stroke="#475569" strokeWidth="3" />
            <circle cx={cx} cy={cy} r="12" fill="#cbd5e1" />
            <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.72">
              <path d={`M${cx} ${cy - 21}v12`} />
              <path d={`M${cx + 18} ${cy - 10}l-10 7`} />
              <path d={`M${cx + 18} ${cy + 10}l-10-7`} />
              <path d={`M${cx} ${cy + 21}v-12`} />
              <path d={`M${cx - 18} ${cy + 10}l10-7`} />
              <path d={`M${cx - 18} ${cy - 10}l10 7`} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
