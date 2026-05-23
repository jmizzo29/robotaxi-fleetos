import { getDefaultFleetForSession } from './_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

const numericFields = new Set([
  'modelYear',
  'purchaseYear',
  'pricePaid',
  'currentBalance',
  'monthlyPayment',
]);

function normalizeRecord(record = {}) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      numericFields.has(key) && value !== '' && value !== null ? Number(value) : value,
    ]),
  );
}

function rowToRecord(row) {
  return normalizeRecord(row.record || {
    model: row.model,
    modelYear: row.model_year,
    trim: row.trim,
    color: row.color,
    tag: row.tag,
    purchaseDate: row.purchase_date,
    purchaseYear: row.purchase_year,
    pricePaid: row.price_paid,
    currentBalance: row.current_balance,
    lender: row.lender,
    monthlyPayment: row.monthly_payment,
    insuranceRenewal: row.insurance_renewal,
    registrationState: row.registration_state,
  });
}

function scopedKey(fleetId, key) {
  return `${fleetId}:${key}`;
}

function unscopedKey(fleetId, key) {
  const prefix = `${fleetId}:`;
  return String(key || '').startsWith(prefix) ? String(key).slice(prefix.length) : key;
}

async function listAssetRecords(fleetId) {
  await ensureFleetSchema();
  const { rows } = await query(`
    select vehicle_key, model, model_year, trim, color, tag, purchase_date, purchase_year,
      price_paid, current_balance, lender, monthly_payment, insurance_renewal, registration_state, record
    from fleetos_vehicle_assets
    where fleet_id = $1
    order by updated_at desc
  `, [fleetId]);
  return Object.fromEntries(rows.map((row) => [unscopedKey(fleetId, row.vehicle_key), rowToRecord(row)]));
}

async function saveAssetRecord(fleetId, key, record) {
  const normalized = normalizeRecord(record);
  const storageKey = scopedKey(fleetId, key);
  await ensureFleetSchema();
  await query(
    `insert into fleetos_vehicle_assets (
      vehicle_key, fleet_id, vin, model, model_year, trim, color, tag, purchase_date, purchase_year,
      price_paid, current_balance, lender, monthly_payment, insurance_renewal, registration_state, record, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now())
    on conflict (vehicle_key) do update set
      fleet_id = excluded.fleet_id,
      vin = excluded.vin,
      model = excluded.model,
      model_year = excluded.model_year,
      trim = excluded.trim,
      color = excluded.color,
      tag = excluded.tag,
      purchase_date = excluded.purchase_date,
      purchase_year = excluded.purchase_year,
      price_paid = excluded.price_paid,
      current_balance = excluded.current_balance,
      lender = excluded.lender,
      monthly_payment = excluded.monthly_payment,
      insurance_renewal = excluded.insurance_renewal,
      registration_state = excluded.registration_state,
      record = excluded.record,
      updated_at = now()`,
    [
      storageKey,
      fleetId,
      normalized.vin || null,
      normalized.model || null,
      normalized.modelYear || null,
      normalized.trim || null,
      normalized.color || null,
      normalized.tag || null,
      normalized.purchaseDate || null,
      normalized.purchaseYear || null,
      normalized.pricePaid || null,
      normalized.currentBalance || null,
      normalized.lender || null,
      normalized.monthlyPayment || null,
      normalized.insuranceRenewal || null,
      normalized.registrationState || null,
      JSON.stringify(normalized),
    ],
  );
  return listAssetRecords(fleetId);
}

async function deleteAssetRecords(fleetId, key) {
  await ensureFleetSchema();
  if (key) {
    await query('delete from fleetos_vehicle_assets where fleet_id = $1 and vehicle_key = $2', [fleetId, scopedKey(fleetId, key)]);
  } else {
    await query('delete from fleetos_vehicle_assets where fleet_id = $1', [fleetId]);
  }
  return listAssetRecords(fleetId);
}

export default async function handler(req, res) {
  try {
    if (!hasPostgres()) {
      res.status(503).json({
        error: 'DATABASE_REQUIRED',
        message: 'Postgres DATABASE_URL is required for asset records.',
      });
      return;
    }

    if (req.method === 'GET') {
      const context = await getDefaultFleetForSession(req, res);
      if (!context?.fleet?.id) {
        res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to load vehicle asset records.' });
        return;
      }
      res.status(200).json({ records: await listAssetRecords(context.fleet.id), postgres: hasPostgres() });
      return;
    }

    if (req.method === 'POST') {
      const context = await getDefaultFleetForSession(req, res);
      if (!context?.fleet?.id) {
        res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to save vehicle asset records.' });
        return;
      }
      const key = req.body?.key;
      const record = req.body?.record;

      if (!key || !record) {
        res.status(400).json({ error: 'ASSET_RECORD_MISSING' });
        return;
      }

      res.status(200).json({ records: await saveAssetRecord(context.fleet.id, key, record), postgres: hasPostgres() });
      return;
    }

    if (req.method === 'DELETE') {
      const context = await getDefaultFleetForSession(req, res);
      if (!context?.fleet?.id) {
        res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to delete vehicle asset records.' });
        return;
      }
      const key = req.query?.key;
      res.status(200).json({ records: await deleteAssetRecords(context.fleet.id, key), postgres: hasPostgres() });
      return;
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    const status = error.statusCode || error.status || 500;
    res.status(status === 401 ? 401 : 500).json({
      error: status === 401 ? 'LOGIN_REQUIRED' : 'ASSET_RECORDS_FAILED',
      message: status === 401 ? 'Sign in to manage vehicle asset records.' : 'Vehicle asset records failed.',
    });
  }
}
