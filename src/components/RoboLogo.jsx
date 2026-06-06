import { useId } from 'react';

export default function RoboLogo({ className = 'h-12 w-12', title = 'RoboAgent' }) {
  const maskId = useId();
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      {...(decorative ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': title })}
    >
      <mask id={maskId}>
        <rect width="32" height="32" fill="#fff" />
        <circle cx="17.4" cy="12.6" r="2.5" fill="#000" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect x="10.5" y="8" width="3.8" height="16" rx="0.4" />
        <path d="M10.5 8 H17.2 A4.6 4.6 0 0 1 17.2 17.2 H10.5 Z" />
        <path d="M13 16 L17.4 16 L21.8 24 L17.4 24 Z" />
      </g>
      <circle cx="17.4" cy="12.6" r="1.35" fill="var(--color-status-ready, #10b981)" />
    </svg>
  );
}
