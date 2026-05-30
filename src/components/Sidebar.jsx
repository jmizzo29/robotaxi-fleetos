import { useState } from 'react';
import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';
import { logoutFleetOsAccount } from '../services/sessionService';

export default function Sidebar({
  replayMode,
  setReplayMode,
  commandQueue,
  route = 'overview',
  onNavigate = () => {},
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navSections = [
    {
      label: 'Operate',
      items: [
        ['overview', 'Command', 'Daily owner dashboard'],
        ['map', 'Map', 'Vehicles and service areas'],
        ['ai', 'Agent', 'Ask and approve actions'],
        ['dispatch', 'Plan', 'Staging and pricing'],
      ],
    },
    {
      label: 'Fleet',
      items: [
        ['fleet', 'Vehicles', 'Registry and selection'],
        ['health', 'Health', 'Maintenance and risk'],
        ['charging', 'Charging', 'Energy readiness'],
        ['finance', 'Money', 'Revenue and ROI'],
      ],
    },
    {
      label: 'Connect',
      items: [
        ['onboarding', 'Setup', 'Account and Tesla connect'],
        ['tesla', 'Tesla', 'API status and controls'],
        ['integrations', 'Integrations', 'External systems'],
        ['account', 'Account', 'Profile and access'],
      ],
    },
    {
      label: 'Advanced',
      items: [
        ['assets', 'Assets', 'Ownership details'],
        ['readiness', 'Readiness', 'Driverless scoring'],
        ['alerts', 'Alerts', 'AI triage queue'],
        ['reports', 'Reports', 'Operations intelligence'],
        ['memory', 'Memory', 'Fleet event history'],
        ['settings', 'Settings', 'Runtime controls'],
        ['admin', 'Admin', 'Beta operations'],
        ['privacy', 'Privacy', 'Data policy'],
        ['terms', 'Terms', 'Beta terms'],
      ],
    },
  ];
  const visibleSections = navSections.filter((section) => section.label !== 'Advanced');
  const advancedSection = navSections.find((section) => section.label === 'Advanced');
  const signOut = async () => {
    setIsSigningOut(true);
    onNavigate('landing');

    try {
      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
    } finally {
      setIsSigningOut(false);
    }
  };

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

      <div className="mb-5 rounded-2xl border border-[#141b27]/10 bg-white/80 p-3 shadow-sm">
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-black text-[#141b27] transition hover:bg-slate-100"
        >
          Account
          <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-500">Sign in, sign out, profile</span>
        </button>
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="mt-1 w-full rounded-xl border border-red-500/15 bg-red-50 px-3 py-2.5 text-left text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <nav className="mb-5 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(([id, label, detail]) => (
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
        ))}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="flex w-full items-center justify-between rounded-xl border border-[#141b27]/10 bg-white/70 px-3 py-2.5 text-left text-sm font-black text-[#141b27] transition hover:bg-white"
          >
            Advanced
            <span className="text-xs text-slate-500">{showAdvanced ? 'Hide' : `${advancedSection.items.length} tools`}</span>
          </button>
          {showAdvanced && (
            <div className="mt-2 space-y-1">
              {advancedSection.items.map(([id, label, detail]) => (
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

      <button
        onClick={() => setReplayMode(!replayMode)}
        className={`mb-5 rounded-xl border py-3 text-sm font-black transition-all ${
          replayMode
            ? 'border-[#172231] bg-[#172231] text-white'
            : 'border-[#172231]/15 bg-white/70 text-[#172231] hover:bg-white'
        }`}
      >
        {replayMode
          ? 'Replay Mode Active'
          : 'Enable Replay Mode'}
      </button>

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
