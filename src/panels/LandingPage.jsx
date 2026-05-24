import { useState } from 'react';
import { SignInButton } from '@clerk/react';
import TeslaIndependenceNotice from '../components/TeslaIndependenceNotice';
import TeslaDataAccessDisclosure from '../components/TeslaDataAccessDisclosure';
import { useFleetAuthStatus } from '../auth/FleetAuthContext';
import { isClerkConfigured } from '../auth/clerkConfig';

const capabilities = [
  ['AI Operations Agent', 'Understands owner goals, breaks them into workflows, and recommends the next best action.'],
  ['Vehicle Health & Maintenance', 'Watches battery, state, mileage, anomaly risk, and service needs so issues surface before downtime.'],
  ['Smart Earnings Optimizer', 'Combines utilization, owner-entered revenue, and vehicle readiness to estimate where money is being made or lost.'],
  ['Autonomous Scheduling', 'Plans charging, cleaning, service, staging, and dispatch workflows around fleet availability.'],
  ['Live Fleet Telemetry', 'Connects Tesla Fleet API data for battery, location, odometer, charging, vehicle state, and sync history.'],
];

const agentCapabilityRoadmap = [
  {
    title: 'Dynamic Charging Advisor',
    detail: 'Combines Tesla battery state, weather, electricity-rate windows, and expected demand so the agent can recommend when each vehicle should charge.',
    signal: 'Battery + Weather + Rates',
  },
  {
    title: 'Demand-Based Pricing Suggestions',
    detail: 'Uses imported Turo earnings, utilization, local demand signals, holidays, and events to suggest price changes like a 15-20% weekend lift.',
    signal: 'Turo + Demand',
  },
  {
    title: 'Traffic & Accident Awareness',
    detail: 'Flags traffic or incident risk that could hurt pickup timing, cleaning windows, charging plans, or vehicle utilization.',
    signal: 'Traffic + Incidents',
  },
  {
    title: 'Event-Driven Opportunities',
    detail: 'Looks for concerts, sports games, holidays, airport surges, and local gatherings that could justify staging or pricing changes.',
    signal: 'Events + Holidays',
  },
];

const setupSteps = [
  ['Create FleetOS account', 'Start with one Tesla and keep the first vehicle free while you learn the product.'],
  ['Authenticate with Tesla', 'Use Tesla OAuth to approve telemetry access. FleetOS never needs your Tesla password.'],
  ['Sync and monitor', 'See battery, location, charging, odometer, parking history, and owner economics in one console.'],
];

const intelligenceSignals = [
  ['Tesla Telemetry', 'Battery, GPS, odometer, charging state, online state, software, alerts, and sync freshness.', 'Live vehicle state'],
  ['Rental Economics', 'Turo CSV imports, manual revenue, trip mileage, utilization, pricing changes, and owner costs.', 'Owner money layer'],
  ['Local Context', 'Weather, electricity-rate context, demand zones, service areas, and future event signals.', 'Market awareness'],
  ['Fleet Memory', 'Past trips, accepted recommendations, maintenance records, cleaning tasks, and command outcomes.', 'Learning loop'],
];

const fleetOsWorkflow = [
  ['Connect', 'Owner signs in, approves data consent, and connects Tesla through OAuth.'],
  ['Observe', 'FleetOS reads vehicle state, rental history, finance records, and service-area context.'],
  ['Reason', 'The AI agent explains risk, earnings opportunity, maintenance needs, and charging tradeoffs.'],
  ['Approve', 'Owners review recommended actions before sensitive commands or workflow changes happen.'],
  ['Improve', 'Outcomes become fleet memory so future recommendations get more useful.'],
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
  'Maximize my earnings this weekend with 3 Teslas',
  'How many miles did my last rental drive?',
  'Check health and prepare all vehicles for tomorrow',
  'Give me a full fleet summary',
];

const heroMetrics = [
  ['Earnings Today', '$428', '+18% vs avg', 'emerald'],
  ['Fleet Health', '94%', '2 watches', 'sky'],
  ['Utilization', '82%', 'weekend target', 'amber'],
];

const heroVehicles = [
  { id: 'FL', status: 'Ready', position: 'left-[18%] top-[54%]', tone: 'bg-emerald-300 shadow-emerald-300/40' },
  { id: 'OCE', status: 'Charging', position: 'left-[48%] top-[35%]', tone: 'bg-sky-300 shadow-sky-300/40' },
  { id: 'Y3', status: 'In Rental', position: 'left-[74%] top-[62%]', tone: 'bg-amber-300 shadow-amber-300/40' },
];

function PricingSection({ onStart }) {
  return (
    <section id="pricing" className="scroll-mt-8 border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Pricing
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white">
              Simple, fair pricing.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Start free with one Tesla during beta. Add vehicles only when FleetOS starts saving real operator time.
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
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              {plan.note && (
                <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-semibold leading-5 text-amber-100">
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

function buildDemoResponse(goal) {
  const lower = goal.toLowerCase();
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
        'No maintenance exception was triggered, but FleetOS added the 287 miles to tire and service forecasts.',
        'FleetOS can show the full trip record or compare it against previous rentals.',
      ],
      confidence: 95,
      impact: 'This rental performed well: strong earnings, normal driving profile, and no immediate maintenance flags.',
    };
  }

  if (lower.includes('health') || lower.includes('prepare')) {
    return {
      title: 'Tomorrow readiness command',
      summary: 'FleetOS found two vehicles that need action before morning demand and built a low-wake prep plan.',
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
      summary: 'FleetOS sees stronger weekend demand and recommends price moves only where readiness and health support it.',
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
      summary: 'FleetOS found one avoidable charge window conflict and moved charging away from likely earning hours.',
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
      summary: 'FleetOS identified pickup risk and moved prep tasks earlier so delays do not eat into utilization.',
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
      summary: 'FleetOS turns signup into a guided checklist so the owner sees value before and after Tesla OAuth.',
      metrics: ['5 steps', 'Tesla OAuth', 'No password sharing'],
      steps: [
        'Create a secure FleetOS account and save this plan to the owner profile.',
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
      summary: 'FleetOS combines telemetry, imported earnings, health, and utilization into a single owner action brief.',
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
    summary: 'FleetOS built a weekend plan that balances price, charging, cleaning, and approval-safe Tesla actions.',
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

const exampleWorkflows = [
  'Maximize my earnings this weekend with 3 Teslas',
  'How many miles did my last rental drive?',
  'Check health and prepare all vehicles for tomorrow',
];

function RealExampleWorkflows() {
  const workflows = exampleWorkflows.map((goal) => ({
    goal,
    response: buildDemoResponse(goal),
  }));

  return (
    <section id="example-workflows" className="scroll-mt-8 border-y border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Real Example Workflows</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            What owners can ask FleetOS to handle.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            The hero demo lets visitors try the agent live. This section shows the kinds of operational plans FleetOS can turn into owner-ready actions.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Agent pattern</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Goal in, plan out: FleetOS explains why, estimates impact, and queues approval-safe actions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {workflows.map(({ goal, response }) => (
            <article key={goal} className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Owner asks</p>
                  <h3 className="mt-2 text-xl font-black text-white">"{goal}"</h3>
                </div>
                <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                  {response.confidence}% confidence
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">FleetOS responds</p>
                <h4 className="mt-2 text-2xl font-black text-white">{response.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">{response.summary}</p>
                {response.metrics?.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {response.metrics.map((metric) => (
                      <div key={metric} className="rounded-lg border border-sky-300/15 bg-sky-300/[0.07] px-3 py-2 text-xs font-black text-sky-100">
                        {metric}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-3">
                {response.steps.slice(0, 3).map((step, index) => (
                  <div key={step} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-300 text-xs font-black text-slate-950">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-bold text-emerald-200">
                Expected impact: {response.impact}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroFleetMetrics() {
  const toneClass = {
    emerald: 'border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-200',
    sky: 'border-sky-300/20 bg-sky-400/[0.07] text-sky-200',
    amber: 'border-amber-300/20 bg-amber-400/[0.07] text-amber-200',
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {heroMetrics.map(([label, value, detail, tone]) => (
        <article key={label} className={`rounded-lg border p-4 ${toneClass[tone]}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs font-bold opacity-80">{detail}</p>
        </article>
      ))}
    </div>
  );
}

function HeroMiniMap() {
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Live Operating Picture</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Sample fleet status layer</p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase text-emerald-200">
          3 active
        </span>
      </div>

      <div className="relative mt-4 h-36 overflow-hidden rounded-lg border border-white/10 bg-[#111827]">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute -left-12 top-20 h-px w-[130%] rotate-[-18deg] bg-slate-500/50" />
        <div className="absolute left-24 -top-10 h-px w-[120%] rotate-[26deg] bg-slate-500/40" />
        {heroVehicles.map((vehicle) => (
          <div key={vehicle.id} className={`absolute ${vehicle.position}`}>
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black text-slate-950 shadow-xl ${vehicle.tone}`}>
              {vehicle.id}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {heroVehicles.map((vehicle) => (
          <div key={vehicle.status} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{vehicle.id}</p>
            <p className="mt-1 text-xs font-black text-white">{vehicle.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroAgentDemo({ onNavigate }) {
  const [goal, setGoal] = useState(demoPrompts[0]);
  const [response, setResponse] = useState(() => buildDemoResponse(demoPrompts[0]));
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
    <aside className="rounded-2xl border border-sky-300/25 bg-slate-950/90 p-5 shadow-2xl shadow-black/40 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Live AI Demo</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-4xl">Try the agent now.</h2>
        </div>
        <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
          No signup needed
        </span>
      </div>

      <HeroMiniMap />

      <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/80 p-4 lg:p-5">
        <label htmlFor="hero-agent-input" className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          Give FleetOS a goal
        </label>
        <textarea
          id="hero-agent-input"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          rows={5}
          className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-sky-300/50"
          placeholder="Tell FleetOS what you want your fleet to do..."
        />
        <button
          type="button"
          onClick={runDemo}
          disabled={isThinking}
          className="mt-3 w-full rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-70"
        >
          {isThinking ? 'Agent Planning...' : 'Run Agent'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4 lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Instant response
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">{response.title}</h3>
          </div>
          <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            {response.confidence}% confidence
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{response.summary}</p>
        {response.metrics?.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {response.metrics.map((metric) => (
              <div key={metric} className="rounded-lg border border-sky-300/15 bg-sky-300/[0.07] px-3 py-2 text-xs font-black text-sky-100">
                {metric}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-3">
          {response.steps.slice(0, 3).map((step, index) => (
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
          className="rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
        >
          Try Another Goal
        </button>
      </div>
    </aside>
  );
}

function IntelligenceSignalSection() {
  return (
    <section className="border-y border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">How It Thinks</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            Signals in.
            <span className="block text-sky-300">Owner actions out.</span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            FleetOS is not just a dashboard. The agent labels what it knows, explains why it matters, and turns fleet signals into reviewable actions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {intelligenceSignals.map(([title, detail, label]) => (
            <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{label}</p>
              <h3 className="mt-3 text-lg font-black text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FleetOsWorkflowSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">How FleetOS Works</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
          From Tesla connection to AI operating plan.
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          The reference pattern I liked is simple: show the pipeline. For FleetOS, the pipeline is private owner data, transparent reasoning, and owner-approved execution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {fleetOsWorkflow.map(([title, detail], index) => (
          <article key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-300 text-sm font-black text-slate-950">
              {index + 1}
            </span>
            <h3 className="mt-5 text-lg font-black text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage({ onNavigate }) {
  const { isSignedIn } = useFleetAuthStatus();
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
            onClick={scrollToPricing}
            className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 sm:block"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={scrollToDemo}
            className="hidden rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 sm:block"
          >
            View Demo
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-12 pt-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-16 lg:pt-12">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              FleetOS AI Agent
            </p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[4.65rem]">
              FleetOS - Your AI Agent for Tesla Rentals & Robotaxis
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Give it a goal. Watch it plan charging, maintenance, cleaning, and earnings strategies while you stay in full control.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['First Tesla free', '$12 per extra Tesla', 'Tesla password never shared'].map((label) => (
                <span key={label} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-200">
                  {label}
                </span>
              ))}
            </div>
            <HeroFleetMetrics />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToDemo}
                className="rounded-md bg-sky-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
              >
                Try the AI Agent Live
              </button>
              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="rounded-md border border-sky-300/30 bg-sky-300/10 px-5 py-4 text-sm font-black text-sky-100 transition hover:bg-sky-300/20"
              >
                Start Free (First Tesla Free)
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

          <HeroAgentDemo onNavigate={onNavigate} />
        </section>

        <IntelligenceSignalSection />

        <div className="hidden md:block">
          <FleetOsWorkflowSection />
        </div>

        <PricingSection onStart={() => onNavigate('onboarding')} />

        <div className="hidden md:block">
          <RealExampleWorkflows />
        </div>

        <section className="hidden mx-auto max-w-7xl px-5 py-10 md:block">
          <TeslaDataAccessDisclosure />
        </section>

        <section className="hidden border-y border-white/10 bg-slate-950/80 md:block">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-8 md:grid-cols-4">
            {trustPoints.map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hidden mx-auto max-w-7xl grid-cols-1 gap-8 px-5 py-10 md:grid lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
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
            {securityFeatures.slice(0, 4).map(([title, detail]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hidden border-y border-white/10 bg-white/[0.03] md:block">
          <div className="mx-auto max-w-7xl px-5 py-10">
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

        <section className="hidden mx-auto max-w-7xl grid-cols-1 gap-8 px-5 py-10 md:grid lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Agent Capabilities Roadmap
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
              The agent should find revenue and risk before you do.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              FleetOS is being built to combine Tesla telemetry with owner revenue, weather, traffic, electricity, and event signals so the AI agent can recommend practical actions instead of only showing dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agentCapabilityRoadmap.map((item) => (
              <article key={item.title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">{item.signal}</p>
                <h3 className="mt-3 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hidden mx-auto max-w-7xl grid-cols-1 gap-8 px-5 py-10 md:grid lg:grid-cols-[0.82fr_1.18fr]">
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
              {maintenanceFeatures.slice(0, 4).map(([title, detail]) => (
                <article key={title} className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
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

        <section className="hidden mx-auto max-w-7xl grid-cols-1 gap-8 px-5 py-14 md:grid lg:grid-cols-[0.85fr_1.15fr]">
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

        <section className="hidden mx-auto max-w-7xl px-5 py-10 md:block">
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
