export default function BetaBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-black tracking-[0.5px] text-amber-400 ${className}`}>
      BETA
    </span>
  );
}
