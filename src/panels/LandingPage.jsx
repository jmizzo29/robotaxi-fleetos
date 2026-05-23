import { useState } from 'react';
import { SignInButton } from '@clerk/react';
import TeslaIndependenceNotice from '../components/TeslaIndependenceNotice';
import { useFleetAuthStatus } from '../auth/FleetAuthContext';
import { isClerkConfigured } from '../auth/clerkConfig';

const capabilities = [
  ['AI Operations Agent', 'Understands owner goals, breaks them into workflows, and recommends the next best action.'],
  ['Vehicle Health & Maintenance', 'Watches battery, state, mileage, anomaly risk, and service needs so issues surface before downtime.'],
  ['Smart Earnings Optimizer', 'Combines utilization, owner-entered revenue, and vehicle readiness to estimate where money is being made or lost.'],
  ['Autonomous Scheduling', 'Plans charging, cleaning, service, staging, and dispatch workflows around fleet availability.'],
  ['Live Fleet Telemetry', 'Connects Tesla Fleet API data for battery, location, odometer, charging, vehicle state, and sync history.'],
];

const previewRows = [
  ['Goal', 'Maximize earnings this weekend', 'Planned', 'Agent'],
  ['Action', 'Stage, charge, inspect', 'Review', 'Control'],
  ['Owner Economics', 'Cost, balance, revenue', 'Private', 'Finance'],
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
  ['Secure account login', 'FleetOS uses managed identity with verified sessions before any Tesla connection can be attached.'],
  ['Tesla password never shared', 'Owners authenticate directly with Tesla. FleetOS never asks for or stores Tesla account passwords.'],
  ['Encrypted access tokens', 'Tesla connection tokens are encrypted server-side and tied to the signed-in FleetOS user.'],
  ['Owner-controlled data', 'Users can disconnect Tesla, revoke consent, or request deletion of FleetOS data.'],
];

const securityFeatures = [
  ['Verified identity first', 'Users create or sign into a FleetOS account before connecting a vehicle. Tesla access is scoped to that user.'],
  ['Consent before telemetry', 'FleetOS asks for explicit consent before processing VIN, battery, odometer, charging, vehicle state, or location.'],
  ['Protected vehicle location', 'Precise location is treated as sensitive data and API responses use privacy-safe rounding by default.'],
  ['Encrypted token storage', 'Tesla refresh tokens are stored encrypted in Postgres, not in the browser and not in Clerk.'],
  ['Admin data minimization', 'Admin views are server-protected and redact sensitive lead, feedback, and vehicle/user details.'],
  ['Revocation and deletion', 'Users can disconnect Tesla and delete their FleetOS account data from the product flow.'],
];

const pricing = [
  ['Free', '$0', '1 Tesla', 'Live telemetry, GPS/location intelligence, parking history, owner finance, and AI brief.'],
  ['Owner Fleet', '$12', 'per extra Tesla / mo', 'Multi-vehicle monitoring for rental hosts, Turo-style operators, and small fleets.'],
  ['Operator Pro', 'Custom', 'for larger fleets', 'Dispatch workflows, advanced reporting, RAG memory, and higher-touch onboarding.'],
];

const maintenanceFeatures = [
  ['Vehicle Health Score', 'A 0-100 readiness score that blends battery, mileage, alerts, charge state, software status, and maintenance signals.'],
  ['Battery & Degradation Tracking', 'Watch battery behavior, charging patterns, state of charge, and long-term degradation indicators.'],
  ['Tires, Brakes & Ride Quality', 'Track tire pressure and wear, brake pad estimates, suspension/alignment signals, and service risk.'],
  ['Proactive Maintenance Alerts', 'Flag issues like low tire pressure, service due soon, update required, or unusual operating risk before downtime.'],
  ['Agent-Driven Scheduling', 'Recommend service, cleaning, charging, and inspection windows using demand, battery state, weather, and availability.'],
  ['Cleaning Management', 'Manual interior cleanliness tracking now, with future support for cabin camera or vision-based scoring.'],
  ['Service History & Costs', 'Keep a digital service log with repair notes, costs, warranty status, and documents by vehicle.'],
  ['Predictive Maintenance', 'Use odometer, battery cycles, driving patterns, and fleet history to predict likely failures earlier.'],
];

const maintenanceOutcomes = [
  'Daily health summaries',
  'Predictive maintenance alerts',
  'Smart scheduling around ride demand',
  'Cleaning workflow automation',
  'Service cost & ROI tracking',
];

const predictiveMaintenancePriorities = [
  ['1', 'Battery Health', 'Most expensive and critical', '30-90 days', 'SoC, voltage, temperature, charge cycles, energy usage'],
  ['2', 'Tire Wear', 'High utilization creates fast wear', '15-45 days', 'Odometer, TPMS pressure, temperature, driving style'],
  ['3', 'Brake Wear', 'Regen helps, but pads still matter', '30-60 days', 'Brake usage, odometer, regen patterns'],
  ['4', 'Suspension / Motors', 'High-mileage failures can create long downtime', '20-60 days', 'Power usage, alerts, service history, vibration proxies'],
  ['5', 'Cabin / Cleaning', 'Passenger experience affects ratings and bookings', '1-7 days', 'Manual input now, future cabin camera or vision score'],
];

const teslaBestPractices = [
  ['Fleet Telemetry First', 'FleetOS is designed to prefer Tesla Fleet Telemetry streaming, where vehicles push changed fields to the backend instead of forcing constant polling.'],
  ['VIN-Scoped Limits', 'Rate limits are keyed by user, VIN, and action so one vehicle cannot accidentally throttle the whole fleet.'],
  ['Wake-Safe Agent Design', 'The AI agent should avoid unnecessary wakes, batch requests, wait for naturally-awake vehicles, and warn users as limits get close.'],
  ['Command Cooldowns', 'Operational commands need cooldowns, audit logs, last-known-state caching, and clear user approval before anything important or repeated is queued.'],
];

const demoPrompts = [
  'Maximize earnings this weekend with my 3 Teslas',
  'Check health and prepare all vehicles for tomorrow',
  'Give me a full fleet summary',
];

function buildDemoResponse(goal) {
  const lower = goal.toLowerCase();

  if (lower.includes('health') || lower.includes('prepare')) {
    return {
      title: 'Tomorrow readiness plan',
      summary: 'FleetOS would inspect health, battery, cleanliness, and service risk before morning demand.',
      steps: [
        'Run vehicle health scores for all Teslas and flag any score below 82.',
        'Schedule charging for vehicles under 65% before peak pickup windows.',
        'Queue cleaning inspection for vehicles with recent completed trips.',
        'Hold wake/command actions for owner approval and respect VIN-scoped cooldowns.',
      ],
      confidence: 91,
      impact: 'Higher morning uptime and fewer last-minute cancellations.',
    };
  }

  if (lower.includes('summary') || lower.includes('fleet')) {
    return {
      title: 'Fleet summary brief',
      summary: 'FleetOS would combine telemetry, rental earnings, maintenance risk, and utilization into one owner report.',
      steps: [
        'Summarize live battery, location, odometer, charging state, and last sync age.',
        'Compare Turo earnings CSV records against modeled operating costs.',
        'Identify vehicles with low utilization, high maintenance reserve, or weak ROI.',
        'Generate an owner-ready action list for finance, cleaning, charging, and service.',
      ],
      confidence: 88,
      impact: 'Clear owner visibility without manually checking Tesla, Turo, and spreadsheets.',
    };
  }

  return {
    title: 'Weekend earnings optimization',
    summary: 'FleetOS would prioritize the highest-revenue windows while protecting battery, maintenance, and cleaning readiness.',
    steps: [
      'Forecast demand windows and rank vehicles by readiness, charge level, and revenue potential.',
      'Stage high-battery vehicles near likely pickup zones and reserve one vehicle for quick-turn trips.',
      'Schedule charging and cleaning around low-demand gaps instead of peak earning hours.',
      'Prepare an approval queue before any wake, command, or dispatch-related workflow runs.',
    ],
    confidence: 93,
    impact: 'More booked hours, fewer avoidable gaps, and better profit per vehicle.',
  };
}

function InteractiveAgentDemo() {
  const [goal, setGoal] = useState(demoPrompts[0]);
  const [response, setResponse] = useState(() => buildDemoResponse(demoPrompts[0]));

  const runDemo = (nextGoal = goal) => {
    setGoal(nextGoal);
    setResponse(buildDemoResponse(nextGoal));
  };

  return (
    <section className="border-y border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Try the AI Agent</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            Type a goal and see how FleetOS responds.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            This simulated demo shows the kind of planning FleetOS can do once a user connects Tesla telemetry, Turo earnings, and vehicle health history.
          </p>

          <div className="mt-6 space-y-2">
            {demoPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => runDemo(prompt)}
                className="block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-300/10"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        <article className="rounded-2xl border border-sky-300/20 bg-slate-900/90 p-5 shadow-2xl shadow-black/30">
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
            <label htmlFor="agent-demo-goal" className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              Goal
            </label>
            <textarea
              id="agent-demo-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-300/50"
              placeholder="Tell FleetOS what you want the fleet to do..."
            />
            <button
              type="button"
              onClick={() => runDemo()}
              className="mt-3 w-full rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
            >
              Try Interactive Demo
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">FleetOS Response</p>
                <h3 className="mt-2 text-2xl font-black text-white">{response.title}</h3>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                {response.confidence}% confidence
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{response.summary}</p>
            <div className="mt-4 space-y-2">
              {response.steps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-300 text-xs font-black text-slate-950">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-bold text-emerald-200">
              Expected impact: {response.impact}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.25),transparent_32%),radial-gradient(circle_at_75%_68%,rgba(16,185,129,0.2),transparent_34%)]" />
      <div className="relative p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">FleetOS</p>
            <h2 className="mt-1 text-2xl font-black text-white">AI Agent Console</h2>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            Preview
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            ['Agent Goal', 'Earnings'],
            ['Fleet State', 'Ready'],
            ['Control', 'Owner'],
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
            ['left-[52%] top-[45%] bg-sky-400 shadow-sky-400/50', 'Tesla'],
            ['left-[24%] top-[32%] bg-emerald-400 shadow-emerald-400/50', 'Fleet'],
            ['left-[78%] top-[66%] bg-rose-400 shadow-rose-400/50', 'AI'],
          ].map(([classes, label]) => (
            <div key={label} className={`absolute flex h-11 min-w-11 items-center justify-center rounded-full border border-white/30 px-2 text-[11px] font-black text-slate-950 shadow-xl ${classes}`}>
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
  const { isSignedIn } = useFleetAuthStatus();
  const enterApp = (route = 'overview') => {
    onNavigate(isSignedIn ? route : 'onboarding');
  };
  const clerkReady = isClerkConfigured();

  const signInControl = (
    <button
      type="button"
      onClick={() => {
        if (!clerkReady) onNavigate('account');
      }}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
    >
      Sign In
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-lg shadow-sky-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-sky-200">FleetOS</span>
        </button>
        <nav className="flex items-center gap-3">
          {!isSignedIn && (
            clerkReady ? (
              <SignInButton mode="modal">
                {signInControl}
              </SignInButton>
            ) : signInControl
          )}
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
              AI Fleet Agent
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              FleetOS
              <span className="block text-sky-300">Your AI Agent for Tesla Rental & Robotaxi Fleets</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Give your AI agent goals. It monitors vehicles, optimizes earnings, plans maintenance, and helps run your fleet while you stay in full control.
            </p>
            <div className="mt-6 rounded-xl border border-sky-300/20 bg-sky-300/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Give natural commands like</p>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-200">
                {[
                  '"Maximize earnings this weekend"',
                  '"Prepare all vehicles for tomorrow morning"',
                  '"Check health on Cybercab #2"',
                ].map((command) => (
                  <p key={command} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                    {command}
                  </p>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                The agent thinks, plans, and recommends action. You approve the workflow before FleetOS touches sensitive data or queues operational changes.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {['First Tesla free', 'Owner-controlled access', 'Tesla password never shared'].map((label) => (
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
                Try the AI Agent
              </button>
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => enterApp('overview')}
                  className="rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Open Console
                </button>
              ) : clerkReady ? (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-100 transition hover:bg-white/10"
                  >
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('account')}
                  className="rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Sign In
                </button>
              )}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              FleetOS plans and optimizes operations. Tesla controls actual autonomous driving availability and execution.
            </p>
          </div>

          <ProductPreview />
        </section>

        <InteractiveAgentDemo />

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

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Security & Privacy
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
              Built for trust before telemetry.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              FleetOS is designed around user-controlled access: sign in first, consent before syncing, connect through Tesla, encrypt sensitive tokens, and keep admin visibility limited.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {securityFeatures.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Why FleetOS?</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                Most tools just show you data.
                <span className="block text-sky-300">FleetOS turns data into action.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                The FleetOS AI agent watches telemetry, owner economics, maintenance signals, and schedule constraints, then turns them into practical workflows you can review and approve.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {capabilities.map(([title, detail]) => (
                <article key={title} className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
                  <h2 className="text-lg font-black text-white">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Fleet Health & Maintenance
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
              Built for robotaxis that need to stay earning.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Your AI agent watches vehicle health 24/7 and helps you stay ahead of issues that kill earnings. FleetOS turns Tesla telemetry, owner records, cleaning status, and service history into a practical maintenance plan.
            </p>
            <div className="mt-6 grid gap-2">
              {maintenanceOutcomes.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/40" />
                  <span className="text-sm font-bold text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm font-black leading-6 text-emerald-200">
              Result: higher uptime, lower long-term costs, and more profit per vehicle.
            </p>
            <div className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Example Agent Alerts</p>
              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-200">
                {[
                  'Tire pressure low on vehicle OCE - recommend inflate within 48h.',
                  'Service recommended in 1,200 miles - schedule during low-demand window.',
                  'Cabin cleanliness score degraded - suggest cleaning before next rental.',
                ].map((alert) => (
                  <p key={alert} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">What FleetOS predicts first</p>
              <div className="mt-4 space-y-3">
                {predictiveMaintenancePriorities.map(([priority, component, why, leadTime, dataNeeded]) => (
                  <article key={component} className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-4 lg:grid-cols-[44px_0.9fr_1fr_0.65fr_1.2fr] lg:items-start">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-300 text-sm font-black text-slate-950">
                      {priority}
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{component}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Priority</p>
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{why}</p>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">Lead Time</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{leadTime}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-300">Tesla Data Needed</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{dataNeeded}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {maintenanceFeatures.map(([title, detail]) => (
                <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
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

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
              Tesla API Strategy
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
              Built to respect rate limits, wakes, and owner control.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              A serious robotaxi fleet tool cannot have an overactive agent hammering vehicle APIs. FleetOS is being designed around telemetry streaming, wake minimization, command cooldowns, and explicit approval for sensitive actions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {teslaBestPractices.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Beta Onboarding
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-white">
              Start with one Tesla free. Add more when FleetOS is managing real work.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Invited beta users can create an account, approve telemetry consent, connect Tesla, and sync their first vehicle from one guided setup flow.
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

          <div className="rounded-lg border border-white/10 bg-slate-900/80 p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Ready when invited</p>
            <h3 className="mt-3 text-3xl font-black text-white">Guided setup replaces lead capture.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              FleetOS no longer asks beta users to join a waitlist from the homepage. The primary action is now direct onboarding with secure account creation and Tesla owner consent.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="mt-6 w-full rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
            >
              Start Free Setup
            </button>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              First Tesla free during beta. Additional vehicles require a paid entitlement before production use.
            </p>
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
