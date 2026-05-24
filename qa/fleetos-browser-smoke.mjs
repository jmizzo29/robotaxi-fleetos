import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const BASE_URL = (process.env.FLEETOS_QA_BASE_URL || process.argv[2] || 'https://robotaxi-fleetos.vercel.app').replace(/\/$/, '');
const REPORT_DIR = path.join(process.cwd(), 'qa', 'reports');

function routeUrl(route = '') {
  return `${BASE_URL}/${route}`;
}

function result(status, name, detail, evidence = {}) {
  return { status, name, detail, evidence };
}

function pass(name, detail, evidence) {
  return result('pass', name, detail, evidence);
}

function fail(name, detail, evidence) {
  return result('fail', name, detail, evidence);
}

async function runTest(name, fn) {
  try {
    return await fn();
  } catch (error) {
    return fail(name, error.message || String(error), { stack: error.stack });
  }
}

async function makePage(browser, profile) {
  const context = await browser.newContext(profile === 'mobile' ? devices['iPhone 13'] : {
    viewport: { width: 1440, height: 1000 },
  });
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const page = await context.newPage();

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.includes('api.mapbox.com') && !url.includes('events.clerk')) {
      failedRequests.push({ url, failure: request.failure()?.errorText });
    }
  });

  return { context, page, pageErrors, consoleErrors, failedRequests };
}

async function assertNoRuntimeErrors(name, telemetry) {
  const seriousConsoleErrors = telemetry.consoleErrors.filter((text) => (
    !text.includes('Download the React DevTools') &&
    !text.includes('401') &&
    !text.includes('api.mapbox.com')
  ));

  if (telemetry.pageErrors.length || seriousConsoleErrors.length || telemetry.failedRequests.length) {
    throw new Error(JSON.stringify({
      pageErrors: telemetry.pageErrors,
      consoleErrors: seriousConsoleErrors.slice(0, 5),
      failedRequests: telemetry.failedRequests.slice(0, 5),
    }, null, 2));
  }

  return pass(name, 'No serious browser runtime errors detected.');
}

async function testLanding(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('?qa=browser'), { waitUntil: 'networkidle' });
  await page.getByText('FleetOS', { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByText('FleetOS - Your AI Agent for Tesla Rentals & Robotaxis').waitFor({ timeout: 15000 });
  await page.getByText('No signup needed', { exact: true }).waitFor({ timeout: 15000 });
  await page.locator('#hero-agent-input').waitFor({ timeout: 15000 });
  const heroGoal = await page.locator('#hero-agent-input').inputValue();
  if (heroGoal !== 'Maximize my earnings this weekend with 3 Teslas') {
    throw new Error(`Unexpected hero agent prompt: ${heroGoal}`);
  }
  await page.getByText('Signals in.').waitFor({ timeout: 15000 });
  await page.getByText('Simple, fair pricing.').waitFor({ timeout: 15000 });
  await page.getByText('Connect Tesla in minutes').waitFor({ timeout: 15000 });
  if (profile === 'desktop') {
    await page.getByText('Security & Privacy').waitFor({ timeout: 15000 });
    await page.getByText('FleetOS turns data into action').waitFor({ timeout: 15000 });
    await page.getByText('What Data Does FleetOS Access?').first().waitFor({ timeout: 15000 });
    await page.getByText('Dynamic Charging Advisor').waitFor({ timeout: 15000 });
    await page.getByText('Built for robotaxis that need to stay earning').waitFor({ timeout: 15000 });
    await page.getByText('What FleetOS predicts first').waitFor({ timeout: 15000 });
    await page.getByText('Fleet Telemetry First').waitFor({ timeout: 15000 });
    await page.getByText('VIN-Scoped Limits').waitFor({ timeout: 15000 });
  }
  if (profile === 'desktop') {
    await page.getByRole('button', { name: 'Try the AI Agent Live' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Start Free (First Tesla Free)' }).waitFor({ timeout: 15000 });
    await page.getByText('Tesla password never shared').first().waitFor({ timeout: 15000 });
  } else {
    await page.getByRole('button', { name: 'Run Agent' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Sign in with Tesla' }).waitFor({ timeout: 15000 });
    await page.getByText('Secure Tesla Login').waitFor({ timeout: 15000 });
    await page.getByText('Data Encrypted').waitFor({ timeout: 15000 });
    await page.getByText('Revoke Anytime').waitFor({ timeout: 15000 });
  }
  await page.getByText('Join Early Access').count().then((count) => {
    if (count > 0) throw new Error('Old Join Early Access form is visible.');
  });
  await context.close();
  return assertNoRuntimeErrors(`landing browser smoke (${profile})`, telemetry);
}

async function testOnboardingStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/onboarding'), { waitUntil: 'networkidle' });
  await page.getByText('Connect Your First Tesla').waitFor({ timeout: 15000 });
  const sideMenuVisible = await page.getByRole('button', { name: 'Fleet', exact: true }).count();
  if (sideMenuVisible > 0) throw new Error('App navigation is visible on onboarding.');
  await page.getByText('Finish Tesla connection and first telemetry sync').waitFor({ timeout: 15000 });
  const dashboard = page.getByRole('button', { name: 'Open Dashboard' });
  if (!(await dashboard.isDisabled())) throw new Error('Open Dashboard should be disabled before first sync.');
  await context.close();
  return assertNoRuntimeErrors(`onboarding standalone (${profile})`, telemetry);
}

async function testAccountStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/account'), { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Sign in to FleetOS' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Sign in with Tesla' }).click();
  await page.getByRole('heading', { name: 'FleetOS wants to connect to your Tesla Account' }).waitFor({ timeout: 15000 });
  const allowAccess = page.getByRole('button', { name: 'Allow Access' });
  if (!(await allowAccess.isDisabled())) throw new Error('Allow Access should require both consent checkboxes.');
  await page.getByLabel('I understand that FleetOS is a third-party app and is not affiliated with Tesla.').check();
  await page.getByLabel(/I have read and agree/).check();
  if (await allowAccess.isDisabled()) throw new Error('Allow Access should enable after both consent checkboxes.');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const appMenuVisible = await page.getByRole('button', { name: 'Beta Admin' }).count();
  if (appMenuVisible > 0) throw new Error('App navigation is visible on account page.');
  await context.close();
  return assertNoRuntimeErrors(`account standalone (${profile})`, telemetry);
}

async function testLegalStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/privacy'), { waitUntil: 'networkidle' });
  await page.getByText('FleetOS Privacy Notice').waitFor({ timeout: 15000 });
  await page.getByText('What Data Does FleetOS Access?').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Back to Home' }).waitFor({ timeout: 15000 });
  const appMenuVisible = await page.getByRole('button', { name: 'Settings' }).count();
  if (appMenuVisible > 0) throw new Error('App navigation is visible on legal page.');
  await context.close();
  return assertNoRuntimeErrors(`legal standalone (${profile})`, telemetry);
}

async function testServiceAreasMap(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/map'), { waitUntil: 'networkidle' });
  await page.getByText('Fleet Map Intelligence').waitFor({ timeout: 15000 });
  await page.getByText('Demand and pricing zones').waitFor({ timeout: 15000 });
  await page.getByText('Health on the map').waitFor({ timeout: 15000 });
  await page.getByText('Recommended pricing zone').first().waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`service areas map (${profile})`, telemetry);
}

async function testLandingCtas(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('/'), { waitUntil: 'networkidle' });
  if (profile === 'desktop') {
    await page.getByRole('button', { name: 'Try the AI Agent Live' }).click();
  }
  await page.locator('#hero-agent-input').fill('Should I raise price this weekend in Tampa?');
  await page.getByRole('button', { name: 'Run Agent' }).click();
  await page.getByText('Turo revenue plan').first().waitFor({ timeout: 15000 });
  if (profile === 'desktop') {
    await page.getByRole('button', { name: 'Start Free (First Tesla Free)' }).click();
    await page.waitForURL('**/#/onboarding', { timeout: 10000 });
    await page.getByText('Connect Your First Tesla').waitFor({ timeout: 15000 });
  } else {
    await page.getByRole('button', { name: 'Sign in with Tesla' }).click();
    await page.waitForURL('**/#/account', { timeout: 10000 });
    await page.getByRole('heading', { name: 'Sign in to FleetOS' }).waitFor({ timeout: 15000 });
  }
  await context.close();
  return assertNoRuntimeErrors(`landing CTA to onboarding (${profile})`, telemetry);
}

async function testOwnerValueDashboard(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/overview'), { waitUntil: 'networkidle' });
  await page.getByText("Today's AI fleet brief").waitFor({ timeout: 15000 });
  await page.getByText('Dynamic Pricing').waitFor({ timeout: 15000 });
  await page.getByText('Predictive Maintenance').waitFor({ timeout: 15000 });
  await page.getByText('Impact Tracking').waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`owner value dashboard (${profile})`, telemetry);
}

function summarize(results) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0, pass: 0, warn: 0, fail: 0 });
}

async function writeReport(results) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const payload = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    summary: summarize(results),
    results,
  };
  const file = path.join(REPORT_DIR, 'fleetos-browser-smoke-latest.json');
  await fs.writeFile(file, JSON.stringify(payload, null, 2));
  return { file, summary: payload.summary };
}

const browser = await chromium.launch({ headless: true });
const tests = [];
for (const profile of ['desktop', 'mobile']) {
  tests.push(
    [`landing browser smoke (${profile})`, () => testLanding(browser, profile)],
    [`onboarding standalone (${profile})`, () => testOnboardingStandalone(browser, profile)],
    [`account standalone (${profile})`, () => testAccountStandalone(browser, profile)],
    [`legal standalone (${profile})`, () => testLegalStandalone(browser, profile)],
    [`service areas map (${profile})`, () => testServiceAreasMap(browser, profile)],
    [`landing CTA to onboarding (${profile})`, () => testLandingCtas(browser, profile)],
    [`owner value dashboard (${profile})`, () => testOwnerValueDashboard(browser, profile)],
  );
}

const results = [];
for (const [name, fn] of tests) {
  process.stdout.write(`Running ${name}... `);
  const item = await runTest(name, fn);
  results.push(item);
  console.log(item.status.toUpperCase());
}

await browser.close();
const report = await writeReport(results);
console.log(`\nBrowser smoke summary: pass=${report.summary.pass} warn=${report.summary.warn} fail=${report.summary.fail}`);
console.log(`Report: ${report.file}`);

if (report.summary.fail > 0) {
  process.exitCode = 1;
}
