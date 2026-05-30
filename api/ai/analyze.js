import { getSession } from '../_lib/auth.js';
import { buildFleetContextSignals, buildPricingSignalSummary, getExternalContextForVehicle } from '../_lib/externalContext.js';

const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'xai' ? 'grok-4' : 'claude-sonnet-4-5');

function buildHeuristicFleetAnalysis(fleet = [], context = {}) {
  const vehicles = Array.isArray(fleet) ? fleet : [];
  const realVehicles = vehicles.filter((vehicle) => vehicle.isReal);
  const external = context.externalContext || {};
  const weather = external.weather || null;
  const electricRate = external.electricRate || null;
  const contextSignals = context.contextSignals || buildFleetContextSignals({ fleet: vehicles, weather, electricRate });
  const pricingSignals = context.pricingSignals || buildPricingSignalSummary({ fleet: vehicles, weather });
  const rate = Number(electricRate?.energyRate);
  const rateText = Number.isFinite(rate) ? `$${rate.toFixed(3)}/kWh` : 'owner-entered utility rules';
  const trafficRisk = contextSignals.trafficRisk || 'low';
  const pricingPressure = contextSignals.pricingPressure || 'normal';
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
    summary: context.summary || 'ROBOAGENT generated a local AI-style operating assessment from current fleet telemetry.',
    alerts,
    recommendations: [
      {
        id: 'sync-real-telemetry',
        title: realVehicles.length > 0 ? 'Prioritize real telemetry over simulation' : 'Sync Tesla telemetry',
        confidence: realVehicles.length > 0 ? 92 : 74,
        impact: 'Improves dispatch confidence by separating observed state from modeled state.',
        rationale: realVehicles.length > 0
          ? `${realVehicles.length} real Tesla vehicle${realVehicles.length === 1 ? '' : 's'} are feeding live state into ROBOAGENT.`
          : 'No real Tesla vehicle is currently merged into the operating picture.',
        actionLabel: realVehicles.length > 0 ? 'Focus Real Tesla' : 'Sync Tesla',
        command: realVehicles.length > 0 ? 'Prioritize real Tesla telemetry in operator view' : 'Sync Tesla telemetry',
      },
      {
        id: 'dynamic-charging-advisor',
        title: 'Dynamic Charging Advisor',
        confidence: Number.isFinite(rate) ? 88 : 80,
        impact: 'Reduces charging cost while protecting high-demand availability.',
        rationale: `Battery state, charging status, weather, and electricity context should be planned together. Current rate context: ${rateText}. Charging pressure is ${contextSignals.chargingPressure || 'normal'}.`,
        actionLabel: 'Build Charge Plan',
        command: 'Build a dynamic charging plan using battery, weather, electricity rates, and demand windows',
      },
      {
        id: 'turo-demand-pricing',
        title: 'Turo Demand Pricing',
        confidence: pricingSignals.confidence || (pricingPressure === 'elevated' ? 84 : 76),
        impact: `${pricingSignals.suggestedLift > 0 ? 'Raise' : pricingSignals.suggestedLift < 0 ? 'Lower' : 'Hold'} prices by ${Math.abs(pricingSignals.suggestedLift || 0)}% where vehicle readiness supports it.`,
        rationale: `Pricing agent considered utilization (${pricingSignals.avgUtilization}%), health (${pricingSignals.avgHealth}/100), ${pricingSignals.eventSignal}, and ${pricingSignals.weatherSignal}. Current pricing pressure is ${pricingPressure}.`,
        actionLabel: 'Review Price Lift',
        command: 'Review Turo demand-based pricing suggestions for the next 7 days',
      },
      {
        id: 'traffic-accident-awareness',
        title: 'Traffic & Accident Awareness',
        confidence: trafficRisk === 'high' ? 86 : 79,
        impact: 'Protects utilization by catching road delays before they affect pickups, cleaning, or charging.',
        rationale: `Traffic and incident context should adjust turnaround buffers and route-sensitive assignments. Weather-derived road risk is currently ${trafficRisk}.`,
        actionLabel: 'Check Road Risk',
        command: 'Check traffic and accident risk for active fleet zones',
      },
      {
        id: 'event-driven-opportunities',
        title: 'Event-Driven Opportunities',
        confidence: 77,
        impact: 'Identifies demand spikes from concerts, sports, holidays, airports, and local gatherings.',
        rationale: 'Event-aware pricing and staging can help vehicles be available where renters and riders are likely to need them.',
        actionLabel: 'Find Event Upside',
        command: 'Find event-driven pricing and staging opportunities for this weekend',
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

  return `Analyze this autonomous fleet operations snapshot for ROBOAGENT.

Return only valid JSON with keys: summary, alerts, recommendations. Prioritize real Tesla telemetry above simulation.

If context includes rental history, Turo CSV records, or a user question about the last rental/trip, answer with concrete trip facts first: vehicle, rental dates, miles driven, host earnings, average speed if available, rating if available, and whether the owner should view full trip details or compare against previous rentals. Do not invent personally identifying guest information.

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

async function readProviderJson(response, provider) {
  const text = await response.text();
  if (!text) throw new Error(`${provider} returned an empty response.`);
  return JSON.parse(text);
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
    const data = await readProviderJson(response, 'Anthropic');
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
          { role: 'system', content: 'You are the ROBOAGENT AI operations orchestrator. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await readProviderJson(response, 'xAI');
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

async function enrichFleetContext(fleet = [], context = {}) {
  const vehicles = Array.isArray(fleet) ? fleet : [];
  const anchorVehicle = vehicles.find((vehicle) => (
    vehicle.isReal &&
    Number.isFinite(Number(vehicle.latitude)) &&
    Number.isFinite(Number(vehicle.longitude))
  )) || vehicles.find((vehicle) => (
    Number.isFinite(Number(vehicle.latitude)) &&
    Number.isFinite(Number(vehicle.longitude))
  ));

  if (!anchorVehicle) {
    return {
      ...context,
      contextSignals: buildFleetContextSignals({ fleet: vehicles }),
      pricingSignals: buildPricingSignalSummary({ fleet: vehicles }),
    };
  }

  try {
    const externalContext = await getExternalContextForVehicle(anchorVehicle);
    return {
      ...context,
      externalContext,
      contextSignals: buildFleetContextSignals({
        fleet: vehicles,
        weather: externalContext.weather,
        electricRate: externalContext.electricRate,
      }),
      pricingSignals: buildPricingSignalSummary({
        fleet: vehicles,
        weather: externalContext.weather,
      }),
    };
  } catch (error) {
    return {
      ...context,
      externalContext: { errors: [`External context: ${error.message}`] },
      contextSignals: buildFleetContextSignals({ fleet: vehicles }),
      pricingSignals: buildPricingSignalSummary({ fleet: vehicles }),
    };
  }
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
        message: 'Sign in to ROBOAGENT before requesting AI analysis.',
      });
      return;
    }

    const fleet = req.body?.fleet || [];
    const context = await enrichFleetContext(fleet, req.body?.context || {});
    const analysis = await runAiFleetAnalysis(fleet, context);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(200).json({
      ...buildHeuristicFleetAnalysis(req.body?.fleet || [], req.body?.context || {}),
      error: 'AI_ANALYSIS_FAILED',
      message: error.message,
    });
  }
}
