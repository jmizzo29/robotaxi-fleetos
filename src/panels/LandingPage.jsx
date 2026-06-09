import { useState } from 'react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
import Logo from '../components/Logo';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import DashboardPreview from '../components/DashboardPreview';
import MobileHeroPreview from '../components/MobileHeroPreview';
import OwnerOutcomePanel from '../components/OwnerOutcomePanel';
import { Button, Card } from '../ui';
import {
  TrendingUp,
  BatteryCharging,
  Wrench,
  ListChecks,
  ArrowRight,
  Shield,
  ShieldCheck,
  Cpu,
  Link2,
} from 'lucide-react';
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar — 3 menus with RoboAgent brand exactly in the middle */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center relative">
          {/* Left: one menu */}
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90 hover:text-white transition"
          >
            HOW IT WORKS
          </button>

          {/* EXACT MIDDLE: RoboAgent (you will provide the file) */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:opacity-90 transition"
            onClick={() => onNavigate('landing')}
          >
            <Logo className="h-7 sm:h-8" />
          </div>

          {/* Right: the other two menus */}
          <div className="ml-auto flex items-center gap-8 sm:gap-10 text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90">
            <button 
              onClick={() => onNavigate('login')}
              className="hover:text-white transition"
            >
              SIGN IN
            </button>
            <button 
              onClick={() => onNavigate('about')}
              className="hover:text-white transition"
            >
              ABOUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pt-12 pb-16 md:pt-16">
        {/* Intro */}
        <div className="max-w-2xl animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">How it works</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            You stay in control.<br />ROBOAGENT does the work.
          </h1>
          <p className="mt-4 text-lg text-white/70">Three simple steps. Real Tesla data. You always approve.</p>
        </div>

        {/* Steps */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { step: '01', title: 'Connect your Tesla', desc: 'Secure OAuth via Tesla Fleet API. ROBOAGENT never sees your password. First Tesla is free during beta.' },
            { step: '02', title: 'Get daily AI plans', desc: 'Every morning you receive clear recommendations for pricing, charging, cleaning, and maintenance — powered by live telemetry.' },
            { step: '03', title: 'Approve what you want', desc: 'You review and approve actions. Nothing happens without your explicit approval. Full audit trail included.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-3xl border border-white/10 bg-zinc-900 p-6 transition hover:border-white/20">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                  {step}
                </span>
                <span className="text-sm font-semibold text-white/50">{step}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-2 leading-relaxed text-white/70">{desc}</p>
            </div>
          ))}
        </div>

        {/* Telemetry Details */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-zinc-900 p-10">
          <h2 className="text-2xl font-semibold tracking-tight">What Telemetry We Fetch from Tesla</h2>
          <p className="mt-2 text-white/70">All data is pulled securely through Tesla’s official Fleet API. Your credentials never leave Tesla’s servers.</p>

          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Real-time Data</div>
              <ul className="mt-4 space-y-3 text-white/80">
                <li>• Battery level, range, and charging status</li>
                <li>• Live location, speed, and heading</li>
                <li>• Energy consumption and efficiency</li>
                <li>• Vehicle state (driving, parked, charging, idle)</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Fleet &amp; Health Data</div>
              <ul className="mt-4 space-y-3 text-white/80">
                <li>• Software version and update status</li>
                <li>• Odometer, trip history, and utilization</li>
                <li>• Basic diagnostics and maintenance alerts</li>
                <li>• Tire pressure and climate control status</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Ecosystem */}
        <div className="mt-16 bg-zinc-900 rounded-3xl p-12">
          <div className="mb-4">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">03</div>
            <h2 className="text-3xl font-semibold tracking-tight">API Ecosystem</h2>
          </div>

          <p className="text-white/70 mb-8">
            RoboAgent uses API-first, platform-agnostic design – compatible with all major AV platforms, aggregator services, and autonomous ride-share providers.
            Example: we can also proxy and surface public community trackers (e.g. real-time Tesla sightings in Austin via robotaxitracker.com) through our own /api layer.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="font-semibold mb-2">RESTful APIs</div>
              <p className="text-sm text-white/70">Order submission, stall reservation, fleet management</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="font-semibold mb-2">Webhooks</div>
              <p className="text-sm text-white/70">Real-time event notifications for vehicle arrivals and status updates</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="font-semibold mb-2">SDKs</div>
              <p className="text-sm text-white/70">iOS, Android, Web (React, JS) for embedded experiences</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="font-semibold mb-2">oAuth</div>
              <p className="text-sm text-white/70">Secure vehicle and customer authentication flows</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate('onboarding')}
              className="px-8 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-white/90 active:scale-[0.985] transition"
            >
              Book a demo
            </button>
          </div>
        </div>

        {/* Scenarios */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold">Individual Owner (1–5 vehicles)</h3>
            <p className="mt-3 text-white/70">Use your Tesla on Turo or for personal use, then let it earn on the Robotaxi network when idle.</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Balance personal use vs. robotaxi earnings</li>
              <li>• Get smart charging and pricing suggestions</li>
              <li>• Track total income from both Turo and Robotaxi</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold">Fleet Owner (10+ Cybercabs)</h3>
            <p className="mt-3 text-white/70">Run a professional operation with multiple vehicles working 24/7.</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• AI-powered dispatching and routing</li>
              <li>• Centralized charging and maintenance scheduling</li>
              <li>• Detailed earnings analytics and optimization</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <button onClick={() => onNavigate('onboarding')} className="rounded-2xl bg-white px-8 py-3 text-lg font-semibold text-black hover:bg-white/90 transition">
            Connect your first Tesla
          </button>
          <p className="text-sm text-white/50">No credit card required during beta.</p>
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5 text-sm" aria-label="ROBOAGENT home">
            <Logo className="h-7" />
          </button>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            {[
              ['how-it-works', 'How it works'],
              ['about', 'About'],
              ['privacy', 'Privacy'],
              ['terms', 'Terms'],
            ].map(([target, label]) => (
              <button key={target} onClick={() => onNavigate(target)} className="hover:text-white transition">
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-8 text-xs text-white/40">
          ROBOAGENT beta · Built on the official Tesla Fleet API. Not affiliated with or endorsed by Tesla, Inc.
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  const steps = [
    {
      Icon: Link2,
      step: '01',
      title: 'Connect your Tesla',
      desc: 'Secure Tesla OAuth in two taps. Your password stays with Tesla — first vehicle is free during beta.',
    },
    {
      Icon: Cpu,
      step: '02',
      title: 'AI optimizes everything',
      desc: 'ROBOAGENT reads live telemetry to plan pricing, charging, routing, and maintenance every day.',
    },
    {
      Icon: TrendingUp,
      step: '03',
      title: 'You approve and earn',
      desc: 'Review a short morning action list, approve in seconds, and let your fleet run hands-off.',
    },
  ];

  const benefits = [
    { Icon: TrendingUp, title: 'Dynamic pricing', desc: 'Rates adjust to real local demand so every available hour earns more.' },
    { Icon: BatteryCharging, title: 'Smart charging', desc: 'Cars charge in the cheapest windows and are ready before peak demand.' },
    { Icon: Wrench, title: 'Predictive maintenance', desc: 'Tire, brake, and battery issues are flagged early from Tesla telemetry.' },
    { Icon: ListChecks, title: 'Daily AI plans', desc: 'A prioritized morning brief you can approve from your phone in seconds.' },
  ];

  return (
    <div className="min-h-screen bg-surface text-ink">
      <PublicHeader onNavigate={onNavigate} active="landing" />

      {/* Hero — centered editorial */}
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 text-center sm:pt-20 md:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface-raised px-3.5 py-1.5 text-xs font-medium text-ink-muted shadow-sm">
            <Shield className="h-3.5 w-3.5 text-status-ready" />
            Built on the Tesla Fleet API · Privacy-first · Beta
          </span>
        </div>

        <h1 className="animate-fade-up mt-7 text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl md:text-[4.25rem]">
          Run your Tesla fleet on autopilot.
          <span className="mt-2 block text-ink-muted">Earn more, manage less.</span>
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
          AI agents optimize your Robotaxi operations so you maximize earnings with minimal effort.
        </p>

        <div className="animate-fade-up mt-9 flex flex-col items-center gap-4">
          <Button size="lg" onClick={() => onNavigate('onboarding')} className="gap-2 rounded-full px-8">
            Connect your Tesla
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => onNavigate('agent')}
            className="text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            Try the AI agent →
          </button>
        </div>
      </section>

      {/* Product shot — dark glowing map embedded in the light page */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <div className="animate-fade-up">
          <DashboardPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-ink/8 bg-surface-raised py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Connect once. Earn on autopilot.
            </h2>
            <p className="mt-3 text-ink-muted">Three steps from a parked Tesla to a self-running fleet.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map(({ Icon, step, title, desc }) => (
              <Card key={step} padding="p-6" interactive>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/5 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-subtle">{step}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-ink/8 bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">What it handles</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              AI that works while your cars earn.
            </h2>
            <p className="mt-3 text-ink-muted">Four things ROBOAGENT runs every day so you don&apos;t have to.</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 sm:gap-6">
            {benefits.map(({ Icon, title, desc }) => (
              <Card key={title} padding="p-7 sm:p-8" interactive className="group">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/5 text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-ink/8 bg-surface-raised py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Card padding="p-8 sm:p-10" className="relative overflow-hidden text-center">
            <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-status-ready/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Stop managing your fleet manually.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-ink-muted">
                Connect your first Tesla in minutes and see your first AI plan before you commit. No card required in beta.
              </p>
              <div className="mt-7 flex flex-col items-center gap-4">
                <Button size="lg" onClick={() => onNavigate('onboarding')} className="gap-2 rounded-full px-8">
                  Connect your Tesla
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => onNavigate('how-it-works')}
                  className="text-sm font-medium text-ink-muted transition hover:text-ink"
                >
                  See how it works →
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
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
    <div className="min-h-screen bg-surface text-ink">
      <PublicHeader onNavigate={onNavigate} active="about" />

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

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
