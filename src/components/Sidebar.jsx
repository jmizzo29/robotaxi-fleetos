import { useState } from 'react';
import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';
import SignOutButton from './SignOutButton';

export default function Sidebar({
  replayMode,
  setReplayMode,
  commandQueue,
  route = 'overview',
  onNavigate = () => {},
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const primaryItems = [
    ['overview', 'Command', 'Daily owner plan'],
    ['map', 'Map', 'Vehicles and service areas'],
    ['ai', 'Agent', 'Ask and approve actions'],
    ['fleet', 'Vehicles', 'Registry and readiness'],
    ['finance', 'Money', 'Revenue and ROI'],
    ['account', 'Account', 'Profile and access'],
  ];
  const advancedItems = [
    ['onboarding', 'Setup', 'Connect first Tesla'],
    ['tesla', 'Tesla', 'Connection status'],
    ['health', 'Health', 'Maintenance risk'],
    ['charging', 'Charging', 'Energy readiness'],
    ['dispatch', 'Plan', 'Staging and pricing'],
    ['settings', 'Settings', 'Runtime controls'],
  ];

  return (

    <aside className="hidden w-[300px] flex-col overflow-y-auto border-r border-[#141b27]/10 bg-[#f7f7f5] p-5 text-[#141b27] lg:flex">

      <div className="mb-7">

        <div className="mb-3 flex items-center gap-3">

          <RoboLogo className="h-8 w-8 shrink-0" />

          <RoboWordmark className="text-sm" />

        </div>

        <h1 className="text-2xl font-semibold leading-tight text-black">
          Fleet OS
          <span className="block text-slate-500">
            Command Layer
          </span>
        </h1>

      </div>

      <nav className="mb-5 space-y-5">
        <div>
          <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Main
          </p>
          <div className="space-y-1">
            {primaryItems.map(([id, label, detail]) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  route === id
                    ? 'border-[#172231]/15 bg-white text-[#141b27] shadow-sm'
                    : 'border-transparent text-slate-600 hover:border-[#141b27]/10 hover:bg-white/70 hover:text-black'
                }`}
              >
                <span className="block text-sm font-black">{label}</span>
                <span className={`mt-0.5 block text-xs leading-4 ${
                  route === id ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-600'
                }`}
                >
                  {detail}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="flex w-full items-center justify-between rounded-xl border border-[#141b27]/10 bg-white/70 px-3 py-2.5 text-left text-sm font-black text-[#141b27] transition hover:bg-white"
          >
            More
            <span className="text-xs text-slate-500">{showAdvanced ? 'Hide' : `${advancedItems.length} tools`}</span>
          </button>
          {showAdvanced && (
            <div className="mt-2 space-y-1">
              {advancedItems.map(([id, label, detail]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(id)}
                  className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    route === id
                      ? 'border-[#172231]/15 bg-white text-[#141b27] shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-[#141b27]/10 hover:bg-white/70 hover:text-black'
                  }`}
                >
                  <span className="block text-sm font-black">{label}</span>
                  <span className={`mt-0.5 block text-xs leading-4 ${
                    route === id ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`}
                  >
                    {detail}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <details className="mb-5 rounded-2xl border border-[#141b27]/10 bg-white/70 p-3">
        <summary className="cursor-pointer text-sm font-black text-[#141b27]">Demo sandbox</summary>
        <button
          onClick={() => setReplayMode(!replayMode)}
          className={`mt-3 w-full rounded-xl border py-3 text-sm font-black transition-all ${
            replayMode
              ? 'border-[#172231] bg-[#172231] text-white'
              : 'border-[#172231]/15 bg-white text-[#172231] hover:bg-slate-50'
          }`}
        >
          {replayMode
            ? 'Replay Mode Active'
            : 'Enable Replay Mode'}
        </button>
      </details>

      <SignOutButton
        onSignedOut={() => onNavigate('landing')}
        className="mb-5 w-full rounded-xl border border-[#141b27]/10 bg-white/70 px-3 py-3 text-left text-sm font-black text-[#172231] transition hover:bg-white"
        label="Sign out of this device"
      />

      {commandQueue.length > 0 && (
      <div className="mb-6">

        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Command Queue
        </p>

        <div className="space-y-3">

          {commandQueue.map((cmd, index) => (

            <div
              key={index}
              className="rounded-xl border border-[#141b27]/10 bg-white/80 p-3 shadow-sm"
            >

              <div className="flex items-center justify-between mb-2">

                <span
                  className={`text-xs font-bold
                    ${
                      cmd.priority === 'CRITICAL'
                        ? 'text-red-400'
                        : cmd.priority === 'HIGH'
                        ? 'text-yellow-300'
                        : 'text-slate-600'
                    }`}
                >
                  {cmd.priority}
                </span>

              </div>

              <p className="text-sm text-slate-700">
                {cmd.command}
              </p>

            </div>

          ))}

        </div>

      </div>
      )}

    </aside>
  )
}
