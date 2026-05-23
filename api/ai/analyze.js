import { getSession } from '../_lib/auth.js';

const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'xai' ? 'grok-4' : 'claude-sonnet-4-5');

function buildHeuristicFleetAnalysis(fleet = [], context = {}) {
  const vehicles = Array.isArray(fleet) ? fleet : [];
  const realVehicles = vehicles.filter((vehicle) => vehicle.isReal);
  const alerts = vehicles
    .flatMap((vehicle) => {
      const vehicleAlerts = [];
      const battery = Number(vehicle.battery);
      const anomalyRisk = Number(vehicle.anomalyRisk);
      const maintenanceScore = Number(vehicle.maintenanceScore);

      if (Number.isFinite(battery) && battery < 35) {
        vehicleAlerts.push({
          id: `battery-${vehicle.id}`,
          severity: battery < 20 ? 'CRITICAL' : 'WARNING',
          priorityScore: battery < 20 ? 94 : 78,
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Battery threshold risk',
          explanation: `${vehicle.name || vehicle.id} is at ${Math.round(battery)}% battery and may need charging capacity soon.`,
          recommendedAction: 'Route toward the nearest charging hub and reduce nonessential assignments.',
        });
      }

      if (Number.isFinite(anomalyRisk) && anomalyRisk > 20) {
        vehicleAlerts.push({
          id: `anomaly-${vehicle.id}`,
          severity: 'CRITICAL',
          priorityScore: Math.min(99, Math.round(72 + anomalyRisk)),
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Anomaly risk elevated',
          explanation: `${vehicle.name || vehicle.id} is above the anomaly threshold at ${Math.round(anomalyRisk)}%.`,
          recommendedAction: 'Pause aggressive dispatching and inspect telemetry trend before assigning long trips.',
        });
      }

      if (Number.isFinite(maintenanceScore) && maintenanceScore < 75) {
        vehicleAlerts.push({
          id: `maintenance-${vehicle.id}`,
          severity: 'WARNING',
          priorityScore: 70,
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Maintenance score degraded',
          explanation: `${vehicle.name || vehicle.id} has a maintenance score of ${Math.round(maintenanceScore)}%.`,
          recommendedAction: 'Schedule maintenance review during the next low-demand window.',
        });
      }

      return vehicleAlerts;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  return {
    provider: 'heuristic',
    model: 'local-rules',
    generatedAt: new Date().toISOString(),
    summary: context.summary || 'FleetOS generated a local AI-style operating assessment from current fleet telemetry.',
    alerts,
    recommendations: [
      {
        id: 'sync-real-telemetry',
        title: realVehicles.length > 0 ? 'Prioritize real telemetry over simulation' : 'Sync Tesla telemetry',
        confidence: realVehicles.length > 0 ? 92 : 74,
        impact: 'Improves dispatch confidence by separating observed state from modeled state.',
        rationale: realVehicles.length > 0
          ? `${realVehicles.length} real Tesla vehicle${realVehicles.length === 1 ? '' : 's'} are feeding live state into FleetOS.`
          : 'No real Tesla vehicle is currently merged into the operating picture.',
        actionLabel: realVehicles.length > 0 ? 'Focus Real Tesla' : 'Sync Tesla',
        command: realVehicles.length > 0 ? 'Prioritize real Tesla telemetry in operator view' : 'Sync Tesla telemetry',
      },
      {
        id: 'balance-orlando',
        title: 'Protect Orlando demand coverage',
        confidence: 86,
        impact: 'Keeps the highest-profit corridor staffed while simulation continues.',
        rationale: 'Demand and profitability signals continue to favor the Orlando corridor.',
        actionLabel: 'Queue Rebalance',
        command: 'Rebalance Orlando corridor fleet capacity',
      },
      {
        id: 'charge-window',
        title: 'Stage charging during lower utilization',
        confidence: 81,
        impact: 'Reduces charging congestion and keeps high-battery vehicles available.',
        rationale: 'Battery and utilization distribution suggests charging should be staggered rather than clustered.',
        actionLabel: 'Optimize Charging',
        command: 'Charging Optimization Triggered',
      },
    ],
  };
}

function buildFleetAnalysisPrompt(fleet = [], context = {}) {
  const compactFleet = fleet.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name || vehicle.display_name,
    isReal: Boolean(vehicle.isReal),
    status: vehicle.status || vehicle.state,
    battery: vehicle.battery,
    chargingState: vehicle.chargingState,
    speed: vehicle.speed,
    odometer: vehicle.odometer,
    anomalyRisk: vehicle.anomalyRisk,
    maintenanceScore: vehicle.maintenanceScore,
    profitability: vehicle.profitability,
    utilization: vehicle.utilization,
    assignment: vehicle.assignment,
    syncedAt: vehicle.syncedAt,
  }));

  return `Analyze this autonomous fleet operations snapshot for FleetOS.

Return only valid JSON with keys: summary, alerts, recommendations. Prioritize real Tesla telemetry above simulation.

Context:
${JSON.stringify(context)}

Fleet:
${JSON.stringify(compactFleet)}`;
}

function parseAiJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function runAiFleetAnalysis(fleet = [], context = {}) {
  const fallback = buildHeuristicFleetAnalysis(fleet, context);
  const prompt = buildFleetAnalysisPrompt(fleet, context);

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
        max_tokens: 1400,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const text = data.content?.map((part) => part.text || '').join('\n') || '';
    return {
      ...fallback,
      ...parseAiJson(text),
      provider: 'anthropic',
      model: AI_MODEL,
      generatedAt: new Date().toISOString(),
    };
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
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are the FleetOS AI operations orchestrator. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return {
      ...fallback,
      ...parseAiJson(data.choices?.[0]?.message?.content || ''),
      provider: 'xai',
      model: AI_MODEL,
      generatedAt: new Date().toISOString(),
    };
  }

  return fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const session = await getSession(req, res, { create: false });
    if (!session) {
      res.status(401).json({
        error: 'LOGIN_REQUIRED',
        message: 'Sign in to FleetOS before requesting AI analysis.',
      });
      return;
    }

    const analysis = await runAiFleetAnalysis(req.body?.fleet || [], req.body?.context || {});
    res.status(200).json(analysis);
  } catch (error) {
    res.status(200).json({
      ...buildHeuristicFleetAnalysis(req.body?.fleet || [], req.body?.context || {}),
      error: 'AI_ANALYSIS_FAILED',
      message: error.message,
    });
  }
}
