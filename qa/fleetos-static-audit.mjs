import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'api');
const SRC_DIR = path.join(ROOT, 'src');
const REPORT_DIR = path.join(ROOT, 'qa', 'reports');

const publicApiAllowlist = new Set([
  'api/health.js',
  'api/leads.js',
  'api/feedback.js',
  'api/auth/login.js',
  'api/auth/logout.js',
  'api/auth/register.js',
  'api/auth/magic/request.js',
  'api/auth/magic/verify.js',
  'api/tesla/callback.js',
]);

const routeSessionPatterns = [
  'getSession(',
  'getDefaultFleetForSession(',
  'getTeslaConnectionForSession(',
  'teslaRequestForSession(',
  'getBillingStatusForSession(',
  'requireAdmin(',
  'deleteCurrentUserData(',
  'disconnectTesla(',
];

function normalizePath(file) {
  return file.replaceAll('\\', '/');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'reports'].includes(entry.name)) return [];
      return walk(full);
    }
    return full;
  }));
  return files.flat();
}

async function read(file) {
  return fs.readFile(file, 'utf8');
}

function result(status, name, detail, evidence = {}) {
  return { status, name, detail, evidence };
}

function pass(name, detail, evidence) {
  return result('pass', name, detail, evidence);
}

function warn(name, detail, evidence) {
  return result('warn', name, detail, evidence);
}

function fail(name, detail, evidence) {
  return result('fail', name, detail, evidence);
}

async function auditApiAuthGates(apiFiles) {
  const findings = [];
  for (const file of apiFiles) {
    const rel = normalizePath(path.relative(ROOT, file));
    if (!rel.endsWith('.js')) continue;
    if (rel.includes('/_lib/')) continue;
    if (publicApiAllowlist.has(rel)) continue;

    const text = await read(file);
    const hasSessionGate = routeSessionPatterns.some((pattern) => text.includes(pattern));
    if (!hasSessionGate) findings.push(rel);
  }

  if (findings.length > 0) {
    return fail('API auth gate scan', 'Some non-public API routes do not appear to reference a session/admin/Tesla gate.', { findings });
  }
  return pass('API auth gate scan', 'All non-public API routes reference a session/admin/Tesla gate.');
}

async function auditAdminLocalStorage(srcFiles) {
  const findings = [];
  for (const file of srcFiles) {
    const rel = normalizePath(path.relative(ROOT, file));
    const text = await read(file);
    if (text.includes('fleetos.adminAccess') || text.includes('VITE_ADMIN_INVITE_CODE')) {
      findings.push(rel);
    }
  }

  if (findings.length > 0) {
    return fail('no client-side admin gate', 'Client-side admin unlock remnants found.', { findings });
  }
  return pass('no client-side admin gate', 'No client-side admin-code gate detected.');
}

async function auditSecretLeak(files) {
  const riskyPatterns = [
    /sk_(test|live)_[A-Za-z0-9_-]{12,}/,
    /npg_[A-Za-z0-9]{8,}/,
    /refresh_token\s*[:=]\s*['"][^'"]+/i,
    /TESLA_CLIENT_SECRET\s*=\s*[^'\s]+/,
    /CLERK_SECRET_KEY\s*=\s*[^'\s]+/,
  ];
  const findings = [];

  for (const file of files) {
    const rel = normalizePath(path.relative(ROOT, file));
    if (rel.includes('package-lock.json')) continue;
    if (rel.includes('qa/reports/')) continue;
    if (rel === '.env' || rel === '.env.local' || rel === 'backend/.env' || rel === 'backend/.env.local') continue;
    const text = await read(file);
    riskyPatterns.forEach((pattern) => {
      if (pattern.test(text)) findings.push({ file: rel, pattern: String(pattern) });
    });
  }

  if (findings.length > 0) {
    return fail('secret leak scan', 'Potential secrets or token material found in repo files.', { findings });
  }
  return pass('secret leak scan', 'No obvious secret key/token patterns found in repo files.');
}

async function auditTeslaDiagnostics() {
  const file = path.join(API_DIR, 'tesla', 'diagnostics.js');
  const text = await read(file);
  const risky = [
    'process.env.TESLA_CLIENT_SECRET',
    'process.env.TESLA_CLIENT_ID',
    'refresh_token_enc',
    'access_token_enc',
  ].filter((needle) => text.includes(`${needle},`) || text.includes(`: ${needle}`));

  if (risky.length > 0) {
    return fail('Tesla diagnostics redaction', 'Diagnostics may expose sensitive env/token values directly.', { risky });
  }
  return pass('Tesla diagnostics redaction', 'Diagnostics exposes booleans/status, not raw Tesla secrets.');
}

async function auditPrivacyDefault() {
  const securityFile = await read(path.join(API_DIR, '_lib', 'security.js'));
  const vehicleFile = await read(path.join(API_DIR, 'vehicles.js'));
  const hasRoundedDefault = securityFile.includes("return process.env.LOCATION_PRIVACY_MODE || 'rounded'");
  const appliesPrivacy = vehicleFile.includes('applyVehiclePrivacy');

  if (!hasRoundedDefault || !appliesPrivacy) {
    return fail('location privacy default', 'Vehicle API does not clearly apply rounded location privacy by default.', {
      hasRoundedDefault,
      appliesPrivacy,
    });
  }
  return pass('location privacy default', 'Vehicle API applies rounded location privacy by default.');
}

async function auditDeleteDataScope() {
  const authFile = await read(path.join(API_DIR, '_lib', 'auth.js'));
  const hasFleetScope = authFile.includes('where owner_user_id = $1') && authFile.includes('fleet_id = any($1::text[])');
  const deletesAllVehicles = /delete\s+from\s+fleetos_vehicles(?![\s\S]{0,80}where\s+fleet_id)/i.test(authFile);

  if (!hasFleetScope || deletesAllVehicles) {
    return fail('delete-data user scope', 'Delete-data logic may not be tightly scoped to the current user fleets.', {
      hasFleetScope,
      deletesAllVehicles,
    });
  }
  return pass('delete-data user scope', 'Delete-data logic is scoped through the current user fleets.');
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
    generatedAt: new Date().toISOString(),
    summary: summarize(results),
    results,
  };
  const file = path.join(REPORT_DIR, 'fleetos-static-audit-latest.json');
  await fs.writeFile(file, JSON.stringify(payload, null, 2));
  return { file, summary: payload.summary };
}

const [apiFiles, srcFiles, allFiles] = await Promise.all([
  walk(API_DIR),
  walk(SRC_DIR),
  walk(ROOT),
]);

const sourceFiles = allFiles.filter((file) => /\.(js|jsx|mjs|json|md|sql|env|html)$/.test(file));
const results = [
  await auditApiAuthGates(apiFiles),
  await auditAdminLocalStorage(srcFiles),
  await auditSecretLeak(sourceFiles),
  await auditTeslaDiagnostics(),
  await auditPrivacyDefault(),
  await auditDeleteDataScope(),
];

results.forEach((item) => console.log(`${item.status.toUpperCase()} ${item.name}: ${item.detail}`));
const report = await writeReport(results);
console.log(`\nStatic audit summary: pass=${report.summary.pass} warn=${report.summary.warn} fail=${report.summary.fail}`);
console.log(`Report: ${report.file}`);

if (report.summary.fail > 0) {
  process.exitCode = 1;
}
