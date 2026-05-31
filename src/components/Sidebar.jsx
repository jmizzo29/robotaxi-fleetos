import { useState } from 'react';
import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';
import SignOutButton from './SignOutButton';
import BetaBadge from './BetaBadge';

export default function Sidebar({
  replayMode,
  setReplayMode,
  commandQueue,
  route = 'overview',
  onNavigate = () => {},
}) {
  const mainItems = [
    ['overview', 'Command', 'Daily plan & AI actions'],
    ['map', 'Map', 'Live locations'],
    ['ai', 'Agent', 'Ask & approve'],
    ['fleet', 'Vehicles', 'Fleet overview'],
    ['finance', 'Money', 'Revenue & costs'],
    ['account', 'Account', 'Profile & Tesla'],
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
            Command Layer <BetaBadge className="ml-1 align-middle" />
          </span>
        </h1>

      </div>

      <nav className="space-y-1">
        {mainItems.map(([id, label, detail]) => (
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
            }`}>
              {detail}
            </span>
          </button>
        ))}
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
