import { useState } from 'react';
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

    <aside className="hidden w-[300px] flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,rgba(12,16,20,0.98),rgba(8,10,12,0.98))] p-5 lg:flex">

      <div className="mb-7">

        <div className="mb-3 flex items-center gap-3">

          <div className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.8)]"></div>

          <span className="text-xs font-black uppercase tracking-[0.28em] text-teal-200">
            RoboAgent
          </span>

        </div>

        <h1 className="text-2xl font-black leading-tight tracking-tight text-white">
          Fleet OS
          <span className="block text-teal-200">
            Command Layer
          </span>
        </h1>

      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-100 transition hover:bg-white/[0.07]"
        >
          Account
          <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-500">Sign in, sign out, profile</span>
        </button>
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="mt-1 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-left text-sm font-black text-red-100 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-60"
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <nav className="mb-5 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
                      ? 'border-teal-300/30 bg-teal-300/12 text-white'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-100'
                  }`}
                >
                  <span className="block text-sm font-black">{label}</span>
                  <span className={`mt-0.5 block text-xs leading-4 ${
                    route === id ? 'text-teal-100/80' : 'text-slate-500 group-hover:text-slate-400'
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
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
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
                      ? 'border-teal-300/30 bg-teal-300/12 text-white'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-100'
                  }`}
                >
                  <span className="block text-sm font-black">{label}</span>
                  <span className={`mt-0.5 block text-xs leading-4 ${
                    route === id ? 'text-teal-100/80' : 'text-slate-500 group-hover:text-slate-400'
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
            ? 'border-teal-300 bg-teal-300 text-slate-950'
            : 'border-teal-400/25 bg-teal-400/8 text-teal-100 hover:bg-teal-400/12'
        }`}
      >
        {replayMode
          ? 'Replay Mode Active'
          : 'Enable Replay Mode'}
      </button>

      {commandQueue.length > 0 && (
      <div className="mb-6">

        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-teal-300">
          Command Queue
        </p>

        <div className="space-y-3">

          {commandQueue.map((cmd, index) => (

            <div
              key={index}
              className="rounded-xl border border-white/[0.10] bg-white/[0.04] p-3"
            >

              <div className="flex items-center justify-between mb-2">

                <span
                  className={`text-xs font-bold
                    ${
                      cmd.priority === 'CRITICAL'
                        ? 'text-red-400'
                        : cmd.priority === 'HIGH'
                        ? 'text-yellow-300'
                        : 'text-sky-300'
                    }`}
                >
                  {cmd.priority}
                </span>

              </div>

              <p className="text-sm text-slate-200">
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
