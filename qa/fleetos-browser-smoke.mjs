import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const BASE_URL = (process.env.FLEETOS_QA_BASE_URL || process.argv[2] || 'https://roboagent-fleet.vercel.app').replace(/\/$/, '');
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
    const failure = request.failure()?.errorText;
    if (
      !url.includes('api.mapbox.com') &&
      !url.includes('events.clerk') &&
      !(url.includes('/api/ai/analyze') && failure === 'net::ERR_ABORTED')
    ) {
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
  await page.goto(routeUrl('?qa=browser'), { waitUntil: 'domcontentloaded' });
  const main = page.getByRole('main');
  await page.getByText('The Fleet Operating System for Tesla Robotaxi Owners').waitFor({ timeout: 15000 });
  await page.getByText('Manage vehicles, maximize revenue, protect assets').waitFor({ timeout: 15000 });
  await main.getByText('ROBOAGENT', { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByText('Every Day, Owners Need Answers').waitFor({ timeout: 15000 });
  await page.getByText('How much money did I make?').waitFor({ timeout: 15000 });
  await page.getByText('Tesla Manages Vehicles.').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Connect Tesla' }).first().waitFor({ timeout: 15000 });
  if (await page.locator('[data-testid="agent-command-center"]').count()) {
    throw new Error('Agent command center should live on About, not the home page.');
  }
  if (await page.locator('[data-testid="mobile-hero-preview"]').count()) {
    throw new Error('Old mobile dashboard preview should not be on the home page.');
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

async function testAboutAgent(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/about'), { waitUntil: 'networkidle' });
  await page.getByText('ROBOAGENT', { exact: true }).first().waitFor({ timeout: 15000 });
  if (profile === 'desktop') {
    const commandCenter = page.locator('[data-testid="agent-command-center"]');
    await commandCenter.getByText('The AI agent is the product.').waitFor({ timeout: 15000 });
    await commandCenter.getByText('DYNAMIC PRICING', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('PREDICTIVE MAINTENANCE', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('PROFITABILITY INSIGHT', { exact: true }).waitFor({ timeout: 15000 });
    await commandCenter.getByText('7:04 AM AI Plan Ready').waitFor({ timeout: 15000 });
    await commandCenter.getByRole('button', { name: 'Approve Plan' }).waitFor({ timeout: 15000 });
    await commandCenter.getByRole('button', { name: 'Ask Follow-up' }).waitFor({ timeout: 15000 });
  } else {
    await page.getByRole('button', { name: 'Start Free' }).first().waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Try AI Agent' }).click();
    const mobileDemo = page.locator('[data-testid="mobile-hero-agent-demo"]');
    await mobileDemo.getByText('Ask about your Tesla business.').waitFor({ timeout: 15000 });
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
  await context.close();
  return assertNoRuntimeErrors(`about agent smoke (${profile})`, telemetry);
}

async function testAgentChat(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/agent'), { waitUntil: 'networkidle' });
  await page.locator('[data-testid="agent-online-status"]').getByText('Online').waitFor({ timeout: 15000 });
  await page.getByText('Good morning! I\'ve analyzed your fleet.').waitFor({ timeout: 15000 });
  await page.locator('#public-agent-question').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Ask ROBOAGENT' }).waitFor({ timeout: 15000 });
  await page.getByText('$1,284 projected').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Daily Plan' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Pricing Advice' }).waitFor({ timeout: 15000 });
  await page.locator('#public-agent-question').fill('Should I raise price this weekend in Tampa?');
  await page.getByRole('button', { name: 'Ask ROBOAGENT' }).click();
  await page.getByText('+$284 projected').waitFor({ timeout: 15000 });
  await page.locator('#public-agent-question').fill('How many Model X rentals are available in Orlando?');
  await page.getByRole('button', { name: 'Ask ROBOAGENT' }).click();
  await page.getByText('Orlando Model X: 8-16 comparable rentals').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Back home' }).waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`agent chat smoke (${profile})`, telemetry);
}

async function testOnboardingStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/onboarding'), { waitUntil: 'domcontentloaded' });
  await page.getByText('Create Your ROBOAGENT Account').waitFor({ timeout: 15000 });
  await page.getByText('Step 1 of 5').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Back Home' }).waitFor({ timeout: 15000 });
  await page.getByLabel('Email Address').waitFor({ timeout: 15000 });
  await page.getByLabel('Password').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Create Free Account' }).click();
  await page.getByText('Enter your email address.').waitFor({ timeout: 15000 });
  await page.getByText('Create a password.').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Google' }).waitFor({ timeout: 15000 });
  const sideMenuVisible = await page.getByRole('button', { name: 'Fleet', exact: true }).count();
  if (sideMenuVisible > 0) throw new Error('App navigation is visible on onboarding.');
  await context.close();
  return assertNoRuntimeErrors(`onboarding standalone (${profile})`, telemetry);
}

async function testAccountStandalone(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/account'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Sign in to ROBOAGENT' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Preview Tesla Data Permissions' }).click();
  await page.getByRole('heading', { name: 'ROBOAGENT wants to connect to your Tesla Account' }).waitFor({ timeout: 15000 });
  const allowAccess = page.getByRole('button', { name: 'Allow Access' });
  if (!(await allowAccess.isDisabled())) throw new Error('Allow Access should require both consent checkboxes.');
  await page.getByLabel('I understand that ROBOAGENT is a third-party app and is not affiliated with Tesla.').check();
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
  await page.getByText('ROBOAGENT Privacy Notice').waitFor({ timeout: 15000 });
  await page.getByText('What Data Does ROBOAGENT Access?').waitFor({ timeout: 15000 });
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
  const openHowItWorks = async () => {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('button').filter({ hasText: 'How it works' }).click();
    await page.waitForURL('**/#/how-it-works', { timeout: 10000 });
    await page.getByText('steps · you approve everything').waitFor({ timeout: 15000 });
    await page.getByText('Connect your Tesla').waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Back to home' }).click();
    await page.waitForURL('**/#/landing', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/', { timeout: 10000 });
    });
  };

  if (profile === 'desktop') {
    await openHowItWorks();
    await page.getByRole('button', { name: 'Connect Tesla' }).first().click();
    await page.waitForURL('**/#/onboarding', { timeout: 10000 });
    await page.getByText('Create Your ROBOAGENT Account').waitFor({ timeout: 15000 });
  } else {
    await openHowItWorks();
    await page.getByRole('button', { name: 'Connect Tesla' }).first().click();
    await page.waitForURL('**/#/onboarding', { timeout: 10000 });
    await page.getByText('Create Your ROBOAGENT Account').waitFor({ timeout: 15000 });
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
  await page.getByRole('button', { name: 'Ask ROBOAGENT' }).waitFor({ timeout: 15000 });
  await page.getByText('Operator Next Best Actions').waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`ai operations (${profile})`, telemetry);
}

async function testIntegrations(browser, profile) {
  const telemetry = await makePage(browser, profile);
  const { page, context } = telemetry;
  await page.goto(routeUrl('#/integrations'), { waitUntil: 'domcontentloaded' });
  await page.getByText('Tesla Robotaxi / Cybercab Updates from X').waitFor({ timeout: 15000 });
  await page.getByText(/X API Ready|Demo Feed/).waitFor({ timeout: 15000 });
  await page.getByRole('heading', { name: 'Tesla Fleet API' }).waitFor({ timeout: 15000 });
  await page.getByRole('heading', { name: 'Current Connected State' }).waitFor({ timeout: 15000 });
  await context.close();
  return assertNoRuntimeErrors(`integrations social signal (${profile})`, telemetry);
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
    [`agent chat smoke (${profile})`, () => testAgentChat(browser, profile)],
    [`about agent smoke (${profile})`, () => testAboutAgent(browser, profile)],
    [`onboarding standalone (${profile})`, () => testOnboardingStandalone(browser, profile)],
    [`account standalone (${profile})`, () => testAccountStandalone(browser, profile)],
    [`legal standalone (${profile})`, () => testLegalStandalone(browser, profile)],
    [`service areas map (${profile})`, () => testServiceAreasMap(browser, profile)],
    [`landing CTA to onboarding (${profile})`, () => testLandingCtas(browser, profile)],
    [`owner value dashboard (${profile})`, () => testOwnerValueDashboard(browser, profile)],
    [`ai operations (${profile})`, () => testAiOperations(browser, profile)],
    [`integrations social signal (${profile})`, () => testIntegrations(browser, profile)],
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
