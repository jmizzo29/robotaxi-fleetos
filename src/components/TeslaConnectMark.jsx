/** Hairline Tesla T — graphite, no emoji, no gradient badge. */
export default function TeslaConnectMark({ className = 'h-11 w-11' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="7"
        width="34"
        height="34"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.35"
      />
      <path
        d="M16 18.5h16M24 18.5v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 18.5c2.4-1.6 5.1-2.4 8-2.4s5.6.8 8 2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
