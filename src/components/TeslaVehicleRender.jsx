import { getVehicleOwnership } from '../data/vehicleOwnership';

const paintPalettes = {
  white: {
    top: '#ffffff',
    mid: '#e8eef7',
    side: '#a8b3c2',
    deep: '#475569',
    highlight: '#ffffff',
  },
  black: {
    top: '#4b5563',
    mid: '#1f2937',
    side: '#0f172a',
    deep: '#020617',
    highlight: '#94a3b8',
  },
  blue: {
    top: '#3b82f6',
    mid: '#1d4ed8',
    side: '#172554',
    deep: '#020617',
    highlight: '#bfdbfe',
  },
  silver: {
    top: '#f8fafc',
    mid: '#cbd5e1',
    side: '#64748b',
    deep: '#334155',
    highlight: '#ffffff',
  },
  graphite: {
    top: '#94a3b8',
    mid: '#475569',
    side: '#1e293b',
    deep: '#020617',
    highlight: '#cbd5e1',
  },
};

function paletteFor(color = '') {
  const normalized = color.toLowerCase();

  if (normalized.includes('white')) return paintPalettes.white;
  if (normalized.includes('black')) return paintPalettes.black;
  if (normalized.includes('blue')) return paintPalettes.blue;
  if (normalized.includes('silver')) return paintPalettes.silver;
  if (normalized.includes('graphite') || normalized.includes('gray') || normalized.includes('grey')) return paintPalettes.graphite;

  return paintPalettes.white;
}

function modelType(model = '') {
  const normalized = model.toLowerCase();

  if (normalized.includes('model x') || normalized.includes('crossover')) return 'suv';
  if (normalized.includes('model y')) return 'crossover';
  if (normalized.includes('model s') || normalized.includes('sedan')) return 'sedan';
  if (normalized.includes('cyber')) return 'truck';

  return 'sedan';
}

function getGeometry(type) {
  if (type === 'suv') {
    return {
      body: 'M58 190c14-35 40-58 77-70l40-13c26-36 66-54 119-54 61 0 108 23 141 69l58 13c34 8 57 27 68 57l10 28H38c3-12 10-22 20-30Z',
      side: 'M61 190c64-21 139-31 226-30h181c44 0 75 21 94 63H38c4-14 12-25 23-33Z',
      glass: 'M180 108c23-29 59-44 108-44 48 0 85 16 112 49l20 34H147l33-39Z',
      rear: 'M426 126l45 14',
      roof: 'M187 105c31-25 68-37 112-37 41 0 74 13 100 39',
      wheelY: 220,
      frontWheel: 465,
      rearWheel: 150,
    };
  }

  if (type === 'crossover') {
    return {
      body: 'M60 192c17-32 43-53 79-63l42-12c30-34 74-50 132-50 52 0 92 15 121 44l52 22c35 14 58 35 70 62l11 25H39c3-12 10-21 21-28Z',
      side: 'M60 191c71-24 154-35 248-32h151c44 0 76 21 95 63H39c4-13 11-23 21-31Z',
      glass: 'M183 116c27-28 65-42 115-42 44 0 78 13 101 39l23 33H149l34-30Z',
      rear: 'M426 127l43 17',
      roof: 'M191 112c32-24 69-35 111-35 39 0 70 11 94 34',
      wheelY: 220,
      frontWheel: 462,
      rearWheel: 153,
    };
  }

  if (type === 'truck') {
    return {
      body: 'M55 192 210 80h145l157 68c31 13 52 30 63 52l10 20H39c3-12 8-21 16-28Z',
      side: 'M63 192h440c26 0 47 10 61 30H39c4-13 12-23 24-30Z',
      glass: 'M210 85h133l53 58H145l65-58Z',
      rear: 'M410 144l64 0',
      roof: 'M214 85h129l48 53',
      wheelY: 220,
      frontWheel: 468,
      rearWheel: 154,
    };
  }

  return {
    body: 'M60 190c18-31 47-51 87-60l51-11c33-30 82-45 147-45 50 0 90 11 119 33 21 16 42 36 63 61l38 11c24 8 41 22 50 43H38c3-13 10-24 22-32Z',
    side: 'M61 191c77-22 168-33 273-31h137c57 0 97 20 121 61H39c4-13 11-23 22-30Z',
    glass: 'M210 116c26-23 69-34 127-34 42 0 76 9 101 28 16 12 31 27 45 46H170l40-40Z',
    rear: 'M491 151l45 14',
    roof: 'M213 112c34-22 80-33 136-33 42 0 75 9 100 27',
    wheelY: 220,
    frontWheel: 485,
    rearWheel: 158,
  };
}

function Wheel({ cx, cy, compact }) {
  const radius = compact ? 26 : 38;
  const inner = compact ? 17 : 25;
  const hub = compact ? 7 : 11;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="#020617" />
      <circle cx={cx} cy={cy} r={inner} fill="#111827" stroke="#64748b" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={hub} fill="#e2e8f0" />
      {!compact && (
        <g stroke="#94a3b8" strokeLinecap="round" strokeWidth="3" opacity="0.8">
          <path d={`M${cx} ${cy - 20}v10`} />
          <path d={`M${cx + 17} ${cy - 9}l-9 6`} />
          <path d={`M${cx + 17} ${cy + 9}l-9-6`} />
          <path d={`M${cx} ${cy + 20}v-10`} />
          <path d={`M${cx - 17} ${cy + 9}l9-6`} />
          <path d={`M${cx - 17} ${cy - 9}l9 6`} />
        </g>
      )}
    </g>
  );
}

export default function TeslaVehicleRender({
  vehicle,
  ownership: explicitOwnership,
  className = '',
  compact = false,
}) {
  const ownership = explicitOwnership || vehicle?.ownership || getVehicleOwnership(vehicle);
  const palette = paletteFor(ownership?.color);
  const geometry = getGeometry(modelType(ownership?.model));
  const label = ownership?.model || (vehicle?.isReal ? 'Tesla' : 'Fleet EV');
  const tag = ownership?.tag || vehicle?.name || vehicle?.id;

  return (
    <svg viewBox="0 0 640 280" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="teslaPaintTop" x1="90" x2="560" y1="65" y2="205" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette.top} />
          <stop offset="0.42" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        <linearGradient id="teslaPaintSide" x1="72" x2="540" y1="150" y2="232" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={palette.highlight} />
          <stop offset="0.38" stopColor={palette.side} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        <linearGradient id="teslaGlass" x1="150" x2="468" y1="70" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b7e7ff" stopOpacity="0.82" />
          <stop offset="0.42" stopColor="#164766" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <radialGradient id="teslaStageGlow" cx="50%" cy="45%" r="56%">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.24" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="teslaDrop" x="-12%" y="-18%" width="124%" height="150%">
          <feDropShadow dx="0" dy="24" stdDeviation="18" floodColor="#000000" floodOpacity="0.42" />
        </filter>
      </defs>

      <ellipse cx="320" cy="236" rx="252" ry="25" fill="#020617" opacity="0.42" />
      {!compact && <ellipse cx="320" cy="140" rx="300" ry="142" fill="url(#teslaStageGlow)" />}

      <g filter="url(#teslaDrop)">
        <path d={geometry.body} fill="url(#teslaPaintTop)" />
        <path d={geometry.side} fill="url(#teslaPaintSide)" />
        <path d={geometry.glass} fill="url(#teslaGlass)" />
        <path d={geometry.roof} fill="none" stroke="#f8fafc" strokeLinecap="round" strokeWidth={compact ? 4 : 5} opacity="0.5" />
        <path d={geometry.rear} fill="none" stroke="#f8fafc" strokeLinecap="round" strokeWidth="4" opacity="0.38" />
        <path d="M86 199h430" stroke="#0f172a" strokeLinecap="round" strokeWidth="7" opacity="0.45" />
        <path d="M48 188h45" stroke="#bae6fd" strokeLinecap="round" strokeWidth="8" />
        <path d="M545 181h48" stroke="#fb7185" strokeLinecap="round" strokeWidth="8" />
        <path d="M116 170c97-18 203-26 318-23 64 2 119 10 165 24" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="5" opacity="0.26" />

        <Wheel cx={geometry.rearWheel} cy={geometry.wheelY} compact={compact} />
        <Wheel cx={geometry.frontWheel} cy={geometry.wheelY} compact={compact} />
      </g>

      {!compact && (
        <g>
          <rect x="404" y="29" width="176" height="42" rx="21" fill="#020617" opacity="0.62" />
          <text x="425" y="48" fill="#cbd5e1" fontFamily="Inter, ui-sans-serif, system-ui" fontSize="11" fontWeight="800" letterSpacing="2">
            {String(label).toUpperCase()}
          </text>
          <text x="425" y="62" fill="#38bdf8" fontFamily="Inter, ui-sans-serif, system-ui" fontSize="10" fontWeight="900" letterSpacing="1.6">
            {String(tag).toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}
