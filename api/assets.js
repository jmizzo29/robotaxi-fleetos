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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ records: globalThis.__fleetosAssetRecords });
    return;
  }

  if (req.method === 'POST') {
    const key = req.body?.key;
    const record = req.body?.record;

    if (!key || !record) {
      res.status(400).json({ error: 'ASSET_RECORD_MISSING' });
      return;
    }

    globalThis.__fleetosAssetRecords = {
      ...globalThis.__fleetosAssetRecords,
      [key]: normalizeRecord(record),
    };

    res.status(200).json({ records: globalThis.__fleetosAssetRecords });
    return;
  }

  if (req.method === 'DELETE') {
    const key = req.query?.key;

    if (key) {
      const next = { ...globalThis.__fleetosAssetRecords };
      delete next[key];
      globalThis.__fleetosAssetRecords = next;
    } else {
      globalThis.__fleetosAssetRecords = {};
    }

    res.status(200).json({ records: globalThis.__fleetosAssetRecords });
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
