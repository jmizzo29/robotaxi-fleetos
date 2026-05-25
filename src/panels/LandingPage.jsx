import { useState } from 'react';
import { SignInButton } from '@clerk/react';
import { useFleetAuthStatus } from '../auth/FleetAuthContext';
import { isClerkConfigured } from '../auth/clerkConfig';
import { buildMarketRentalAnswer, isMarketQuestion } from '../services/marketIntelligenceService';

const trustPoints = [
  ['Secure account login', 'RoboAgent uses managed identity with verified sessions before any Tesla connection can be attached.'],
  ['Tesla password never shared', 'Owners authenticate directly with Tesla. RoboAgent never asks for or stores Tesla account passwords.'],
  ['Encrypted access tokens', 'Tesla connection tokens are encrypted server-side and tied to the signed-in RoboAgent user.'],
  ['Owner-controlled data', 'Users can disconnect Tesla, revoke consent, or request deletion of RoboAgent data.'],
];

const pricing = [
  {
    plan: 'Starter',
    price: 'Free',
    bestFor: 'Testing with 1 Tesla',
    features: ['Live telemetry', 'AI brief', 'Basic earnings estimates', 'Health alerts'],
    note: 'Limited to one Tesla during beta. Multi-vehicle history, cleaning scheduler, and advanced workflows require Owner Fleet.',
  },
  {
    plan: 'Owner Fleet',
    price: '$12 / Tesla / mo',
    bestFor: 'Turo hosts & small fleets (2-10 vehicles)',
    features: ['Multi-vehicle dashboard', 'Predictive maintenance', 'Cleaning scheduler', 'Full history'],
    popular: true,
  },
  {
    plan: 'Operator Pro',
    price: 'Custom',
    bestFor: 'Serious operators & growing fleets',
    features: ['Advanced AI workflows', 'Dispatch planning', 'Team access', 'Priority support', 'API access'],
  },
];

const demoPrompts = [
  'Maximize my earnings this weekend with 3 Teslas',
  'What are the top rented Teslas in Orlando?',
  'How many miles did my last rental drive?',
  'Check health and prepare all vehicles for tomorrow',
  'Give me a full fleet summary',
];

function PricingSection({ onStart }) {
  return (
    <section id="pricing" className="hidden scroll-mt-8 border-y border-white/10 bg-white/[0.03] md:block">
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Pricing
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-4xl">
              Simple, fair pricing.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:mt-4 md:leading-7">
              Start free with one Tesla during beta. Add vehicles only when RoboAgent starts saving real operator time.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="rounded-md bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200"
          >
            Start Free
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {pricing.map((plan) => (
            <article
              key={plan.plan}
              className={`relative rounded-lg border p-5 ${
                plan.popular
                  ? 'border-sky-300/35 bg-sky-300/[0.08] shadow-xl shadow-sky-950/30'
                  : 'border-white/10 bg-slate-950/55'
              }`}
            >
              {plan.popular && (
                <span className="absolute right-4 top-4 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-200">
                  Popular
                </span>
              )}
              <p className="text-sm font-black text-white">{plan.plan}</p>
              <p className="mt-3 text-3xl font-black text-sky-300">{plan.price}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Best For</p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-200">{plan.bestFor}</p>
              <div className="mt-5 hidden space-y-2 md:block">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              {plan.note && (
                <p className="mt-5 hidden rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-semibold leading-5 text-amber-100 md:block">
                  {plan.note}
                </p>
              )}
            </article>
          ))}
        </div>

        <p className="mt-6 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.06] p-4 text-sm font-bold leading-6 text-emerald-100">
          First Tesla is always free during beta. Billed monthly, cancel anytime. Popular choice: 3-5 vehicles on Owner Fleet.
        </p>
      </div>
    </section>
  );
}

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
        <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          No signup needed
        </span>
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

function MobileHeroPreview() {
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
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Owner Dashboard</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Today&apos;s Fleet Plan</h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
          AI Ready
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ['Revenue', '$287', 'Today'],
          ['Utilization', '82%', 'Next 7d'],
          ['Vehicles', '3', 'Tracked'],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
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
          Model Y has the best return this week. Raise weekend pricing and check Tampa tires before the next trip.
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
          Get Started Free
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

export default function LandingPage({ onNavigate }) {
  const { isSignedIn } = useFleetAuthStatus();
  const [showMobileMore, setShowMobileMore] = useState(false);
  const enterApp = (route = 'overview') => {
    onNavigate(isSignedIn ? route : 'onboarding');
  };
  const scrollToDemo = () => {
    document.getElementById('hero-agent-input')?.focus();
  };
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const clerkReady = isClerkConfigured();

  const signInControl = (
    <button
      type="button"
      onClick={() => {
        if (!clerkReady) onNavigate('account');
      }}
      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
    >
      Sign In
    </button>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(14,165,233,0.13),transparent_30%),linear-gradient(180deg,#f5f7fb_0%,#eaf2f7_48%,#ffffff_100%)] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-lg shadow-sky-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900">RoboAgent</span>
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
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={scrollToPricing}
            className="hidden rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:block"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={scrollToDemo}
            className="hidden rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 shadow-sm transition hover:bg-sky-100 sm:block"
          >
            View Demo
          </button>
        </nav>
      </header>

      <main>
        <section className="relative isolate mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 pb-7 pt-2 sm:gap-8 sm:pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:pb-14 lg:pt-10">
          <div className="absolute inset-x-5 top-2 z-0 hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-xl shadow-slate-300/20 backdrop-blur sm:block lg:bottom-12" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[2.65rem] font-black leading-[0.96] tracking-tight text-slate-950 sm:text-6xl sm:leading-[0.98] lg:text-[4.65rem]">
              Your AI Agent for Tesla Rentals & Robotaxis
            </h1>
            <p className="mt-3 max-w-md text-base font-bold leading-6 text-slate-700 md:hidden">
              Give it goals. Get smart plans for pricing, charging, maintenance and earnings.
            </p>
            <div className="md:hidden">
              <MobileHeroCta
                onNavigate={onNavigate}
                onSeeMore={() => setShowMobileMore((current) => !current)}
                isMoreOpen={showMobileMore}
              />
            </div>
            <div className="mt-4 hidden gap-2 sm:mt-5 sm:flex sm:flex-wrap">
              {['Built by a Tesla owner for Tesla owners', 'First Tesla free', 'No credit card required', 'Not affiliated with Tesla'].map((label) => (
                <span key={label} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-8 hidden flex-col gap-3 sm:flex sm:flex-row">
              <button
                type="button"
                onClick={scrollToDemo}
                className="rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
              >
                Try the planning demo
              </button>
              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="rounded-md border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-black text-sky-800 transition hover:bg-sky-100"
              >
                Start free
              </button>
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => enterApp('overview')}
                  className="rounded-md border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Open Console
                </button>
              ) : clerkReady ? (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('account')}
                  className="rounded-md border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Sign In
                </button>
              )}
            </div>
            <p className="mt-5 hidden text-sm font-semibold leading-6 text-slate-700 sm:block">
              Built by a Tesla owner in Florida for other Tesla owners. Tesla controls autonomous driving availability and execution.
            </p>
          </div>

          <div className="relative z-10">
            <div className="hidden md:block">
              <HeroAgentDemo onNavigate={onNavigate} />
            </div>
            <div className="md:hidden">
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
        </section>

        <section className="hidden border-y border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.58),rgba(17,17,17,0.92))] md:block">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-8 md:grid-cols-4">
            {[
              ['Why RoboAgent', 'It turns Tesla data, rental economics, charging, and health signals into practical owner decisions.'],
              ['Simple Pricing', 'First Tesla is free during beta. Add vehicles at $12 per Tesla per month.'],
              ['Secure by Design', 'Tesla OAuth, encrypted tokens, explicit consent, and revoke-anytime controls.'],
              ['Tesla Boundary', 'RoboAgent is not affiliated with Tesla. Tesla controls autonomous availability and execution.'],
            ].map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/[0.12] bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(17,17,17,0.78))] p-4 shadow-lg shadow-black/10">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <PricingSection onStart={() => onNavigate('onboarding')} />

        {showMobileMore && <MobileTrustSection />}

        <section className="hidden border-y border-white/10 bg-[linear-gradient(180deg,rgba(17,17,17,0.92),rgba(30,41,59,0.42))] md:block">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-8 md:grid-cols-4">
            {trustPoints.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-emerald-300/20 bg-[linear-gradient(145deg,rgba(16,185,129,0.10),rgba(30,41,59,0.52))] p-4 shadow-lg shadow-black/10">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{detail}</p>
              </article>
            ))}
          </div>
        </section>

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
