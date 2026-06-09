export default function MobileHeroPreview() {
  const agentCards = [
    ['Pricing', '+18% weekend'],
    ['Maintenance', 'Tire watch'],
    ['Charging', '11 PM window'],
    ['Profit', '+$284'],
  ];
  const vehicleRows = [
    {
      name: 'Model Y - Orlando',
      trips: 18,
      miles: '1,284',
      revenue: '$2.4k',
      health: 96,
      tone: 'bg-emerald-400',
    },
    {
      name: 'Model 3 - Tampa',
      trips: 11,
      miles: '842',
      revenue: '$1.6k',
      health: 91,
      tone: 'bg-sky-400',
    },
    {
      name: 'Cybercab - Future',
      trips: 0,
      miles: '0',
      revenue: 'Watch',
      health: 100,
      tone: 'bg-amber-400',
    },
  ];

  return (
    <aside
      className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 md:hidden"
      data-testid="mobile-hero-preview"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">AI Agent</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Today&apos;s Plan</h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
          Active
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {agentCards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#eef8ff_100%)] p-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400 shadow-lg shadow-sky-300" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">7:04 AM AI Plan</p>
              <p className="mt-1 text-sm font-black leading-5 text-slate-950">
                Raise Orlando pricing, charge after 11 PM, and check Tampa tires before pickup.
              </p>
              <p className="mt-2 text-xs font-bold text-emerald-700">Estimated upside: +$284 this weekend</p>
            </div>
          </div>
        </div>
        {vehicleRows.map((vehicle) => (
          <div key={vehicle.name} className="grid grid-cols-[1fr_auto] gap-3 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${vehicle.tone}`} />
                <p className="truncate text-sm font-black text-slate-950">{vehicle.name}</p>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <span>{vehicle.trips} trips</span>
                <span>{vehicle.miles} mi</span>
                <span>{vehicle.revenue}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Health</p>
              <p className="mt-1 text-lg font-black text-slate-950">{vehicle.health}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">AI Brief</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
          Dynamic pricing, maintenance, charging, cleaning, and profitability, all in one owner action list.
        </p>
      </div>
    </aside>
  );
}
