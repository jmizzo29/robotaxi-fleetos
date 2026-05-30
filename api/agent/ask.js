import { getDefaultFleetForSession, getSession } from '../_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from '../_lib/db.js';
import { buildFleetContextSignals, buildPricingSignalSummary, getExternalContextForVehicle } from '../_lib/externalContext.js';

const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'xai' ? 'grok-4' : 'claude-sonnet-4-5');

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function vehicleLabel(vehicle = {}) {
  return vehicle.display_name || vehicle.name || vehicle.tag || vehicle.vin || vehicle.id || 'Vehicle';
}

function normalizeVehicle(row = {}) {
  const raw = row.raw || {};
  return {
    id: row.id,
    vin: row.vin,
    teslaVehicleId: row.tesla_vehicle_id,
    name: row.display_name || raw.display_name || row.tag || row.vin,
    display_name: row.display_name,
    model: row.model || raw.vehicle_config?.car_type || raw.model,
    modelYear: row.model_year,
    trim: row.trim,
    color: row.color,
    tag: row.tag,
    state: row.state,
    status: row.status || row.state,
    battery: row.battery_level,
    latitude: row.latitude,
    longitude: row.longitude,
    heading: row.heading,
    speed: row.speed,
    odometer: row.odometer,
    chargingState: row.charging_state,
    softwareVersion: row.software_version,
    locked: row.locked,
    serviceMode: row.service_mode,
    syncedAt: row.last_synced_at,
    isReal: true,
  };
}

function normalizeRevenue(row = {}) {
  return {
    id: row.id,
    vehicleKey: row.vehicle_key,
    vehicleLabel: row.vehicle_label,
    date: row.record_date,
    source: row.source,
    amount: asNumber(row.amount),
    notes: row.notes || '',
  };
}

function normalizeMemory(row = {}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail || '',
    timestamp: row.event_timestamp,
    source: row.source,
    status: row.status,
    ragReady: Boolean(row.rag_ready),
    metadata: row.metadata || {},
  };
}

function tokenize(text) {
  return new Set(String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2));
}

function scoreMemory(question, event) {
  const queryTokens = tokenize(question);
  const eventTokens = tokenize(`${event.type} ${event.title} ${event.detail} ${JSON.stringify(event.metadata || {})}`);
  let overlap = 0;
  queryTokens.forEach((token) => {
    if (eventTokens.has(token)) overlap += 1;
  });
  if (event.ragReady) overlap += 1;
  if (String(event.type || '').toLowerCase().includes('rental')) overlap += 1;
  return overlap;
}

function selectRelevantMemory(question, events = []) {
  return events
    .map((event) => ({ event, score: scoreMemory(question, event) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.event);
}

function matchRevenueToVehicle(records = [], vehicle = {}) {
  const keys = new Set([vehicle.id, vehicle.vin, vehicle.name, vehicle.display_name, vehicle.tag].filter(Boolean).map(String));
  return records.filter((record) => keys.has(String(record.vehicleKey)) || keys.has(String(record.vehicleLabel)));
}

function latestRevenueRecord(records = []) {
  return [...records].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0] || null;
}

function revenueTotal(records = []) {
  return records.reduce((sum, record) => sum + asNumber(record.amount), 0);
}

function inferIntent(question) {
  const lower = String(question || '').toLowerCase();
  if (/(last|recent).*(rental|trip)|miles.*(rental|trip)|rental.*drive/.test(lower)) return 'last_rental';
  if (/price|pricing|rate|turo|demand|raise|lower/.test(lower)) return 'pricing';
  if (/charge|charging|battery|electric|rate/.test(lower)) return 'charging';
  if (/health|maintenance|service|tire|brake|clean/.test(lower)) return 'maintenance';
  if (/summary|fleet|today|brief|status/.test(lower)) return 'summary';
  return 'general';
}

function buildEvidence({ vehicles, revenueRecords, memory, externalContext }) {
  const evidence = [];
  if (vehicles.length) evidence.push({ label: 'Connected Tesla vehicles', detail: `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'} in the signed-in fleet.` });
  if (revenueRecords.length) evidence.push({ label: 'Revenue records', detail: `${revenueRecords.length} imported or manually entered earning record${revenueRecords.length === 1 ? '' : 's'}.` });
  if (memory.length) evidence.push({ label: 'Fleet memory', detail: `${memory.length} relevant historical event${memory.length === 1 ? '' : 's'} retrieved.` });
  if (externalContext?.weather?.source) evidence.push({ label: 'Weather context', detail: `${externalContext.weather.source}: ${externalContext.weather.temperature ?? 'n/a'} F, rain risk ${externalContext.weather.precipitationProbabilityMax8h ?? 0}%.` });
  if (externalContext?.electricRate?.source) evidence.push({ label: 'Electric-rate context', detail: externalContext.electricRate.chargingAdvice || externalContext.electricRate.source });
  return evidence;
}

function action(type, title, detail, priority = 'NORMAL', approvalRequired = true) {
  return {
    id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    title,
    detail,
    priority,
    approvalRequired,
    command: `${title}: ${detail}`,
  };
}

function buildHeuristicAnswer({ question, vehicles, revenueRecords, memory, externalContext, contextSignals, pricingSignals }) {
  const intent = inferIntent(question);
  const firstVehicle = vehicles[0] || {};
  const latestRevenue = latestRevenueRecord(revenueRecords);
  const relevantRentalMemory = memory.find((event) => /rental|trip/i.test(`${event.type} ${event.title} ${event.detail}`));
  const avgBattery = vehicles.length
    ? Math.round(vehicles.reduce((sum, vehicle) => sum + asNumber(vehicle.battery), 0) / vehicles.length)
    : null;
  const lowBatteryVehicles = vehicles.filter((vehicle) => asNumber(vehicle.battery, 100) < 45);
  const totalRevenue = revenueTotal(revenueRecords);
  const evidence = buildEvidence({ vehicles, revenueRecords, memory, externalContext });
  const confidenceReasons = [
    vehicles.length ? 'live fleet vehicles available' : 'no connected fleet vehicle found',
    revenueRecords.length ? 'revenue history available' : 'revenue history missing',
    memory.length ? 'fleet memory retrieved' : 'limited memory match',
    externalContext?.weather ? 'weather context available' : 'weather context unavailable',
  ];

  if (intent === 'last_rental') {
    const vehicle = vehicles.find((item) => matchRevenueToVehicle([latestRevenue], item).length) || firstVehicle;
    const miles = relevantRentalMemory?.metadata?.miles || relevantRentalMemory?.metadata?.distance || null;
    const earned = latestRevenue?.amount || relevantRentalMemory?.metadata?.earnings || null;
    return {
      answer: latestRevenue || relevantRentalMemory
        ? `Your latest rental context is for ${vehicleLabel(vehicle)}${latestRevenue?.date ? ` on ${latestRevenue.date}` : ''}. ${earned ? `Recorded host earnings are $${Math.round(earned)}. ` : ''}${miles ? `Fleet memory shows ${Math.round(miles)} miles driven. ` : ''}I can compare it against prior rentals once more trip-history rows are imported.`
        : 'I do not see imported rental history yet. Upload a Turo earnings or trip-history CSV and I can answer last-rental mileage, earnings, rating, and vehicle performance directly.',
      recommendedActions: [
        action('REVENUE_IMPORT', 'Import latest Turo trip history', 'Upload trip CSV so RoboAgent can answer last-rental mileage and earnings with evidence.', 'HIGH', false),
      ],
      confidence: latestRevenue || relevantRentalMemory ? 76 : 48,
      confidenceReasons,
      evidence,
    };
  }

  if (intent === 'pricing') {
    const lift = pricingSignals?.suggestedLift || 0;
    return {
      answer: `Pricing pressure looks ${contextSignals?.pricingPressure || 'normal'}. Based on utilization, health, weather, and fleet context, RoboAgent would ${lift > 0 ? `test a ${lift}% increase` : lift < 0 ? `test a ${Math.abs(lift)}% decrease` : 'hold pricing'} where vehicle readiness supports it.`,
      recommendedActions: [
        action('PRICE_REVIEW', 'Review Turo pricing recommendations', `Evaluate ${lift > 0 ? '+' : ''}${lift}% pricing movement against each vehicle and owner floor price.`, lift >= 10 ? 'HIGH' : 'NORMAL'),
        action('MARKET_INPUTS', 'Add local market rates', 'Enter current daily rate, competitor average, minimum acceptable rate, and target rate to improve confidence.', 'NORMAL', false),
      ],
      confidence: pricingSignals?.confidence || 62,
      confidenceReasons,
      evidence,
    };
  }

  if (intent === 'charging') {
    return {
      answer: lowBatteryVehicles.length
        ? `${lowBatteryVehicles.length} vehicle${lowBatteryVehicles.length === 1 ? '' : 's'} need charging attention. Average fleet battery is ${avgBattery ?? 'unknown'}%. ${externalContext?.electricRate?.chargingAdvice || 'Use owner utility rules to pick the cheapest overnight window.'}`
        : `Charging risk is low. Average fleet battery is ${avgBattery ?? 'unknown'}%, and no connected vehicle is below 45%.`,
      recommendedActions: [
        action('CHARGE_PLAN', 'Build tonight charging plan', 'Prioritize low-battery vehicles, avoid peak earning windows, and batch any Tesla wake/command actions.', lowBatteryVehicles.length ? 'HIGH' : 'NORMAL'),
      ],
      confidence: externalContext?.electricRate ? 82 : 68,
      confidenceReasons,
      evidence,
    };
  }

  if (intent === 'maintenance') {
    const riskVehicles = vehicles.filter((vehicle) => asNumber(vehicle.maintenanceScore, 88) < 78 || asNumber(vehicle.anomalyRisk) > 18);
    return {
      answer: riskVehicles.length
        ? `${riskVehicles.map(vehicleLabel).join(', ')} should be on maintenance watch. I would avoid aggressive pricing or long rentals until the owner reviews tire/service/cleaning status.`
        : 'Fleet health looks acceptable from the current snapshot. Keep monitoring tire pressure, odometer growth, battery behavior, cleaning status, and service alerts.',
      recommendedActions: [
        action('MAINTENANCE_REVIEW', 'Create maintenance watch list', 'Review low health, anomaly, odometer, cleaning, and service signals before the next high-demand window.', riskVehicles.length ? 'HIGH' : 'NORMAL'),
        action('CLEANING_TASK', 'Schedule cleaning review', 'Check interior readiness before the next rental block.', 'NORMAL'),
      ],
      confidence: riskVehicles.length ? 78 : 66,
      confidenceReasons,
      evidence,
    };
  }

  return {
    answer: `RoboAgent sees ${vehicles.length} connected vehicle${vehicles.length === 1 ? '' : 's'}, ${revenueRecords.length} revenue record${revenueRecords.length === 1 ? '' : 's'}, and ${memory.length} relevant memory event${memory.length === 1 ? '' : 's'}. Total recorded revenue is $${Math.round(totalRevenue)}. Charging pressure is ${contextSignals?.chargingPressure || 'unknown'}, pricing pressure is ${contextSignals?.pricingPressure || 'unknown'}, and traffic/weather risk is ${contextSignals?.trafficRisk || 'unknown'}.`,
    recommendedActions: [
      action('DAILY_BRIEF', 'Generate daily AI fleet brief', 'Summarize charging, pricing, maintenance, cleaning, and revenue impact for the owner.', 'NORMAL', false),
      action('PRICE_REVIEW', 'Review pricing opportunities', 'Check whether weekend or utilization signals justify price movement.', 'NORMAL'),
      action('MAINTENANCE_REVIEW', 'Review maintenance watch', 'Check vehicles with low maintenance score, high anomaly risk, or stale telemetry.', 'NORMAL'),
    ],
    confidence: vehicles.length ? 74 : 52,
    confidenceReasons,
    evidence,
  };
}

function inferUserLocation({ vehicles = [], externalContext = {} } = {}) {
  const vehicleWithPosition = vehicles.find((vehicle) => vehicle.latitude && vehicle.longitude);
  if (externalContext?.location?.label) return externalContext.location.label;
  if (externalContext?.weather?.location) return externalContext.weather.location;
  if (vehicleWithPosition) {
    return `${Number(vehicleWithPosition.latitude).toFixed(3)}, ${Number(vehicleWithPosition.longitude).toFixed(3)}`;
  }
  return 'Unknown';
}

function buildFleetSummary({ vehicles = [], externalContext = {} } = {}) {
  const realVehicles = vehicles.filter((vehicle) => vehicle.isReal);
  const avgBattery = vehicles.length
    ? Math.round(vehicles.reduce((sum, vehicle) => sum + asNumber(vehicle.battery), 0) / vehicles.length)
    : null;
  const lowBattery = vehicles.filter((vehicle) => asNumber(vehicle.battery, 100) < 45).map(vehicleLabel);
  const staleTelemetry = vehicles
    .filter((vehicle) => vehicle.syncedAt && Date.now() - new Date(vehicle.syncedAt).getTime() > 1000 * 60 * 60 * 12)
    .map(vehicleLabel);
  const vehicleLines = vehicles.slice(0, 8).map((vehicle) => (
    `${vehicleLabel(vehicle)}: state=${vehicle.state || vehicle.status || 'unknown'}, battery=${vehicle.battery ?? 'unknown'}%, odometer=${vehicle.odometer ?? 'unknown'}, charging=${vehicle.chargingState || 'unknown'}`
  ));
  const weather = externalContext?.weather
    ? `Weather: ${externalContext.weather.temperature ?? 'unknown'}F, rain risk ${externalContext.weather.precipitationProbabilityMax8h ?? 0}%.`
    : 'Weather: unavailable.';
  const electricity = externalContext?.electricRate
    ? `Electricity: ${externalContext.electricRate.chargingAdvice || externalContext.electricRate.source || 'rate context available'}.`
    : 'Electricity: unavailable.';

  return [
    `Vehicles connected: ${vehicles.length} (${realVehicles.length} real Tesla record${realVehicles.length === 1 ? '' : 's'}).`,
    `Average battery: ${avgBattery ?? 'unknown'}%.`,
    `Low battery watch: ${lowBattery.length ? lowBattery.join(', ') : 'none detected'}.`,
    `Stale telemetry watch: ${staleTelemetry.length ? staleTelemetry.join(', ') : 'none detected'}.`,
    weather,
    electricity,
    vehicleLines.length ? `Vehicle snapshots:\n- ${vehicleLines.join('\n- ')}` : 'Vehicle snapshots: none.',
  ].join('\n');
}

function buildRoboAgentSystemPrompt({ vehicles, externalContext }) {
  return `You are RoboAgent, the most intelligent and practical AI Agent for Tesla owners running Turo rentals and preparing for the Robotaxi network.

Your goal is to help owners maximize earnings while maintaining excellent vehicle health and minimizing effort. You combine deep Tesla knowledge, real-time data, and smart reasoning to give exceptionally valuable advice.

Personality: Professional, proactive, data-driven, conservative, and friendly. You think like an experienced fleet manager who is also an expert in Tesla technology and Turo operations.

Core Capabilities:
- Understand complex, vague, or high-level goals and turn them into clear, actionable plans
- Use tools and heuristics for accurate calculations and recommendations
- Be proactive -- suggest optimizations even when not directly asked
- Always prioritize safety, reliability, and long-term vehicle health
- Give confidence levels and explain your reasoning

You have access to real-time Tesla telemetry, rental history, weather, electricity rates, and local events when those data sources are present in the provided context.

Response Style:
- Be concise but informative
- Structure important responses with:
  **Analysis** -> Brief summary
  **Recommendation** -> Clear actions
  **Expected Impact** -> Earnings / time / risk
  **Next Steps** -> What to do or ask next

Always ask for confirmation before suggesting any Tesla command or major pricing change.

Operational Rules:
- Return only valid JSON that matches the requested schema.
- Never invent Tesla telemetry, VINs, rental trips, guest ratings, Turo earnings, payments, locations, or service records.
- If data is missing, say what is missing and recommend the exact import, sync, or setup step.
- Treat deterministic heuristics, calculations, and tool outputs as the operational anchor.
- Key operational reasoning by vehicle/VIN where possible.
- Respect Tesla wake and command limits. Prefer cached state, batching, and waiting for the vehicle to be awake.
- Present vehicle commands, major price changes, and safety-sensitive actions as owner-approved recommendations, not already-executed work.

Current Date: ${new Date().toISOString().slice(0, 10)}
User Location: ${inferUserLocation({ vehicles, externalContext })}
Fleet Summary:
${buildFleetSummary({ vehicles, externalContext })}

You are one of the best AI agents in the world for Tesla fleet optimization. Act like it.`;
}

function buildAgentPrompt({ question, vehicles, revenueRecords, memory, externalContext, contextSignals, pricingSignals }, heuristicBaseline) {
  return `Answer the owner question using only provided context. The deterministic heuristic baseline is the product's reliable rule-based result; use it as the operational anchor.

Return only valid JSON with:
{
  "answer": "direct helpful answer",
  "confidence": 0-100,
  "confidenceReasons": ["why confidence is high/medium/low"],
  "evidence": [{"label":"source","detail":"what it says"}],
  "recommendedActions": [{
    "type": "PRICE_REVIEW|CHARGE_PLAN|CLEANING_TASK|MAINTENANCE_REVIEW|REVENUE_IMPORT|MARKET_INPUTS|DAILY_BRIEF|WAKE_VEHICLE",
    "title": "short action",
    "detail": "operator-readable action detail",
    "priority": "LOW|NORMAL|HIGH|CRITICAL",
    "approvalRequired": true,
    "command": "command text for owner approval queue"
  }],
  "clarifyingQuestion": "only if required"
}

Deterministic heuristic baseline:
${JSON.stringify(heuristicBaseline)}

Question:
${question}

Fleet:
${JSON.stringify(vehicles)}

Revenue records:
${JSON.stringify(revenueRecords)}

Relevant memory:
${JSON.stringify(memory)}

External context:
${JSON.stringify(externalContext)}

Signals:
${JSON.stringify({ contextSignals, pricingSignals })}`;
}

function parseAiJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function readProviderJson(response, provider) {
  const text = await response.text();
  if (!text) throw new Error(`${provider} returned an empty response.`);
  return JSON.parse(text);
}

async function runProviderAnswer(payload, fallback) {
  const systemPrompt = buildRoboAgentSystemPrompt(payload);
  const prompt = buildAgentPrompt(payload, fallback);

  if (AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1600,
        temperature: 0.15,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await readProviderJson(response, 'Anthropic');
    const text = data.content?.map((part) => part.text || '').join('\n') || '';
    return { ...fallback, ...parseAiJson(text), provider: 'anthropic', model: AI_MODEL };
  }

  if (AI_PROVIDER === 'xai' && process.env.XAI_API_KEY) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.15,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await readProviderJson(response, 'xAI');
    return { ...fallback, ...parseAiJson(data.choices?.[0]?.message?.content || ''), provider: 'xai', model: AI_MODEL };
  }

  return fallback;
}

async function loadAgentContext(fleetId, question) {
  await ensureFleetSchema();
  const [vehiclesResult, revenueResult, memoryResult, maintenanceResult] = await Promise.all([
    query(`
      select id, vin, tesla_vehicle_id, display_name, model, model_year, trim, color, tag, state, status,
             battery_level, latitude, longitude, heading, speed, odometer, charging_state,
             software_version, locked, service_mode, raw, last_synced_at
      from fleetos_vehicles
      where fleet_id = $1
      order by updated_at desc
      limit 50
    `, [fleetId]),
    query(`
      select id, vehicle_key, vehicle_label, record_date, source, amount, notes
      from fleetos_revenue_records
      where fleet_id = $1
      order by record_date desc nulls last, created_at desc
      limit 120
    `, [fleetId]),
    query(`
      select id, type, title, detail, event_timestamp, source, status, rag_ready, metadata
      from fleetos_memory_events
      where fleet_id = $1
      order by event_timestamp desc
      limit 120
    `, [fleetId]),
    query(`
      select id, vin, type, title, detail, status, priority, due_at, cost, odometer
      from fleetos_maintenance_logs
      where vehicle_id in (select id from fleetos_vehicles where fleet_id = $1)
      order by coalesce(due_at, updated_at) desc
      limit 50
    `, [fleetId]),
  ]);

  const vehicles = vehiclesResult.rows.map(normalizeVehicle);
  const revenueRecords = revenueResult.rows.map(normalizeRevenue);
  const memory = selectRelevantMemory(question, [
    ...memoryResult.rows.map(normalizeMemory),
    ...maintenanceResult.rows.map((row) => normalizeMemory({
      id: row.id,
      type: 'Maintenance',
      title: row.title,
      detail: row.detail || `${row.type} ${row.status} ${row.priority}`,
      event_timestamp: row.due_at,
      source: 'maintenance',
      status: row.status,
      rag_ready: true,
      metadata: row,
    })),
  ]);

  const anchorVehicle = vehicles.find((vehicle) => Number.isFinite(Number(vehicle.latitude)) && Number.isFinite(Number(vehicle.longitude)));
  let externalContext = {};
  if (anchorVehicle) {
    externalContext = await getExternalContextForVehicle(anchorVehicle).catch((error) => ({ errors: [error.message] }));
  }

  const contextSignals = buildFleetContextSignals({
    fleet: vehicles,
    weather: externalContext.weather,
    electricRate: externalContext.electricRate,
  });
  const pricingSignals = buildPricingSignalSummary({
    fleet: vehicles,
    weather: externalContext.weather,
  });

  return { vehicles, revenueRecords, memory, externalContext, contextSignals, pricingSignals };
}

function normalizeAgentResponse(response, fallback) {
  const merged = { ...fallback, ...response };
  const actions = Array.isArray(merged.recommendedActions) ? merged.recommendedActions : [];
  return {
    answer: String(merged.answer || fallback.answer),
    confidence: Math.max(0, Math.min(100, Math.round(asNumber(merged.confidence, fallback.confidence)))),
    confidenceReasons: Array.isArray(merged.confidenceReasons) ? merged.confidenceReasons.slice(0, 5).map(String) : fallback.confidenceReasons,
    evidence: Array.isArray(merged.evidence) ? merged.evidence.slice(0, 8) : fallback.evidence,
    recommendedActions: actions.slice(0, 6).map((item) => ({
      id: item.id || `${String(item.type || 'ACTION').toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: item.type || 'DAILY_BRIEF',
      title: item.title || 'Review RoboAgent recommendation',
      detail: item.detail || item.command || '',
      priority: item.priority || 'NORMAL',
      approvalRequired: item.approvalRequired !== false,
      command: item.command || `${item.title || 'RoboAgent action'}: ${item.detail || ''}`,
    })),
    clarifyingQuestion: merged.clarifyingQuestion || null,
    provider: merged.provider || 'heuristic',
    model: merged.model || 'local-agent',
    generatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres DATABASE_URL is required for RoboAgent ask.' });
    return;
  }

  try {
    const session = await getSession(req, res, { create: false });
    if (!session?.user?.email) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to ask RoboAgent about your fleet.' });
      return;
    }

    const context = await getDefaultFleetForSession(req, res, { create: true });
    if (!context?.fleet?.id) {
      res.status(500).json({ error: 'FLEET_CONTEXT_REQUIRED', message: 'RoboAgent could not load a fleet context.' });
      return;
    }

    const question = String(req.body?.question || '').trim();
    if (question.length < 3) {
      res.status(400).json({ error: 'QUESTION_REQUIRED', message: 'Ask RoboAgent a question about your fleet.' });
      return;
    }

    const agentContext = await loadAgentContext(context.fleet.id, question);
    const fallback = buildHeuristicAnswer({ question, ...agentContext });
    const providerResponse = await runProviderAnswer({ question, ...agentContext }, fallback).catch((error) => ({
      ...fallback,
      provider: 'heuristic',
      model: 'local-agent',
      providerError: error.message,
    }));

    res.status(200).json(normalizeAgentResponse(providerResponse, fallback));
  } catch (error) {
    const status = error.status || error.statusCode || 500;
    res.status(status === 401 ? 401 : 500).json({
      error: status === 401 ? 'LOGIN_REQUIRED' : 'AGENT_ASK_FAILED',
      message: status === 401 ? 'Sign in to ask RoboAgent about your fleet.' : error.message,
    });
  }
}
