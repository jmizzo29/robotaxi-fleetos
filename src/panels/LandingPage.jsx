const capabilities = [
  ['Live Fleet Telemetry', 'Connect Tesla Fleet API data for battery, GPS, odometer, charging, and vehicle state.'],
  ['AI Operations', 'Prioritize alerts, recommend next actions, and turn fleet events into operator workflows.'],
  ['Owner Finance', 'Track acquisition cost, loan balance, equity, monthly payment, ROI, and margin by vehicle.'],
  ['Robotaxi Readiness', 'Score vehicles for future driverless operations while keeping Tesla execution boundaries clear.'],
];

const previewRows = [
  ['OCE', 'Charging', '53%', 'Ready'],
  ['Dispatch Plan', 'Tonight', '$7.4k', 'AI'],
  ['Finance', 'Fleet ROI', '31%', 'Owner'],
];

function ProductPreview() {
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.25),transparent_32%),radial-gradient(circle_at_75%_68%,rgba(16,185,129,0.2),transparent_34%)]" />
      <div className="relative p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">FleetOS</p>
            <h2 className="mt-1 text-2xl font-black text-white">AI Command Console</h2>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            Live Ready
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            ['Vehicles', '11'],
            ['Revenue', '$48k'],
            ['Risk', 'Low'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="relative mb-4 h-56 overflow-hidden rounded-xl border border-white/10 bg-[#202225]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute left-[-16%] top-[28%] h-12 w-[140%] rotate-[26deg] rounded-full border-y border-white/10 bg-white/[0.03]" />
          <div className="absolute left-[46%] top-[-20%] h-[140%] w-14 rotate-[8deg] rounded-full border-x border-white/10 bg-white/[0.03]" />
          {[
            ['left-[52%] top-[45%] bg-sky-400 shadow-sky-400/50', 'OCE'],
            ['left-[24%] top-[32%] bg-emerald-400 shadow-emerald-400/50', 'FL'],
            ['left-[78%] top-[66%] bg-rose-400 shadow-rose-400/50', 'AI'],
          ].map(([classes, label]) => (
            <div key={label} className={`absolute flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-xs font-black text-slate-950 shadow-xl ${classes}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {previewRows.map(([name, state, value, tag]) => (
            <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{name}</p>
                <p className="text-xs font-semibold text-slate-500">{state}</p>
              </div>
              <p className="text-lg font-black text-emerald-300">{value}</p>
              <span className="rounded-full border border-white/10 bg-slate-950 px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-lg shadow-sky-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-sky-200">FleetOS</span>
        </button>
        <nav className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            Open App
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dispatch')}
            className="hidden rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 sm:block"
          >
            View Demo
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-16 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-24 lg:pt-16">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              AI Fleet Operations
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              FleetOS
              <span className="block text-sky-300">for Tesla fleet owners</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A premium command layer for live telemetry, dispatch planning, charging readiness, owner finance, and AI-assisted fleet decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
              >
                Open FleetOS Console
              </button>
              <button
                type="button"
                onClick={() => onNavigate('finance')}
                className="rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                See Owner Finance
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              FleetOS plans and optimizes operations. Tesla controls actual autonomous driving availability and execution.
            </p>
          </div>

          <ProductPreview />
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-10 md:grid-cols-4">
            {capabilities.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
                <h2 className="text-lg font-black text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['For Owners', 'Understand whether each vehicle is making money, ready to dispatch, and properly documented.'],
              ['For Operators', 'Plan charging, staging, risk review, and command workflows from one command surface.'],
              ['For AI', 'Capture memory, alerts, recommendations, and outcomes so the system can learn from fleet history.'],
            ].map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-900/70 p-6">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-sky-300">{title}</p>
                <p className="text-sm leading-6 text-slate-300">{detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
