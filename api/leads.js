const globalStore = globalThis.__fleetosLeadStore || { leads: [] };
globalThis.__fleetosLeadStore = globalStore;

function normalizeLead(body = {}) {
  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    teslaCount: String(body.teslaCount || '1').trim(),
    useCase: String(body.useCase || 'Owner rental').trim(),
    plan: String(body.plan || 'First Tesla free').trim(),
    createdAt: new Date().toISOString(),
  };
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      count: globalStore.leads.length,
      leads: globalStore.leads.slice(0, 25),
    });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const lead = normalizeLead(req.body);

  if (!lead.email || !lead.email.includes('@')) {
    res.status(400).json({
      error: 'EMAIL_REQUIRED',
      message: 'Enter a valid email address.',
    });
    return;
  }

  globalStore.leads.unshift(lead);
  globalStore.leads.splice(100);

  console.log('FleetOS early access lead', {
    email: lead.email,
    teslaCount: lead.teslaCount,
    useCase: lead.useCase,
    plan: lead.plan,
  });

  res.status(201).json({ ok: true, lead });
}
