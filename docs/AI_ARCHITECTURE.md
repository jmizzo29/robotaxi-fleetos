# RoboAgent AI Architecture

## 1. Updated System Architecture

RoboAgent should evolve into an AI-operated fleet console, not a dashboard with AI sprinkled in.

Current production-ready direction:

- Frontend: React/Vite operator console with map, telemetry, AI alert triage, recommendation execution, and simulation controls.
- Backend: Express for local development and Vercel serverless functions for production APIs.
- AI layer: Provider-agnostic analysis endpoint that can call Claude via Anthropic Messages API or Grok via xAI chat completions.
- Data layer: Start with event logs and fleet snapshots, then graduate to Postgres plus pgvector for RAG.
- Tesla layer: Tesla Fleet API feeds real vehicle state into the AI orchestrator. Simulation fills in broader fleet behavior.

Target request flow:

1. Tesla Fleet API syncs live telemetry.
2. RoboAgent normalizes real + simulated vehicles into one operating snapshot.
3. AI orchestrator analyzes the snapshot.
4. Specialized agents produce alerts, recommendations, charging guidance, and dispatch actions.
5. Operator executes or rejects recommended actions.
6. Event memory stores what happened and whether the recommendation helped.
7. RAG retrieves similar historical events for future analysis.

## 2. Folder/File Structure

Recommended near-term structure:

```text
api/
  ai/
    analyze.js
  vehicles.js
  health.js
backend/
  server.js
docs/
  AI_ARCHITECTURE.md
src/
  agents/
    orchestrator.js
    alertAgent.js
    dispatchAgent.js
    chargingAgent.js
    telemetryAgent.js
    riskAgent.js
  components/
  hooks/
    useAiFleetAnalysis.js
    useFleetSimulation.js
  panels/
    AIRecommendationPanel.jsx
    IntelligentAlertCenter.jsx
    TeslaTelemetryPanel.jsx
  services/
    aiService.js
    teslaService.js
```

Later backend split:

```text
backend/
  agents/
  ai/
    providers/
      anthropic.js
      xai.js
    prompts/
  db/
  routes/
  services/
```

## 3. Core AI Agent Design

Main orchestrator:

- Owns the fleet operating snapshot.
- Calls specialized agents.
- Merges their outputs into one operator-facing response.
- Assigns priority, confidence, and actionability.
- Refuses unsafe or unsupported vehicle commands.

Specialized agents:

- Telemetry Agent: Normalizes Tesla Fleet API data, detects stale GPS, asleep/offline state, charging state, and real-vs-sim confidence.
- Alert Agent: Prioritizes risks and explains why each alert matters to an operator.
- Dispatch Agent: Recommends rebalancing, staging, and demand coverage actions.
- Charging Agent: Optimizes charge timing, plug state, charge limits, and congestion windows.
- Risk Agent: Watches anomalies, maintenance score, weather, geography, and command safety.
- Memory Agent: Retrieves prior incidents and outcomes for RAG.

## 4. Phase 1 Code

Implemented in this pass:

- `src/panels/IntelligentAlertCenter.jsx`: AI-prioritized alert UI with severity, score, explanation, and recommended action.
- `src/panels/AIRecommendationPanel.jsx`: AI recommendation cards with confidence and one-click command queue execution.
- `src/hooks/useAiFleetAnalysis.js`: Debounced frontend hook that sends the current fleet snapshot to the AI endpoint.
- `src/services/aiService.js`: Frontend API client.
- `backend/server.js`: Local `/api/ai/analyze` endpoint.
- `api/ai/analyze.js`: Vercel `/api/ai/analyze` endpoint.

Provider env vars:

```text
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-5
ANTHROPIC_API_KEY=...
```

or:

```text
AI_PROVIDER=xai
AI_MODEL=grok-4
XAI_API_KEY=...
```

If no AI key is configured, RoboAgent uses deterministic local heuristics so the UI remains useful.

## 5. Tesla Fleet API Integration Plan

Tesla telemetry should feed the agents as first-class observed data:

- Vehicle identity: VIN, display name, state, online/asleep.
- Energy: battery level, usable battery, charging state, charge rate, time to full.
- Location: latitude, longitude, heading, GPS timestamp.
- Vehicle state: locked, service mode, odometer, software version.
- Sync metadata: source, syncedAt, stale/healthy flag.

AI context should always distinguish:

- Observed real vehicle data from Tesla.
- Simulated fleet data.
- Derived forecasts or model outputs.

Near-term AI inputs:

```json
{
  "realVehicles": [],
  "simulatedVehicles": [],
  "demandZones": [],
  "weatherZones": [],
  "chargingStations": [],
  "recentEvents": []
}
```

## 6. RAG Setup

Start simple, then harden:

Phase A:

- Store fleet snapshots and operator actions as JSON events.
- Include timestamp, vehicles, AI output, command executed, and outcome notes.

Phase B:

- Move to Postgres.
- Add pgvector for embeddings.
- Embed event summaries, alert explanations, recommendations, and outcomes.

Phase C:

- Retrieval query: current incident + current telemetry.
- Return top 5 similar historical events.
- Feed those into the Memory Agent before final recommendations.

Suggested tables:

```sql
fleet_events(id, created_at, event_type, severity, vehicle_id, payload_json, outcome)
ai_recommendations(id, created_at, provider, model, confidence, command, accepted, outcome)
fleet_memories(id, event_id, summary, embedding)
```

The important product principle: RoboAgent should learn from what operators accepted, ignored, or corrected.
