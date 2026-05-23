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
  await page.getByText('Security & Privacy').waitFor({ timeout: 15000 });
  await page.getByText('Run your Tesla fleet with an AI agent.').waitFor({ timeout: 15000 });
  await page.getByText('Start free.').waitFor({ timeout: 15000 });
  await page.getByText('FleetOS turns data into action').waitFor({ timeout: 15000 });
  await page.getByText('Dynamic Charging Advisor').waitFor({ timeout: 15000 });
  await page.getByText('Built for robotaxis that need to stay earning').waitFor({ timeout: 15000 });
  await page.getByText('What FleetOS predicts first').waitFor({ timeout: 15000 });
  await page.getByText('Fleet Telemetry First').waitFor({ timeout: 15000 });
  await page.getByText('VIN-Scoped Limits').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Try Free AI Demo' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Start Free' }).first().waitFor({ timeout: 15000 });
  await page.getByText('Simple, fair pricing.').waitFor({ timeout: 15000 });
  await page.getByText('Tesla password never shared').first().waitFor({ timeout: 15000 });
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
  await page.getByText('Account & Access').waitFor({ timeout: 15000 });
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
  await page.getByRole('button', { name: 'Back to Home' }).waitFor({ timeout: 15000 });
  const appMenuVisible = await page.getByRole('button', { name: 'Settings' }).count();
  if (appMenuVisible > 0) throw new Error('App navigation is visible on legal page.');
  await context.close();
  return assertNoRuntimeErrors(`legal standalone (${profile})`, telemetry);
}

async function testLandingCtas(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('/'), { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Try Free AI Demo' }).click();
  await page.getByText('Type a goal and see how FleetOS responds.').waitFor({ timeout: 15000 });
  await page.locator('#interactive-demo').getByRole('button', { name: 'Try Interactive Demo' }).click();
  await page.getByText(/FleetOS Response #2/).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.waitForURL('**/#/onboarding', { timeout: 10000 });
  await page.getByText('Connect Your First Tesla').waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`landing CTA to onboarding (${profile})`, telemetry);
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
    [`landing CTA to onboarding (${profile})`, () => testLandingCtas(browser, profile)],
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
