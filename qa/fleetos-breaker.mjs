import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_BASE_URL = 'https://robotaxi-fleetos.vercel.app';
const BASE_URL = (process.env.FLEETOS_QA_BASE_URL || process.argv[2] || DEFAULT_BASE_URL).replace(/\/$/, '');
const REPORT_DIR = path.join(process.cwd(), 'qa', 'reports');
const startedAt = new Date();

function absoluteUrl(pathname) {
  if (pathname.startsWith('http')) return pathname;
  return `${BASE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function truncate(value, length = 600) {
  const text = String(value ?? '');
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

async function request(pathname, options = {}) {
  const url = absoluteUrl(pathname);
  const started = performance.now();
  const response = await fetch(url, {
    redirect: options.redirect || 'manual',
    method: options.method || 'GET',
    headers: {
      'User-Agent': 'RoboAgent-Breaker/1.0',
      Accept: options.accept || '*/*',
      ...(options.headers || {}),
    },
    body: options.body,
  });
  const elapsedMs = Math.round(performance.now() - started);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let json = null;

  if (contentType.includes('application/json')) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return {
    url,
    status: response.status,
    ok: response.ok,
    elapsedMs,
    contentType,
    location: response.headers.get('location'),
    text,
    json,
  };
}

function pass(name, detail = '', evidence = {}) {
  return { name, status: 'pass', detail, evidence };
}

function warn(name, detail = '', evidence = {}) {
  return { name, status: 'warn', detail, evidence };
}

function fail(name, detail = '', evidence = {}) {
  return { name, status: 'fail', detail, evidence };
}

async function runTest(name, fn) {
  try {
    return await fn();
  } catch (error) {
    return fail(name, error.stack || error.message || String(error));
  }
}

async function getIndexAndBundle() {
  const index = await request('/?qa=breaker');
  const asset = index.text.match(/\/assets\/(index-[^" ]+\.js)/)?.[1];
  const bundle = asset ? await request(`/assets/${asset}`) : null;
  return { index, asset, bundle };
}

async function testPublicShell() {
  const { index, asset, bundle } = await getIndexAndBundle();
  if (index.status !== 200) {
    return fail('public shell loads', `Expected 200 from homepage, got ${index.status}.`, { url: index.url });
  }
  if (!asset || !bundle || bundle.status !== 200) {
    return fail('public shell loads', 'Homepage did not expose a readable Vite bundle.', {
      status: index.status,
      asset,
      bundleStatus: bundle?.status,
    });
  }
  return pass('public shell loads', `Homepage and bundle loaded in ${index.elapsedMs + bundle.elapsedMs}ms.`, {
    asset,
    bundleBytes: bundle.text.length,
  });
}

async function testStaleCopy() {
  const { bundle } = await getIndexAndBundle();
  const forbidden = [
    'Join Early Access',
    'Start free, then pay only when RoboAgent helps manage more Teslas',
    'Open RoboAgent Console',
    'Tesla OAuth only',
  ];
  const found = forbidden.filter((phrase) => bundle?.text.includes(phrase));
  if (found.length > 0) {
    return fail('stale homepage copy removed', 'Deployed bundle still contains old homepage copy.', { found });
  }
  return pass('stale homepage copy removed', 'No stale waitlist or old CTA copy found in deployed bundle.');
}

async function testExpectedLandingCopy() {
  const { bundle } = await getIndexAndBundle();
  const expected = [
    'Turo today, robotaxi tomorrow: your Tesla AI agent',
    'No signup needed',
    'Maximize my earnings this weekend with 3 Teslas',
    'How many miles did my last rental drive?',
    '287 miles driven',
    'Earnings Today',
    'Fleet Health',
    'Utilization',
    'My Tesla Vehicle Map',
    'Demand and pricing zones',
    'Health on the map',
    'Try the planning demo',
    'Start free',
    'Built by a Tesla owner for Tesla owners',
    'Simple, fair pricing.',
    'Secure by Design',
    'Tesla password never shared',
  ];
  const missing = expected.filter((phrase) => !bundle?.text.includes(phrase));
  if (missing.length > 0) {
    return fail('current landing copy present', 'Expected current landing copy is missing from the deployed bundle.', { missing });
  }
  return pass('current landing copy present', 'Current homepage trust and product-preview copy is present.');
}

async function testHealth() {
  const health = await request('/api/health?qa=breaker', { accept: 'application/json' });
  if (health.status !== 200 || !health.json?.ok) {
    return fail('health endpoint', `Expected healthy JSON response, got ${health.status}.`, {
      body: truncate(health.text),
    });
  }

  const issues = [];
  if (health.json.auth?.provider !== 'clerk') issues.push('AUTH_PROVIDER is not clerk');
  if (!health.json.auth?.clerkConfigured) issues.push('Clerk is not configured');
  if (!health.json.auth?.clerkRequired) issues.push('Clerk is not required');
  if (String(health.json.redirectUri || '').includes('localhost')) issues.push('Tesla redirect URI is localhost');

  if (issues.length > 0) {
    return fail('health endpoint', 'Health endpoint is reachable but configuration has security/deployment issues.', {
      issues,
      health: health.json,
    });
  }

  return pass('health endpoint', 'Health endpoint confirms Clerk auth and production Tesla callback are active.', {
    auth: health.json.auth,
    redirectUri: health.json.redirectUri,
  });
}

async function testSignedOutSessionGate() {
  const session = await request('/api/auth/session?qa=breaker', { accept: 'application/json' });
  if (session.status !== 401) {
    return fail('signed-out session gate', `Expected 401 for signed-out session, got ${session.status}.`, {
      body: truncate(session.text),
    });
  }
  return pass('signed-out session gate', 'Signed-out user cannot get an authenticated RoboAgent session.');
}

async function testAdminGate() {
  const admin = await request('/api/admin?qa=breaker', { accept: 'application/json' });
  if (![401, 403].includes(admin.status)) {
    return fail('admin gate', `Expected 401/403 for signed-out admin, got ${admin.status}.`, {
      body: truncate(admin.text),
    });
  }
  return pass('admin gate', 'Signed-out user cannot read admin summary.');
}

async function testTeslaLoginGate() {
  const login = await request('/api/tesla/login?returnTo=%2F%23%2Fonboarding', { redirect: 'manual' });
  if (login.status !== 401 || !String(login.text || '').includes('Sign in to RoboAgent')) {
    return fail('Tesla OAuth account gate', `Expected 401 account gate, got ${login.status}.`, {
      location: login.location,
      body: truncate(login.text),
    });
  }
  return pass('Tesla OAuth account gate', 'Signed-out visitor must create or sign into RoboAgent before Tesla OAuth starts.');
}

async function testTeslaCallbackMisuse() {
  const callback = await request('/api/tesla/callback', { accept: 'text/html' });
  if (callback.status !== 400) {
    return fail('Tesla callback misuse', `Expected 400 for direct callback open, got ${callback.status}.`, {
      body: truncate(callback.text),
    });
  }
  if (!callback.text.includes('Return to RoboAgent onboarding')) {
    return warn('Tesla callback misuse', 'Callback blocks misuse, but friendly recovery copy was not detected.', {
      body: truncate(callback.text),
    });
  }
  return pass('Tesla callback misuse', 'Direct callback open fails safely with recovery link.');
}

async function testVehiclesGate() {
  const vehicles = await request('/api/vehicles?qa=breaker', { accept: 'application/json' });
  if (![401, 502].includes(vehicles.status)) {
    return fail('vehicles API gate', `Expected auth-related failure for signed-out vehicles request, got ${vehicles.status}.`, {
      body: truncate(vehicles.text),
    });
  }
  return pass('vehicles API gate', 'Signed-out user cannot read vehicle telemetry.');
}

async function testAgentAskGate() {
  const agent = await request('/api/agent/ask?qa=breaker', {
    method: 'POST',
    accept: 'application/json',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What should my fleet do today?' }),
  });
  if (agent.status !== 401) {
    return fail('agent ask gate', `Expected 401 for signed-out agent ask, got ${agent.status}.`, {
      body: truncate(agent.text),
    });
  }
  return pass('agent ask gate', 'Signed-out user cannot ask RoboAgent to analyze private fleet data.');
}

async function testMethodHardening() {
  const sessionPost = await request('/api/auth/session', { method: 'POST', accept: 'application/json' });
  if (sessionPost.status !== 405) {
    return fail('method hardening', `Expected 405 for POST /api/auth/session, got ${sessionPost.status}.`, {
      body: truncate(sessionPost.text),
    });
  }
  return pass('method hardening', 'Unsupported API method returns 405.');
}

async function testHealthBurst() {
  const burstCount = Number(process.env.FLEETOS_QA_BURST || 20);
  const started = performance.now();
  const responses = await Promise.all(
    Array.from({ length: burstCount }, (_, index) => request(`/api/health?qa=burst-${index}`, { accept: 'application/json' })),
  );
  const elapsedMs = Math.round(performance.now() - started);
  const failed = responses.filter((response) => response.status !== 200);
  if (failed.length > 0) {
    return fail('health burst', `${failed.length}/${burstCount} health requests failed.`, {
      statuses: responses.map((response) => response.status),
      elapsedMs,
    });
  }
  return pass('health burst', `${burstCount} concurrent health requests passed in ${elapsedMs}ms.`, {
    maxMs: Math.max(...responses.map((response) => response.elapsedMs)),
    minMs: Math.min(...responses.map((response) => response.elapsedMs)),
  });
}

async function testPublicRouteSmoke() {
  const routes = ['/', '/#/onboarding', '/#/account', '/#/privacy', '/#/terms'];
  const results = await Promise.all(routes.map((route) => request(route)));
  const bad = results.filter((result) => result.status !== 200 || !result.text.includes('<div id="root"></div>'));
  if (bad.length > 0) {
    return fail('public route smoke', 'One or more public routes failed to return the SPA shell.', {
      bad: bad.map((result) => ({ url: result.url, status: result.status })),
    });
  }
  return pass('public route smoke', 'Public routes return the SPA shell.', {
    routes,
  });
}

function summarize(results) {
  const counts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  return {
    total: results.length,
    pass: counts.pass || 0,
    warn: counts.warn || 0,
    fail: counts.fail || 0,
  };
}

async function writeReports(results) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const summary = summarize(results);
  const generatedAt = new Date().toISOString();
  const payload = {
    baseUrl: BASE_URL,
    generatedAt,
    durationMs: Date.now() - startedAt.getTime(),
    summary,
    results,
  };

  const jsonPath = path.join(REPORT_DIR, 'fleetos-breaker-latest.json');
  const htmlPath = path.join(REPORT_DIR, 'fleetos-breaker-latest.html');
  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2));
  await fs.writeFile(htmlPath, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RoboAgent Breaker Report</title>
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #07111f; color: #e5eefb; }
      main { max-width: 1080px; margin: 0 auto; padding: 32px 20px; }
      h1 { margin: 0; font-size: 34px; }
      .meta { color: #94a3b8; margin-top: 8px; }
      .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
      .card, .test { border: 1px solid rgba(148,163,184,.2); background: rgba(15,23,42,.86); border-radius: 10px; padding: 16px; }
      .card strong { display: block; font-size: 28px; margin-top: 4px; }
      .tests { display: grid; gap: 12px; }
      .test { border-left: 6px solid #38bdf8; }
      .pass { border-left-color: #34d399; }
      .warn { border-left-color: #fbbf24; }
      .fail { border-left-color: #fb7185; }
      .status { text-transform: uppercase; font-size: 12px; letter-spacing: .14em; font-weight: 800; }
      pre { white-space: pre-wrap; word-break: break-word; color: #cbd5e1; background: #020617; border-radius: 8px; padding: 12px; overflow: auto; }
      @media (max-width: 720px) { .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <main>
      <h1>RoboAgent Breaker Report</h1>
      <p class="meta">Target: ${escapeHtml(BASE_URL)} · Generated: ${escapeHtml(generatedAt)}</p>
      <section class="summary">
        <div class="card">Total<strong>${summary.total}</strong></div>
        <div class="card">Pass<strong>${summary.pass}</strong></div>
        <div class="card">Warn<strong>${summary.warn}</strong></div>
        <div class="card">Fail<strong>${summary.fail}</strong></div>
      </section>
      <section class="tests">
        ${results.map((result) => `
          <article class="test ${escapeHtml(result.status)}">
            <div class="status">${escapeHtml(result.status)}</div>
            <h2>${escapeHtml(result.name)}</h2>
            <p>${escapeHtml(result.detail)}</p>
            ${Object.keys(result.evidence || {}).length ? `<pre>${escapeHtml(JSON.stringify(result.evidence, null, 2))}</pre>` : ''}
          </article>
        `).join('')}
      </section>
    </main>
  </body>
</html>`);

  return { jsonPath, htmlPath, summary };
}

const tests = [
  ['public shell loads', testPublicShell],
  ['stale homepage copy removed', testStaleCopy],
  ['current landing copy present', testExpectedLandingCopy],
  ['public route smoke', testPublicRouteSmoke],
  ['health endpoint', testHealth],
  ['signed-out session gate', testSignedOutSessionGate],
  ['admin gate', testAdminGate],
  ['Tesla OAuth account gate', testTeslaLoginGate],
  ['Tesla callback misuse', testTeslaCallbackMisuse],
  ['vehicles API gate', testVehiclesGate],
  ['agent ask gate', testAgentAskGate],
  ['method hardening', testMethodHardening],
  ['health burst', testHealthBurst],
];

const results = [];
for (const [name, fn] of tests) {
  process.stdout.write(`Running ${name}... `);
  const result = await runTest(name, fn);
  results.push(result);
  console.log(result.status.toUpperCase());
}

const report = await writeReports(results);
console.log('\nRoboAgent Breaker Summary');
console.log(`Target: ${BASE_URL}`);
console.log(`Pass: ${report.summary.pass}  Warn: ${report.summary.warn}  Fail: ${report.summary.fail}`);
console.log(`HTML report: ${report.htmlPath}`);
console.log(`JSON report: ${report.jsonPath}`);

if (report.summary.fail > 0) {
  process.exitCode = 1;
}
