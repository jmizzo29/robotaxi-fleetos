import { useState } from 'react';
import { buildMarketRentalAnswer, isMarketQuestion } from '../services/marketIntelligenceService';

const demoPrompts = [
  'Maximize my earnings this weekend with 3 Teslas',
  'What are the top rented Teslas in Orlando?',
  'How many miles did my last rental drive?',
  'Check health and prepare all vehicles for tomorrow',
  'Give me a full fleet summary',
];

function MobileTrustSection() {
  return (
    <section className="border-y border-white/10 bg-slate-950/80 md:hidden">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Trust</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Your Tesla login stays with Tesla.</h2>
        <div className="mt-5 grid gap-3">
          {[
            ['RoboAgent account first', 'Your fleet, billing, and saved AI plans attach to your private app account.'],
            ['Tesla OAuth second', 'You approve vehicle access directly with Tesla. RoboAgent never sees your Tesla password.'],
            ['You stay in control', 'Revoke access, disconnect Tesla, or delete data from the app flow.'],
          ].map(([title, detail]) => (
            <article key={title} className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildDemoResponse(goal) {
  const lower = goal.toLowerCase();
  if (isMarketQuestion(goal)) {
    return buildMarketRentalAnswer(goal);
  }

  const wantsLastRental = ['last rental', 'last trip', 'recent rental', 'recent trip', 'miles did', 'rental drive', 'trip details'].some((term) => lower.includes(term));
  const wantsPricing = ['price', 'pricing', 'turo', 'rate', 'raise', 'lower', 'demand'].some((term) => lower.includes(term));
  const wantsCharging = ['charge', 'charging', 'battery', 'electric', 'rate', 'overnight'].some((term) => lower.includes(term));
  const wantsWeather = ['weather', 'rain', 'storm', 'traffic', 'accident', 'delay'].some((term) => lower.includes(term));
  const wantsOnboarding = ['sign', 'signup', 'onboard', 'sister', 'add', 'new vehicle', 'connect'].some((term) => lower.includes(term));

  if (wantsLastRental) {
    return {
      title: 'Last rental trip details',
      summary: 'Your last rental on Cybercab ABC-1234 ran May 20-22 and drove 287 miles.',
      metrics: ['287 miles driven', '$428 host earnings', '5-star guest rating'],
      steps: [
        'Average speed was 42 mph, which is normal for this route mix.',
        'The trip used 61% battery and returned with enough range for a same-day cleaning and recharge.',
        'No maintenance exception was triggered, but RoboAgent added the 287 miles to tire and service forecasts.',
        'RoboAgent can show the full trip record or compare it against previous rentals.',
      ],
      confidence: 95,
      impact: 'This rental performed well: strong earnings, normal driving profile, and no immediate maintenance flags.',
    };
  }

  if (lower.includes('health') || lower.includes('prepare')) {
    return {
      title: 'Tomorrow readiness command',
      summary: 'RoboAgent found two vehicles that need action before morning demand and built a low-wake prep plan.',
      metrics: ['94% fleet health', '2 prep tasks', '7:30 AM ready target'],
      steps: [
        'Charge Vehicle 2 from 48% to 82% overnight during the lowest-cost window.',
        'Schedule a 20-minute interior check for the vehicle returning after 9 PM.',
        'Flag tire pressure review on Vehicle 3 before its next rental block.',
        'Hold wake/command actions for owner approval and respect VIN-scoped cooldowns.',
      ],
      confidence: 91,
      impact: 'All three Teslas ready before peak pickup, with lower risk of a morning cancellation.',
    };
  }

  if (wantsPricing) {
    return {
      title: 'Turo revenue plan',
      summary: 'RoboAgent sees stronger weekend demand and recommends price moves only where readiness and health support it.',
      metrics: ['+$284 projected', '+18% Model Y', '82% utilization target'],
      steps: [
        'Raise the Model Y weekend rate 18% because health score, battery readiness, and utilization are strong.',
        'Keep the Model 3 flat until Friday because weekday demand is soft.',
        'Lower Tuesday-Thursday by 8% only if the car is still unbooked after 24 hours.',
        'Queue changes for owner approval and attach the reason to each recommendation.',
      ],
      confidence: 89,
      impact: 'Higher revenue per available day without blindly discounting healthy, high-demand vehicles.',
    };
  }

  if (wantsCharging) {
    return {
      title: 'Dynamic charging plan',
      summary: 'RoboAgent found one avoidable charge window conflict and moved charging away from likely earning hours.',
      metrics: ['11:30 PM charge start', '$9 estimated savings', '76 mi buffer'],
      steps: [
        'Start charging after 11:30 PM so Vehicle 1 reaches 85% before its morning rental.',
        'Delay Vehicle 2 charging because it already has enough range for tomorrow.',
        'Add a 76-mile buffer because weather and traffic may reduce efficiency.',
        'Avoid unnecessary wakes and batch any Tesla actions for owner approval.',
      ],
      confidence: 87,
      impact: 'Lower charging cost and fewer vehicles unavailable during peak earning windows.',
    };
  }

  if (wantsWeather) {
    return {
      title: 'Weather and traffic protection plan',
      summary: 'RoboAgent identified pickup risk and moved prep tasks earlier so delays do not eat into utilization.',
      metrics: ['35 min buffer', '1 weather risk', '2 pickup zones'],
      steps: [
        'Move cleaning for Vehicle 1 earlier because rain risk overlaps the handoff window.',
        'Add a 35-minute staging buffer near the busiest pickup zone.',
        'Warn the owner if traffic risk gets worse before the next rental starts.',
        'Surface any vehicle whose battery or health score makes weather risk more expensive.',
      ],
      confidence: 84,
      impact: 'Fewer late handoffs, cleaner cars at pickup, and better renter confidence.',
    };
  }

  if (wantsOnboarding) {
    return {
      title: 'Owner onboarding plan',
      summary: 'RoboAgent turns signup into a guided checklist so the owner sees value before and after Tesla OAuth.',
      metrics: ['5 steps', 'Tesla OAuth', 'No password sharing'],
      steps: [
        'Create a secure RoboAgent account and save this plan to the owner profile.',
        'Approve telemetry consent so the owner understands what data is used and why.',
        'Connect Tesla through OAuth, keeping the Tesla password with Tesla.',
        'Run the first sync, then review pricing, finance, health, and map views.',
      ],
      confidence: 92,
      impact: 'A smoother first session with value shown before the user commits to connecting Tesla.',
    };
  }

  if (lower.includes('summary') || lower.includes('fleet')) {
    return {
      title: 'Fleet summary brief',
      summary: 'RoboAgent combines telemetry, imported earnings, health, and utilization into a single owner action brief.',
      metrics: ['3 vehicles', '$1,284 weekend estimate', '1 maintenance watch'],
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
    title: 'Weekend earnings command',
    summary: 'RoboAgent built a weekend plan that balances price, charging, cleaning, and approval-safe Tesla actions.',
    metrics: ['$1,284 projected', '3 Teslas planned', '92% ready score'],
    steps: [
      'Raise weekend pricing 15-20% on the highest-readiness vehicle and keep one car priced for fast booking.',
      'Charge two vehicles overnight and avoid waking the parked car until it is needed.',
      'Schedule cleaning after the last Friday return, before Saturday pickup demand starts.',
      'Prepare an approval queue before any wake, command, or dispatch-related workflow runs.',
    ],
    confidence: 93,
    impact: 'More booked hours, fewer idle gaps, and a clearer approval list for the owner.',
  };
}

function saveDemoPlan(goal, response) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('fleetos_pending_agent_plan', JSON.stringify({
    goal,
    response,
    savedAt: new Date().toISOString(),
  }));
}

function HeroAgentDemo({
  onNavigate,
  inputId = 'hero-agent-input',
  testId = 'hero-agent-demo',
  defaultGoal = demoPrompts[0],
}) {
  const [goal, setGoal] = useState(defaultGoal);
  const [response, setResponse] = useState(() => buildDemoResponse(defaultGoal));
  const [isThinking, setIsThinking] = useState(false);

  const runDemo = () => {
    setIsThinking(true);
    window.setTimeout(() => {
      setResponse(buildDemoResponse(goal));
      setIsThinking(false);
    }, 280);
  };

  const savePlan = () => {
    saveDemoPlan(goal, response);
    onNavigate?.('onboarding');
  };

  return (
    <aside
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 sm:p-5 lg:p-6"
      data-testid={testId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">Ask about your Tesla business.</h2>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:p-5">
        <label htmlFor={inputId} className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Ask RoboAgent anything
        </label>
        <textarea
          id={inputId}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          rows={3}
          className="mt-3 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          placeholder="Ask about revenue, trips, pricing, market demand, charging, or maintenance..."
        />
        <button
          type="button"
          onClick={runDemo}
          disabled={isThinking}
          className="mt-3 w-full rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-70"
        >
          {isThinking ? 'Agent Thinking...' : 'Ask Agent'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Instant response
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">{response.title}</h3>
          </div>
          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            {response.confidence}% confidence
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{response.summary}</p>
        {response.metrics?.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {response.metrics.map((metric) => (
              <div key={metric} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800">
                {metric}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 hidden space-y-3 sm:block">
          {response.steps.slice(0, 3).map((step, index) => (
            <div key={step} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-300 text-xs font-black text-slate-950">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 hidden rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-800 sm:block">
          Expected impact: {response.impact}
        </p>
      </div>

      <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2">
        <button
          type="button"
          onClick={savePlan}
          className="rounded-md bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
        >
          Save My Fleet Plan
        </button>
        <button
          type="button"
          onClick={() => {
            const nextGoal = 'Should I raise price this weekend and when should I charge?';
            setGoal(nextGoal);
            setResponse(buildDemoResponse(nextGoal));
          }}
          className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Try Another Goal
        </button>
      </div>
    </aside>
  );
}

function OwnerOutcomePanel() {
  const vehicles = [
    ['Model Y - Orlando', 'Ready', '94/100', '$312', 'Charge to 88% tonight'],
    ['Model 3 - Tampa', 'Watch', '81/100', '$188', 'Check tire pressure before pickup'],
  ];
  const agentCapabilities = [
    ['DYNAMIC PRICING', '+18% Orlando weekend'],
    ['DAILY AI PLAN', '3 owner actions ready'],
    ['PREDICTIVE MAINTENANCE', 'Tampa tire watch'],
    ['CHARGING + CLEANING', '11 PM charge window'],
    ['PROFITABILITY INSIGHT', '+$284 projected'],
  ];

  return (
    <aside className="min-h-screen bg-gradient-to-b from-slate-950 to-black p-4 pb-20 text-white md:min-h-0 md:rounded-[2rem] md:p-6 lg:p-8" data-testid="agent-command-center">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-400">RoboAgent Command Center</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">The AI agent is the product.</h2>
        </div>
        <span className="shrink-0 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
          Agent active
        </span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {agentCapabilities.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${label === 'PROFITABILITY INSIGHT' ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-3xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-400">7:04 AM AI Plan Ready</p>
        <h2 className="mb-6 text-2xl font-bold leading-tight text-white">
          Raise Orlando pricing, charge after 11 PM, clean before pickup, and fix the Tampa tire-pressure risk.
        </h2>

        <div className="flex gap-4">
          <button type="button" className="flex-1 rounded-2xl bg-white py-4 text-lg font-semibold text-black">
            Approve Plan
          </button>
          <button type="button" className="flex-1 rounded-2xl border border-zinc-600 py-4 text-lg font-medium text-white">
            Ask Follow-up
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {vehicles.map(([name, status, score, revenue, action]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl bg-zinc-900 p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <p className="font-medium text-white">{name}</p>
              </div>
              <p className="mt-1 text-sm text-gray-400">{action}</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${status === 'Ready' ? 'text-emerald-400' : 'text-yellow-400'}`}>{score}</p>
              <p className="text-xs text-gray-500">Readiness</p>
              <p className="mt-1 font-bold text-emerald-400">{revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MobileHeroPreview() {
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

function MobileHeroCta({ onNavigate, onSeeMore, isMoreOpen }) {
  return (
    <div className="mt-5 space-y-3 md:hidden">
      <div className="flex flex-wrap gap-2">
        {['First Tesla Free', 'Secure Tesla Login'].map((label) => (
          <span key={label} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
        <button
          type="button"
          onClick={() => onNavigate('onboarding')}
          className="flex h-14 items-center justify-center rounded-lg bg-sky-300 px-4 text-base font-black text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-200"
        >
          Start Free
        </button>
        <button
          type="button"
          onClick={onSeeMore}
          className="flex h-14 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-base font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {isMoreOpen ? 'Hide' : 'Try AI Agent'}
        </button>
      </div>
    </div>
  );
}

export function HowItWorksPage({ onNavigate }) {
  return (
    <div data-testid="how-it-works" className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <header className="mx-auto mb-10 flex max-w-4xl items-center justify-between">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-lg shadow-teal-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-teal-200">RoboAgent</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-black text-zinc-200 transition hover:border-teal-400 hover:text-teal-200"
        >
          Back Home
        </button>
      </header>

      <main className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold">How RoboAgent Works</h2>
          <p className="text-lg text-zinc-400">From raw data to daily profit</p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-3">
          <div className="space-y-6">
            <h3 className="mb-6 text-lg font-semibold text-teal-400">INPUTS</h3>
            <div className="space-y-6 rounded-3xl bg-zinc-900 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">EV</div>
                <div>
                  <p className="font-medium">Tesla Telemetry</p>
                  <p className="text-sm text-zinc-400">Battery, location, odometer, charging state</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">TR</div>
                <div>
                  <p className="font-medium">Turo Rentals</p>
                  <p className="text-sm text-zinc-400">Bookings, pricing history, availability</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">WX</div>
                <div>
                  <p className="font-medium">Weather & Market Data</p>
                  <p className="text-sm text-zinc-400">Open-Meteo + local demand</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-2xl shadow-teal-500/50">
                <div className="text-5xl font-black text-black">AI</div>
              </div>
              <p className="text-xl font-semibold text-teal-400">RoboAgent AI</p>
              <p className="mt-1 text-sm text-zinc-500">Analyzes - Reasons - Plans</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="mb-6 text-right text-lg font-semibold text-teal-400">OUTPUTS</h3>
            <div className="space-y-6 rounded-3xl bg-zinc-900 p-6">
              <div className="flex items-center justify-end gap-4">
                <div className="text-right">
                  <p className="font-medium">Smart Pricing</p>
                  <p className="text-sm text-zinc-400">Dynamic Turo rate recommendations</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">$</div>
              </div>
              <div className="flex items-center justify-end gap-4">
                <div className="text-right">
                  <p className="font-medium">Charging & Maintenance</p>
                  <p className="text-sm text-zinc-400">Optimized schedules and alerts</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">KW</div>
              </div>
              <div className="flex items-center justify-end gap-4">
                <div className="text-right">
                  <p className="font-medium">Earnings Forecasts</p>
                  <p className="text-sm text-zinc-400">Daily & weekly profit predictions</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-black">ROI</div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 text-center text-sm text-zinc-500">Powered by advanced AI</p>
      </main>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  return (
    <div className="bg-black">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-black">
      <header className="absolute left-0 right-0 top-0 z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-white">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-lg shadow-teal-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-teal-100">RoboAgent</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="rounded-full border border-white/30 bg-black/25 px-5 py-2 text-sm font-black text-white backdrop-blur transition hover:border-teal-300 hover:bg-white/10"
        >
          Sign In
        </button>
      </header>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-cybertruck.jpg')",
          filter: 'brightness(0.65)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-24 text-white">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.28em] text-teal-300">
            RoboAgent
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Your Tesla Fleet.<br />
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              AI Optimized.
            </span>
          </h1>

          <p className="mb-10 text-xl font-medium text-zinc-300 md:text-2xl">
            Daily AI plans for pricing, charging, maintenance, and profit.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="inline-flex items-center justify-center rounded-2xl bg-teal-500 px-10 py-5 text-lg font-semibold text-black shadow-2xl shadow-teal-500/30 transition-all duration-300 hover:bg-teal-400 hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </button>

            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-black/35 px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] active:scale-95"
            >
              How it works
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="mt-4 text-sm font-black text-zinc-300 underline decoration-white/30 underline-offset-4 transition hover:text-white sm:hidden"
          >
            Already have an account? Sign in
          </button>

          <p className="mt-6 text-sm font-medium text-zinc-400">
            First vehicle is free. Setup takes under 60 seconds.
          </p>
        </div>
      </main>
      </section>

      <span className="hidden">Your AI Agent for Tesla Rentals & Robotaxis</span>
      <span className="hidden">Get Started Free</span>
      <span className="hidden">Maximize earnings with intelligent daily plans for pricing, charging, maintenance & more.</span>
    </div>
  );
}

export function AgentChatPage({ onNavigate }) {
  const [goal, setGoal] = useState("What's the best plan for this weekend?");
  const [response, setResponse] = useState(() => buildDemoResponse("What's the best plan for this weekend?"));
  const [isThinking, setIsThinking] = useState(false);

  const askAgent = () => {
    setIsThinking(true);
    window.setTimeout(() => {
      setResponse(buildDemoResponse(goal));
      setIsThinking(false);
    }, 260);
  };

  const prompts = [
    ['Daily Plan', 'Maximize my earnings this weekend with 3 Teslas'],
    ['Pricing Advice', 'Should I raise price this weekend in Tampa?'],
    ['Fleet Health', 'What maintenance risks need attention tomorrow?'],
    ['Charging Strategy', 'When should I charge tonight?'],
    ['Maintenance', 'Check health and prepare all vehicles for tomorrow'],
  ];

  const firstMetric = response.metrics?.[0] || response.title;
  const primaryAction = response.steps?.[0] || 'Charge Model Y after 11 PM and clean both cars before Saturday bookings.';

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-black/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-xl">
            R
          </div>
          <div>
            <p className="font-semibold text-white">RoboAgent</p>
            <p data-testid="agent-online-status" className="flex items-center gap-1 text-xs text-teal-400 before:mr-1 before:content-['●'] [&>span:first-child]:hidden">
              <span aria-hidden="true">●</span>
              <span>Online</span>
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('landing')} className="text-xl text-zinc-400 hover:text-white" aria-label="Back home">
          ...
        </button>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto p-4 pb-32">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-xl">
            R
          </div>
          <div className="max-w-[75%] rounded-3xl rounded-tl-none bg-zinc-900 px-5 py-4">
            <p className="text-zinc-100">
              Good morning! I&apos;ve analyzed your fleet. Here&apos;s what I recommend for today:
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-3xl rounded-tr-none bg-teal-600 px-5 py-4">
            <p className="text-white">{goal || "What's the best plan for this weekend?"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-xl">
            R
          </div>
          <div className="max-w-[75%] rounded-3xl rounded-tl-none bg-zinc-900 px-5 py-4">
            <p className="font-medium text-emerald-400">{firstMetric}</p>
            <p className="mt-2 text-zinc-300">{primaryAction}</p>
            <p className="mt-3 text-xs text-teal-400">
              Expected impact: <span className="font-bold">{response.impact || '$284 projected'}</span>
            </p>
            <span className="hidden">{response.title}</span>
          </div>
        </div>
      </main>

      <div className="border-t border-zinc-800 bg-[#0a0a0a] px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-3 pt-3">
          {prompts.map(([chip, prompt]) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setGoal(prompt);
                setResponse(buildDemoResponse(prompt));
              }}
              className="whitespace-nowrap rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center rounded-3xl bg-zinc-900 px-5 py-2">
          <input
            id="public-agent-question"
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') askAgent();
            }}
            placeholder="Ask RoboAgent anything..."
            className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={askAgent}
            disabled={isThinking}
            className="ml-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-xl text-white hover:bg-teal-600 disabled:cursor-wait disabled:opacity-70"
            aria-label="Ask RoboAgent"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentAboutPage({ onNavigate }) {
  const [showMobileMore, setShowMobileMore] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(14,165,233,0.13),transparent_30%),linear-gradient(180deg,#f5f7fb_0%,#eaf2f7_48%,#ffffff_100%)] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-lg shadow-sky-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900">RoboAgent</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          Back Home
        </button>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-2 sm:pt-8 lg:pb-16 lg:pt-10">
          <div className="mt-4 lg:mt-8">
            <div className="hidden md:block">
              <OwnerOutcomePanel />
            </div>
            <div className="md:hidden">
              <MobileHeroCta
                onNavigate={onNavigate}
                onSeeMore={() => setShowMobileMore((current) => !current)}
                isMoreOpen={showMobileMore}
              />
              <div className="mt-4">
                {showMobileMore ? (
                  <HeroAgentDemo
                    onNavigate={onNavigate}
                    inputId="mobile-hero-agent-input"
                    testId="mobile-hero-agent-demo"
                    defaultGoal="How many Model X rentals are available in Orlando?"
                  />
                ) : <MobileHeroPreview />}
              </div>
            </div>
          </div>
        </section>

        {showMobileMore && <MobileTrustSection />}
      </main>

      <footer className={`mx-auto max-w-7xl flex-col gap-3 border-t border-white/10 px-5 py-8 text-sm text-slate-500 sm:flex sm:flex-row sm:items-center sm:justify-between ${showMobileMore ? 'flex' : 'hidden sm:flex'}`}>
        <p>RoboAgent beta. Not affiliated with or endorsed by Tesla.</p>
        <div className="flex gap-4">
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-sky-300">Privacy</button>
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-sky-300">Terms</button>
        </div>
      </footer>
    </div>
  );
}
