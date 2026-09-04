import RoboWordmark from './RoboWordmark';

export default function Logo({ className = '', onClick }) {
  const mark = (
    <RoboWordmark className="text-[1.05rem] tracking-[0.22em]" colorClass="text-white" />
  );

  if (!onClick) {
    return <span className={`inline-flex items-center ${className}`}>{mark}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center bg-transparent p-0 ${className}`}
      aria-label="ROBOAGENT"
    >
      {mark}
    </button>
  );
}
