import { useState } from 'react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
import { buildMarketRentalAnswer, isMarketQuestion } from '../services/marketIntelligenceService';

const demoPrompts = [
  'Maximize my earnings this weekend with 3 Teslas',
  'What are the top rented Teslas in Orlando?',
  'How many miles did my last rental drive?',
  'Check health and prepare all vehicles for tomorrow',
  'Give me a full fleet summary',
];

function waitForClerk(timeoutMs = 1200) {
  if (!isClerkConfigured() || typeof window === 'undefined') return Promise.resolve(null);
  if (window.Clerk?.loaded) return Promise.resolve(window.Clerk);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.Clerk?.loaded) {
        window.clearInterval(timer);
        resolve(window.Clerk);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 50);
  });
}

async function openDirectSignIn(onNavigate) {
  const clerk = await waitForClerk();
  const redirectUrl = `${window.location.origin}/#/onboarding`;

  if (clerk?.openSignIn) {
    await clerk.openSignIn({
      fallbackRedirectUrl: redirectUrl,
      signInFallbackRedirectUrl: redirectUrl,
      signUpFallbackRedirectUrl: redirectUrl,
    });
    return;
  }

  onNavigate?.('account');
}

function MobileTrustSection() {
  return (
    <section className="border-y border-white/10 bg-slate-950/80 md:hidden">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Trust</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Your Tesla login stays with Tesla.</h2>
        <div className="mt-5 grid gap-3">
          {[
            ['ROBOAGENT account first', 'Your fleet, billing, and saved AI plans attach to your private app account.'],
            ['Tesla OAuth second', 'You approve vehicle access directly with Tesla. ROBOAGENT never sees your Tesla password.'],
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
        'No maintenance exception was triggered, but ROBOAGENT added the 287 miles to tire and service forecasts.',
        'ROBOAGENT can show the full trip record or compare it against previous rentals.',
      ],
      confidence: 95,
      impact: 'This rental performed well: strong earnings, normal driving profile, and no immediate maintenance flags.',
    };
  }

  if (lower.includes('health') || lower.includes('prepare')) {
    return {
      title: 'Tomorrow readiness command',
      summary: 'ROBOAGENT found two vehicles that need action before morning demand and built a low-wake prep plan.',
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
      summary: 'ROBOAGENT sees stronger weekend demand and recommends price moves only where readiness and health support it.',
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
      summary: 'ROBOAGENT found one avoidable charge window conflict and moved charging away from likely earning hours.',
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
      summary: 'ROBOAGENT identified pickup risk and moved prep tasks earlier so delays do not eat into utilization.',
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
      summary: 'ROBOAGENT turns signup into a guided checklist so the owner sees value before and after Tesla OAuth.',
      metrics: ['5 steps', 'Tesla OAuth', 'No password sharing'],
      steps: [
        'Create a secure ROBOAGENT account and save this plan to the owner profile.',
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
      summary: 'ROBOAGENT combines telemetry, imported earnings, health, and utilization into a single owner action brief.',
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
    summary: 'ROBOAGENT built a weekend plan that balances price, charging, cleaning, and approval-safe Tesla actions.',
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
          Ask ROBOAGENT anything
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
          <p className="text-sm font-bold uppercase text-teal-400">ROBOAGENT Command Center</p>
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
  const actions = [
    ['Price', 'Raise Orlando weekend rate', '9:00 AM'],
    ['Charge', 'Start Model Y after 11 PM', '11:00 PM'],
    ['Clean', 'Schedule pre-pickup detail', '2:30 PM'],
    ['Health', 'Check Tampa tire pressure', '7:15 AM'],
  ];
  const pricing = [
    ['Model Y', '$118', 'Ready'],
    ['Model 3', '$92', 'Watch'],
    ['Model S', '$142', 'Ready'],
  ];

  return (
    <div data-testid="how-it-works" className="min-h-screen bg-[#f7f7f5] px-5 py-6 text-[#141b27] sm:px-6 sm:py-8">
      <header className="mx-auto mb-6 flex max-w-7xl items-center justify-between">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <RoboLogo className="h-8 w-8" />
          <RoboWordmark className="text-lg" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="rounded-full border border-[#141b27]/10 bg-white px-4 py-2 text-sm font-black text-[#172231] shadow-sm transition hover:bg-slate-100"
        >
          Back Home
        </button>
      </header>

      <main className="mx-auto max-w-7xl">
        <section className="grid min-h-[calc(100vh-112px)] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase text-slate-500">How ROBOAGENT Works</p>
            <h1 className="mt-4 text-4xl font-medium leading-tight text-black sm:text-5xl lg:text-6xl">
              From raw fleet data to a daily owner plan.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              ROBOAGENT reads Tesla telemetry, rental context, market signals, and vehicle health, then turns it into pricing, charging, cleaning, and maintenance actions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openDirectSignIn(onNavigate)}
                className="rounded-lg bg-[#172231] px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#243044]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="rounded-lg border border-[#141b27]/10 bg-white px-6 py-4 text-sm font-black text-[#172231] shadow-sm transition hover:bg-slate-100"
              >
                Start Setup
              </button>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-[#141b27]/10 bg-white/72 p-4 shadow-2xl shadow-slate-900/10 sm:p-6 lg:min-h-[620px]">
            <div className="absolute inset-x-6 bottom-10 h-px bg-slate-200" />
            <div className="absolute bottom-10 left-[13%] right-[30%] h-px origin-left rotate-[-12deg] bg-sky-200" />
            <div className="absolute bottom-10 left-[32%] right-[23%] h-px origin-left rotate-[9deg] bg-sky-200" />

            <div className="absolute left-2 top-20 grid w-[46%] grid-cols-2 gap-3 sm:left-5 sm:top-28">
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`relative h-20 rounded-[44%_56%_47%_53%/56%_46%_54%_44%] bg-[#151b25] shadow-xl shadow-slate-900/20 ${
                    item === 0 ? 'translate-y-10 -rotate-6' : ''
                  } ${item === 1 ? 'translate-y-0 rotate-3' : ''} ${item === 2 ? '-translate-y-1 rotate-2' : ''} ${
                    item === 3 ? '-translate-y-4 -rotate-3' : ''
                  } ${item === 4 ? '-translate-y-10 rotate-4' : ''}`}
                >
                  <div className="absolute left-[14%] top-[28%] h-[34%] w-[42%] rounded-t-2xl bg-slate-600/40" />
                  <div className="absolute bottom-2 left-4 h-3 w-3 rounded-full border-2 border-slate-300 bg-slate-900" />
                  <div className="absolute bottom-2 right-4 h-3 w-3 rounded-full border-2 border-slate-300 bg-slate-900" />
                  <div className="absolute right-2 top-8 h-1.5 w-8 rounded-full bg-sky-200/70" />
                </div>
              ))}
            </div>

            <div className="absolute left-[37%] top-[44%] flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-3xl border border-sky-100 bg-white shadow-2xl shadow-sky-300/30">
              <div className="-rotate-45 text-4xl font-black text-[#3b63ff]">AI</div>
            </div>

            <section className="absolute right-4 top-10 w-[48%] rotate-3 rounded-2xl border border-[#141b27]/10 bg-white/95 p-4 shadow-2xl shadow-slate-900/12 backdrop-blur sm:right-8 sm:top-14 sm:w-[47%] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Daily Plan</p>
                  <h2 className="mt-1 text-xl font-black text-black">Approve today</h2>
                </div>
                <RoboLogo className="h-8 w-8" />
              </div>

              <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 text-center sm:grid-cols-4">
                {[
                  ['Actions', '24'],
                  ['Confirmed', '18'],
                  ['Pending', '6'],
                  ['Success', '75%'],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-b border-slate-200 px-2 py-3 even:border-r-0 last:border-b-0 sm:border-b-0 sm:even:border-r sm:last:border-r-0">
                    <p className="text-[8px] font-black uppercase text-slate-400 sm:text-[9px] sm:tracking-[0.12em]">{label}</p>
                    <p className="mt-1 text-lg font-black text-black">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Action Queue</p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {actions.map(([type, action, time]) => (
                      <div key={action} className="grid grid-cols-[44px_1fr] items-center gap-2 px-3 py-2 text-xs sm:grid-cols-[54px_1fr_auto]">
                        <span className="font-black text-slate-500">{type}</span>
                        <span className="truncate font-semibold text-slate-800">{action}</span>
                        <span className="hidden text-slate-400 sm:inline">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Pricing</p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {pricing.map(([model, price, status]) => (
                      <div key={model} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-800">{model}</span>
                        <span className="font-black text-black">{price}</span>
                        <span className="text-slate-400">{status}</span>
                        <span className="text-right text-emerald-600">Ready</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-20 rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] p-2">
                    <div className="h-full rounded-lg border border-sky-200 bg-white">
                      <svg viewBox="0 0 140 70" className="h-full w-full" aria-hidden="true">
                        <path d="M15 52 42 44 58 50 76 24 105 18 124 28" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 53h112" stroke="#dbeafe" strokeWidth="1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="rounded-md bg-[#172231] px-4 py-2 text-xs font-black text-white">
                  Approve All
                </button>
                <button type="button" className="rounded-md border border-[#141b27]/10 px-4 py-2 text-xs font-black text-slate-700">
                  Inspect All
                </button>
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-3 pb-8 sm:grid-cols-3">
          {[
            ['Inputs', 'Tesla telemetry, rental history, weather, and market context.'],
            ['Reasoning', 'ROBOAGENT ranks what will increase earnings and reduce risk.'],
            ['Output', 'A simple daily plan you can approve, inspect, or ignore.'],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-2xl border border-[#141b27]/10 bg-white/85 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#141b27]">
      <section className="grid min-h-screen place-items-center px-6 py-10">
        <main className="w-full max-w-3xl text-center">
          <RoboLogo className="mx-auto h-24 w-24 sm:h-28 sm:w-28" />
          <p className="mt-3 text-2xl sm:text-3xl">
            <RoboWordmark />
          </p>

          <h1 className="mx-auto mt-16 max-w-3xl text-4xl font-medium leading-tight text-black sm:text-5xl md:text-6xl">
            Autonomous AI Agents to maximize your Tesla rentals and robotaxis
          </h1>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-10">
            <button
              type="button"
              onClick={() => openDirectSignIn(onNavigate)}
              className="min-h-14 rounded-2xl px-8 text-xl font-semibold text-black transition hover:bg-black/5 active:scale-[0.99]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="min-h-14 rounded-lg bg-[#172231] px-10 text-xl font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#0e1724] active:scale-[0.99]"
            >
              Learn how in 9 seconds
            </button>
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
    <div className="flex min-h-screen flex-col bg-[#f7f7f5] text-[#141b27]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#141b27]/10 bg-white/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <RoboLogo className="h-10 w-10 shrink-0" />
          <div>
            <p className="text-lg">
              <RoboWordmark />
            </p>
            <p data-testid="agent-online-status" className="flex items-center gap-1 text-xs text-teal-400 before:mr-1 before:content-['●'] [&>span:first-child]:hidden">
              <span aria-hidden="true">●</span>
              <span>Online</span>
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('landing')} className="text-xl text-slate-500 hover:text-black" aria-label="Back home">
          ...
        </button>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto p-4 pb-32">
        <div className="flex gap-3">
          <RoboLogo className="h-9 w-9 shrink-0" />
          <div className="max-w-[75%] rounded-3xl rounded-tl-none border border-[#141b27]/10 bg-white px-5 py-4 shadow-sm">
            <p className="text-slate-700">
              Good morning! I&apos;ve analyzed your fleet. Here&apos;s what I recommend for today:
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-3xl rounded-tr-none bg-[#172231] px-5 py-4">
            <p className="text-white">{goal || "What's the best plan for this weekend?"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <RoboLogo className="h-9 w-9 shrink-0" />
          <div className="max-w-[75%] rounded-3xl rounded-tl-none border border-[#141b27]/10 bg-white px-5 py-4 shadow-sm">
            <p className="font-medium text-[#141b27]">{firstMetric}</p>
            <p className="mt-2 text-slate-600">{primaryAction}</p>
            <p className="mt-3 text-xs text-slate-500">
              Expected impact: <span className="font-bold">{response.impact || '$284 projected'}</span>
            </p>
            <span className="hidden">{response.title}</span>
          </div>
        </div>
      </main>

      <div className="border-t border-[#141b27]/10 bg-[#f7f7f5] px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-3 pt-3">
          {prompts.map(([chip, prompt]) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setGoal(prompt);
                setResponse(buildDemoResponse(prompt));
              }}
              className="whitespace-nowrap rounded-2xl border border-[#141b27]/10 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#141b27]/10 bg-white p-4">
        <div className="flex items-center rounded-3xl border border-[#141b27]/10 bg-slate-50 px-5 py-2">
          <input
            id="public-agent-question"
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') askAgent();
            }}
            placeholder="Ask ROBOAGENT anything..."
            className="flex-1 bg-transparent text-[#141b27] outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={askAgent}
            disabled={isThinking}
            className="ml-3 flex h-10 min-w-16 items-center justify-center rounded-2xl bg-[#172231] px-4 text-sm font-black text-white hover:bg-[#243044] disabled:cursor-wait disabled:opacity-70"
            aria-label="Ask ROBOAGENT"
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
          <RoboLogo className="h-8 w-8" />
          <RoboWordmark className="text-lg" />
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
        <p>ROBOAGENT beta. Not affiliated with or endorsed by Tesla.</p>
        <div className="flex gap-4">
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-sky-300">Privacy</button>
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-sky-300">Terms</button>
        </div>
      </footer>
    </div>
  );
}
