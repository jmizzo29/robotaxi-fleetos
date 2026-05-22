import { useState } from 'react';
import TeslaIndependenceNotice from '../components/TeslaIndependenceNotice';
import useFleetAuthStatus from '../auth/useFleetAuthStatus';
import { submitEarlyAccessLead } from '../services/leadService';

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

const plans = [
  ['First Tesla', 'Free', 'Live sync, location intelligence, owner finance, and AI vehicle brief for one Tesla.'],
  ['Additional Teslas', 'Paid add-on', 'Scale into a rental fleet with multi-vehicle telemetry, history, alerts, and portfolio reporting.'],
  ['Operator Tools', 'Pro tier', 'Advanced dispatch planning, fleet memory, readiness scoring, and AI workflow automation.'],
];

const setupSteps = [
  ['Create FleetOS account', 'Start with one Tesla and keep the first vehicle free while you learn the product.'],
  ['Authenticate with Tesla', 'Use Tesla OAuth to approve telemetry access. FleetOS never needs your Tesla password.'],
  ['Sync and monitor', 'See battery, location, charging, odometer, parking history, and owner economics in one console.'],
];

const trustPoints = [
  ['Secure account login', 'FleetOS uses managed identity via Clerk when configured, with verified sessions before Tesla connection.'],
  ['Tesla password never shared', 'Owners authenticate directly with Tesla OAuth. FleetOS never asks for or stores Tesla account passwords.'],
  ['Encrypted Tesla tokens', 'Tesla refresh tokens are encrypted in Postgres and tied to the signed-in FleetOS user.'],
  ['Privacy-first location', 'Precise vehicle location is protected by consent and rounded by default in API responses.'],
];

const pricing = [
  ['Free', '$0', '1 Tesla', 'Live telemetry, GPS/location intelligence, parking history, owner finance, and AI brief.'],
  ['Owner Fleet', '$12', 'per extra Tesla / mo', 'Multi-vehicle monitoring for rental hosts, Turo-style operators, and small fleets.'],
  ['Operator Pro', 'Custom', 'for larger fleets', 'Dispatch workflows, advanced reporting, RAG memory, and higher-touch onboarding.'],
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

function EarlyAccessForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    teslaCount: '1',
    useCase: 'Renting my Tesla',
    plan: 'First Tesla free',
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ state: 'loading', message: 'Joining early access...' });

    try {
      await submitEarlyAccessLead(form);
      setStatus({
        state: 'success',
        message: 'You are on the early access list. FleetOS will prioritize owner-renters first.',
      });
      setForm((current) => ({ ...current, name: '', email: '' }));
    } catch (error) {
      setStatus({
        state: 'error',
        message: error.message || 'Could not submit yet. Try again in a moment.',
      });
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Name</span>
          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-300"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-300"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Teslas</span>
          <select
            value={form.teslaCount}
            onChange={(event) => update('teslaCount', event.target.value)}
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-300"
          >
            <option>1</option>
            <option>2-3</option>
            <option>4-10</option>
            <option>10+</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Use Case</span>
          <select
            value={form.useCase}
            onChange={(event) => update('useCase', event.target.value)}
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-300"
          >
            <option>Renting my Tesla</option>
            <option>Tracking my personal Tesla</option>
            <option>Managing a small fleet</option>
            <option>Exploring robotaxi readiness</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={status.state === 'loading'}
        className="mt-4 w-full rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-70"
      >
        {status.state === 'loading' ? 'Joining...' : 'Join Early Access'}
      </button>

      {status.message && (
        <p className={`mt-3 text-sm font-semibold ${
          status.state === 'error' ? 'text-rose-300' : 'text-emerald-300'
        }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}

export default function LandingPage({ onNavigate }) {
  const { isSignedIn } = useFleetAuthStatus();
  const enterApp = (route = 'overview') => {
    onNavigate(isSignedIn ? route : 'onboarding');
  };

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
            onClick={() => onNavigate('onboarding')}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => enterApp('dispatch')}
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
              A premium command layer for Tesla owners who rent, share, or operate their vehicles and want live telemetry, finance tracking, location history, and AI-assisted decisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['First Tesla free', 'Built for owner-renters', 'Connect with Tesla OAuth'].map((label) => (
                <span key={label} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-200">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
              >
                Start Free Setup
              </button>
              <button
                type="button"
                onClick={() => enterApp('overview')}
                className="rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                {isSignedIn ? 'Open Console' : 'Sign In to Open Console'}
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              FleetOS plans and optimizes operations. Tesla controls actual autonomous driving availability and execution.
            </p>
          </div>

          <ProductPreview />
        </section>

        <section className="border-y border-white/10 bg-slate-950/80">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-8 md:grid-cols-4">
            {trustPoints.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
              </article>
            ))}
          </div>
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

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Owner Rental Model
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-white">
              Free for your first Tesla. Built to grow into a rental fleet.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              FleetOS should feel useful before it asks for money: connect one car, understand its location, battery, utilization, and economics, then pay only when you add more vehicles or need operator-grade automation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map(([title, price, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">{title}</p>
                <h3 className="mt-3 text-2xl font-black text-white">{price}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950/70">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
                  Easy Setup
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                  Connect Tesla in minutes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => enterApp('tesla')}
                className="rounded-md border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                {isSignedIn ? 'View Tesla Integration' : 'Sign In to Connect Tesla'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {setupSteps.map(([title, detail], index) => (
                <article key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-300 text-sm font-black text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-slate-600">
              FleetOS uses Tesla-approved authentication flows and is not affiliated with or endorsed by Tesla.
            </p>
            <div className="mt-5 max-w-3xl">
              <TeslaIndependenceNotice compact />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Early Access
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-white">
              Start free, then pay only when FleetOS helps manage more Teslas.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              The first version should be generous for regular owners. The business model becomes simple when someone adds a second, third, or tenth Tesla and FleetOS starts saving real operator time.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {pricing.map(([name, price, unit, detail]) => (
                <article key={name} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-2xl font-black text-sky-300">{price}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{unit}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <EarlyAccessForm />
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
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>FleetOS beta. Not affiliated with or endorsed by Tesla.</p>
        <div className="flex gap-4">
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-sky-300">Privacy</button>
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-sky-300">Terms</button>
        </div>
      </footer>
    </div>
  );
}
