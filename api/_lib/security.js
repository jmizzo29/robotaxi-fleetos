import { getSession } from './auth.js';
import { ensureFleetSchema, query } from './db.js';

function splitEnv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function redactEmail(email) {
  const value = String(email || '');
  const [name, domain] = value.split('@');
  if (!name || !domain) return value ? 'redacted' : '';
  return `${name.slice(0, 2)}***@${domain}`;
}

export function redactLead(row = {}) {
  return {
    id: row.id,
    name: row.name ? `${String(row.name).slice(0, 1)}***` : '',
    email: redactEmail(row.email),
    teslaCount: row.tesla_count,
    useCase: row.use_case,
    plan: row.plan,
    createdAt: row.created_at,
  };
}

export function redactFeedback(row = {}) {
  return {
    id: row.id,
    type: row.type,
    rating: row.rating,
    title: row.title,
    detail: row.detail ? '[redacted: support detail hidden]' : '',
    route: row.route,
    email: redactEmail(row.email),
    createdAt: row.created_at,
  };
}

export function roundCoordinate(value, precision = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return Number(number.toFixed(precision));
}

export function privacyMode(req) {
  const requested = String(req.query?.privacy || req.headers['x-fleetos-privacy'] || '').toLowerCase();
  if (requested === 'precise') return 'precise';
  if (requested === 'rounded') return 'rounded';
  return process.env.LOCATION_PRIVACY_MODE || 'rounded';
}

export function applyVehiclePrivacy(vehicle, mode = 'rounded') {
  if (mode === 'precise') return vehicle;
  return {
    ...vehicle,
    latitude: roundCoordinate(vehicle.latitude),
    longitude: roundCoordinate(vehicle.longitude),
    drive_state: vehicle.drive_state ? {
      ...vehicle.drive_state,
      latitude: roundCoordinate(vehicle.drive_state.latitude),
      longitude: roundCoordinate(vehicle.drive_state.longitude),
    } : vehicle.drive_state,
    location_data: vehicle.location_data ? {
      ...vehicle.location_data,
      latitude: roundCoordinate(vehicle.location_data.latitude),
      longitude: roundCoordinate(vehicle.location_data.longitude),
    } : vehicle.location_data,
  };
}

export async function auditEvent({ userId = null, action, resource = null, metadata = {} }) {
  await ensureFleetSchema();
  await query(
    `insert into fleetos_audit_events (user_id, action, resource, metadata)
     values ($1, $2, $3, $4)`,
    [userId, action, resource, JSON.stringify(metadata || {})],
  );
}

export async function requireAdmin(req, res) {
  const session = await getSession(req, res, { create: false });
  if (!session?.user) {
    const error = new Error('Admin login required.');
    error.status = 401;
    throw error;
  }

  const adminEmails = splitEnv(process.env.ADMIN_EMAILS || process.env.FLEETOS_ADMIN_EMAILS);
  const adminUserIds = splitEnv(process.env.ADMIN_USER_IDS || process.env.FLEETOS_ADMIN_USER_IDS);
  const email = String(session.user.email || '').toLowerCase();
  const userId = String(session.user.externalAuthId || session.user.id || '').toLowerCase();
  const allowed = session.user.role === 'admin' || adminEmails.includes(email) || adminUserIds.includes(userId);

  if (!allowed) {
    await auditEvent({
      userId: session.userId,
      action: 'admin_denied',
      resource: 'admin',
      metadata: { email },
    }).catch(() => {});
    const error = new Error('This account is not authorized for ROBOAGENT admin.');
    error.status = 403;
    throw error;
  }

  await auditEvent({
    userId: session.userId,
    action: 'admin_access',
    resource: 'admin',
    metadata: { email },
  }).catch(() => {});

  return session;
}
