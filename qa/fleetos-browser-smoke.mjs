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
  await page.getByText('RoboAgent', { exact: true }).first().waitFor({ timeout: 15000 });
  if (profile === 'desktop') {
    const commandCenter = page.locator('[data-testid="agent-command-center"]');
    await commandCenter.getByText('The AI agent is the product.').waitFor({ timeout: 15000 });
    await commandCenter.getByText('Dynamic pricing', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('Predictive maintenance', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('Profitability insight', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('7:04 AM AI plan ready').waitFor({ timeout: 15000 });
    await commandCenter.getByRole('button', { name: 'Approve Plan' }).waitFor({ timeout: 15000 });
    await commandCenter.getByRole('button', { name: 'Ask Follow-up' }).waitFor({ timeout: 15000 });
    if (await commandCenter.getByRole('img').count()) {
      throw new Error('Desktop command center should focus on the agent UI, not the old vehicle photo.');
    }
    await page.getByRole('button', { name: 'Start Free', exact: true }).first().waitFor({ timeout: 15000 });
    if (await page.locator('#hero-agent-input').count()) {
      throw new Error('Desktop landing should not show the old stacked AI demo input.');
    }
    if (await page.getByText('Simple, fair pricing.').count()) {
      throw new Error('Desktop landing should not show the old pricing section.');
    }
  } else {
    await page.getByRole('button', { name: 'Start Free' }).first().waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Try AI Agent' }).waitFor({ timeout: 15000 });
    await page.getByText('Secure Tesla Login').waitFor({ timeout: 15000 });
    const mobilePreview = page.locator('[data-testid="mobile-hero-preview"]');
    await mobilePreview.waitFor({ timeout: 15000 });
    await mobilePreview.getByText('AI Agent').waitFor({ timeout: 15000 });
    await mobilePreview.getByText("Today's Plan").waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Active').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Pricing', { exact: true }).waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Maintenance', { exact: true }).waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Charging', { exact: true }).waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Profit', { exact: true }).waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Model Y - Orlando').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('Model 3 - Tampa').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('18 trips').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('1,284 mi').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('$2.4k').waitFor({ timeout: 15000 });
    await mobilePreview.getByText('AI Brief').waitFor({ timeout: 15000 });
    const ctaBox = await page.getByRole('button', { name: 'Start Free' }).first().boundingBox();
    const previewBox = await mobilePreview.boundingBox();
    if (!ctaBox || !previewBox || ctaBox.y >= previewBox.y) {
      throw new Error('Mobile Start Free CTA should appear above the preview card.');
    }
    if (await page.locator('[data-testid="mobile-trust-bar"]').count()) {
      throw new Error('Mobile trust snippet should not be visible under the primary CTA buttons.');
    }
    if (await page.getByText('Create account first, then connect Tesla').count()) {
      throw new Error('Old mobile helper text should not be visible under the CTA buttons.');
    }
    if (await page.locator('[data-testid="mobile-hero-agent-demo"] #mobile-hero-agent-input:visible').count()) {
      throw new Error('Mobile AI demo should be hidden before tapping See More.');
    }
    if (await page.getByText('Your Tesla login stays with Tesla.').count()) {
      throw new Error('Mobile details should be hidden before tapping See More.');
    }
    if (await page.getByText('1-10 Cars').count()) {
      throw new Error('Old 1-10 Cars badge should not be visible on mobile.');
    }
    if (await mobilePreview.getByRole('img', { name: 'Tesla Cybercab concept on display' }).count()) {
      throw new Error('Mobile first preview should show the owner dashboard, not vehicle photo cards.');
    }
    await page.getByRole('button', { name: 'Try AI Agent' }).click();
    const mobileDemo = page.locator('[data-testid="mobile-hero-agent-demo"]');
    await mobileDemo.getByText('No signup needed', { exact: true }).waitFor({ timeout: 15000 });
    await page.locator('#mobile-hero-agent-input').waitFor({ timeout: 15000 });
    const heroGoal = await page.locator('#mobile-hero-agent-input').inputValue();
    if (heroGoal !== 'How many Model X rentals are available in Orlando?') {
      throw new Error(`Unexpected hero agent prompt after See More: ${heroGoal}`);
    }
    await mobileDemo.getByText('Model X rental availability in Orlando').waitFor({ timeout: 15000 });
    await mobileDemo.getByText('8-16 comparable rentals').waitFor({ timeout: 15000 });
    await mobileDemo.getByRole('button', { name: 'Ask Agent' }).waitFor({ timeout: 15000 });
    await page.getByText('Your Tesla login stays with Tesla.').waitFor({ timeout: 15000 });
  }
  await page.getByText('Join Early Access').count().then((count) => {
    if (count > 0) throw new Error('Old Join Early Access form is visible.');
  });
  await page.getByText('AI Agent for Tesla Owners').count().then((count) => {
    if (count > 0) throw new Error('Removed hero eyebrow is still visible.');
  });
  await page.getByText('Secure Tesla OAuth').count().then((count) => {
    if (count > 0) throw new Error('Removed Secure Tesla OAuth badge is still visible.');
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
  if (profile === 'mobile') {
    await page.getByText('Dashboard unlocks after Tesla connection and the first telemetry sync.').waitFor({ timeout: 15000 });
  } else {
    await page.getByText('Finish Tesla connection and first telemetry sync').waitFor({ timeout: 15000 });
  }
  const dashboard = page.getByRole('button', { name: 'Open Dashboard' });
  if (!(await dashboard.isDisabled())) throw new Error('Open Dashboard should be disabled before first sync.');
  await context.close();
  return assertNoRuntimeErrors(`onboarding standalone (${profile})`, telemetry);
}

async function testAccountStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/account'), { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Sign in to RoboAgent' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Preview Tesla Data Permissions' }).click();
  await page.getByRole('heading', { name: 'RoboAgent wants to connect to your Tesla Account' }).waitFor({ timeout: 15000 });
  const allowAccess = page.getByRole('button', { name: 'Allow Access' });
  if (!(await allowAccess.isDisabled())) throw new Error('Allow Access should require both consent checkboxes.');
  await page.getByLabel('I understand that RoboAgent is a third-party app and is not affiliated with Tesla.').check();
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
  await page.getByText('RoboAgent Privacy Notice').waitFor({ timeout: 15000 });
  await page.getByText('What Data Does RoboAgent Access?').waitFor({ timeout: 15000 });
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
  await page.getByText('My Tesla Vehicle Map').waitFor({ timeout: 15000 });
  await page.getByText('My Vehicle Map').waitFor({ timeout: 15000 });
  await page.getByText('Ready / Available').waitFor({ timeout: 15000 });
  await page.getByText('In Rental / In Use').waitFor({ timeout: 15000 });
  await page.getByText('Demand and pricing zones').waitFor({ timeout: 15000 });
  await page.getByText('Health on the map').waitFor({ timeout: 15000 });
  await page.getByText('Local Rental Market').waitFor({ timeout: 15000 });
  await page.getByText('Top rented Teslas near').waitFor({ timeout: 15000 });
  await page.getByText('Recommended pricing zone').first().waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`service areas map (${profile})`, telemetry);
}

async function testLandingCtas(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('/'), { waitUntil: 'networkidle' });
  if (profile === 'desktop') {
    await page.getByRole('button', { name: 'Start Free', exact: true }).first().click();
    await page.waitForURL('**/#/onboarding', { timeout: 10000 });
    await page.getByText('Connect Your First Tesla').waitFor({ timeout: 15000 });
  } else {
    await page.getByRole('button', { name: 'Try AI Agent' }).click();
    await page.locator('#mobile-hero-agent-input').waitFor({ timeout: 15000 });
    const heroInput = page.locator('#mobile-hero-agent-input');
    await heroInput.fill('Should I raise price this weekend in Tampa?');
    await page.locator('[data-testid="mobile-hero-agent-demo"]').getByRole('button', { name: 'Ask Agent' }).click();
    await page.getByText('Turo revenue plan').first().waitFor({ timeout: 15000 });
    await heroInput.fill('What are the top rented Teslas in Orlando?');
    await page.locator('[data-testid="mobile-hero-agent-demo"]').getByRole('button', { name: 'Ask Agent' }).click();
    await page.getByText('Top rented Teslas in Orlando').first().waitFor({ timeout: 15000 });
    await heroInput.fill('How many Model X rentals are available in Orlando?');
    await page.locator('[data-testid="mobile-hero-agent-demo"]').getByRole('button', { name: 'Ask Agent' }).click();
    await page.getByText('Model X rental availability in Orlando').first().waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Start Free' }).first().click();
    await page.waitForURL('**/#/onboarding', { timeout: 10000 });
    await page.getByText('Sign in to RoboAgent before connecting Tesla').waitFor({ timeout: 15000 });
  }
  await context.close();
  return assertNoRuntimeErrors(`landing CTA to onboarding (${profile})`, telemetry);
}

async function testOwnerValueDashboard(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/overview'), { waitUntil: 'networkidle' });
  const dashboard = page.locator('[data-testid="owner-value-dashboard"]:visible').first();
  await dashboard.getByText('Vehicle Readiness').waitFor({ timeout: 15000 });
  await dashboard.getByText('Next action:').waitFor({ timeout: 15000 });
  await dashboard.getByText('AI fleet brief').waitFor({ timeout: 15000 });
  await dashboard.getByText("Today's AI Brief").waitFor({ timeout: 15000 });
  await dashboard.getByText('Pricing Opportunities').waitFor({ timeout: 15000 });
  await dashboard.getByText('Maintenance Watch').waitFor({ timeout: 15000 });
  await dashboard.getByText('Charging Plan').waitFor({ timeout: 15000 });
  await dashboard.getByText('Estimated Earnings Impact').waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`owner value dashboard (${profile})`, telemetry);
}

async function testAiOperations(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/ai'), { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Ask your fleet agent anything' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Ask RoboAgent' }).waitFor({ timeout: 15000 });
  await page.getByText('Operator Next Best Actions').waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`ai operations (${profile})`, telemetry);
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
    [`ai operations (${profile})`, () => testAiOperations(browser, profile)],
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
