import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

globalThis.__fleetosAssetRecords = globalThis.__fleetosAssetRecords || {};

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

async function listAssetRecords() {
  if (!hasPostgres()) return globalThis.__fleetosAssetRecords;
  await ensureFleetSchema();
  const { rows } = await query(`
    select vehicle_key, model, model_year, trim, color, tag, purchase_date, purchase_year,
      price_paid, current_balance, lender, monthly_payment, insurance_renewal, registration_state, record
    from fleetos_vehicle_assets
    order by updated_at desc
  `);
  return Object.fromEntries(rows.map((row) => [row.vehicle_key, rowToRecord(row)]));
}

async function saveAssetRecord(key, record) {
  const normalized = normalizeRecord(record);
  if (!hasPostgres()) {
    globalThis.__fleetosAssetRecords = {
      ...globalThis.__fleetosAssetRecords,
      [key]: normalized,
    };
    return globalThis.__fleetosAssetRecords;
  }

  await ensureFleetSchema();
  await query(
    `insert into fleetos_vehicle_assets (
      vehicle_key, vin, model, model_year, trim, color, tag, purchase_date, purchase_year,
      price_paid, current_balance, lender, monthly_payment, insurance_renewal, registration_state, record, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
    on conflict (vehicle_key) do update set
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
      key,
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
  return listAssetRecords();
}

async function deleteAssetRecords(key) {
  if (!hasPostgres()) {
    if (key) {
      const next = { ...globalThis.__fleetosAssetRecords };
      delete next[key];
      globalThis.__fleetosAssetRecords = next;
    } else {
      globalThis.__fleetosAssetRecords = {};
    }
    return globalThis.__fleetosAssetRecords;
  }

  await ensureFleetSchema();
  if (key) {
    await query('delete from fleetos_vehicle_assets where vehicle_key = $1', [key]);
  } else {
    await query('delete from fleetos_vehicle_assets');
  }
  return listAssetRecords();
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ records: await listAssetRecords(), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'POST') {
    const key = req.body?.key;
    const record = req.body?.record;

    if (!key || !record) {
      res.status(400).json({ error: 'ASSET_RECORD_MISSING' });
      return;
    }

    res.status(200).json({ records: await saveAssetRecord(key, record), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'DELETE') {
    const key = req.query?.key;
    res.status(200).json({ records: await deleteAssetRecords(key), postgres: hasPostgres() });
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
