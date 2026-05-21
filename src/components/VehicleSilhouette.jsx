export default function VehicleSilhouette({ className = '' }) {
  return (
    <svg
      viewBox="0 0 520 230"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="evBody" x1="54" x2="448" y1="64" y2="178" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.34" stopColor="#e2e8f0" />
          <stop offset="0.72" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="evLower" x1="80" x2="438" y1="126" y2="174" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="evGlass" x1="142" x2="366" y1="55" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#0f172a" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="evSweep" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.45" stopColor="#334155" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <filter id="evShadow" x="-15%" y="-20%" width="130%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#000000" floodOpacity="0.42" />
        </filter>
        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="bodyClip">
          <path d="M52 144c13-28 34-47 63-56l47-15c28-22 68-33 120-33 45 0 77 11 97 32l40 42 41 12c17 5 28 17 34 36l5 18H33c2-15 8-27 19-36Z" />
        </clipPath>
      </defs>

      <style>
        {`
          .ev-sweep {
            animation: evSweep 4.8s ease-in-out infinite;
            transform-origin: center;
          }

          .ev-wheel {
            animation: evWheelPulse 3.6s ease-in-out infinite;
          }

          @keyframes evSweep {
            0%, 24% { transform: translateX(-260px) skewX(-18deg); opacity: 0; }
            38% { opacity: 0.55; }
            62% { transform: translateX(300px) skewX(-18deg); opacity: 0; }
            100% { transform: translateX(300px) skewX(-18deg); opacity: 0; }
          }

          @keyframes evWheelPulse {
            0%, 100% { opacity: 0.82; }
            50% { opacity: 1; }
          }
        `}
      </style>

      <ellipse cx="260" cy="188" rx="213" ry="22" fill="#020617" opacity="0.42" />

      <g filter="url(#evShadow)">
        <path
          d="M52 144c13-28 34-47 63-56l47-15c28-22 68-33 120-33 45 0 77 11 97 32l40 42 41 12c17 5 28 17 34 36l5 18H33c2-15 8-27 19-36Z"
          fill="url(#evBody)"
        />
        <path
          d="M70 137c24-13 52-21 84-24l250-2c35 0 61 12 77 35l13 34H34c4-19 16-33 36-43Z"
          fill="url(#evLower)"
          opacity="0.92"
        />

        <g clipPath="url(#bodyClip)">
          <rect className="ev-sweep" x="120" y="37" width="52" height="154" fill="url(#evSweep)" opacity="0.45" />
        </g>

        <path
          d="M171 76c26-17 61-26 106-26 40 0 67 8 82 25l31 36H128c11-15 25-27 43-35Z"
          fill="url(#evGlass)"
        />
        <path d="M262 52v58" stroke="#64748b" strokeWidth="3" opacity="0.55" />
        <path d="M356 76l29 34" stroke="#64748b" strokeWidth="3" opacity="0.55" />
        <path
          d="M143 83c30-19 70-28 120-27"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.48"
        />

        <path
          d="M91 137c68-9 131-13 190-12 56 1 111 6 164 15"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.68"
        />
        <path
          d="M85 158h342"
          stroke="#1e293b"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.65"
        />

        <path d="M446 139h31" stroke="#fb7185" strokeWidth="9" strokeLinecap="round" filter="url(#softGlow)" />
        <path d="M44 149h35" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />
        <path d="M389 121c10 1 21 4 32 8" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />

        {[
          [132, 176],
          [392, 176],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} className="ev-wheel">
            <circle cx={cx} cy={cy} r="34" fill="#020617" />
            <circle cx={cx} cy={cy} r="25" fill="url(#wheelGlow)" />
            <circle cx={cx} cy={cy} r="9" fill="#cbd5e1" />
            <g stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" opacity="0.78">
              <path d={`M${cx} ${cy - 20}v11`} />
              <path d={`M${cx} ${cy + 9}v11`} />
              <path d={`M${cx - 20} ${cy}h11`} />
              <path d={`M${cx + 9} ${cy}h11`} />
              <path d={`M${cx - 14} ${cy - 14}l8 8`} />
              <path d={`M${cx + 6} ${cy + 6}l8 8`} />
              <path d={`M${cx + 14} ${cy - 14}l-8 8`} />
              <path d={`M${cx - 6} ${cy + 6}l-8 8`} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
