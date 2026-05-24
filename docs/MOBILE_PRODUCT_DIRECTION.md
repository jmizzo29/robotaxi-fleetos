# RoboAgent Mobile Product Direction

The mockups point toward a strong mobile identity for RoboAgent: compact, dark, operational, and command-first. The app should feel like a real fleet operator tool, not a generic responsive dashboard.

## Visual Direction

- Dark graphite surface, not pure black.
- Compact rounded cards with clear borders and subtle depth.
- High-contrast status colors used sparingly:
  - Green: online, ready, charging, healthy.
  - Amber: utilization, pending, caution.
  - Red: alert, risk, urgent.
  - Blue: selected route, active navigation, AI action.
- Dense information hierarchy: big numbers, short labels, minimal prose.
- Mobile-first spacing: every panel should scan at thumb distance.

## Mobile App Shell

RoboAgent should gain a dedicated mobile shell with four primary tabs:

- Home: live KPIs, OCE status, AI recommendations, quick actions.
- Map: real Tesla location, simulation layer, demand/charging overlays.
- Alerts: AI-ranked alert triage with explanations and execute actions.
- Settings: telemetry sync, provider status, Tesla/Fleet API diagnostics.

Bottom navigation should appear on mobile only. Desktop can keep the current operations-console layout.

## Core Mobile Screens

### 1. Home Dashboard

Inspired by the first mockups:

- Top KPI cards:
  - Active Vehicles
  - Utilization
  - Alerts
  - Real Tesla
- Map preview card with OCE highlighted.
- Quick action grid:
  - Sync Tesla
  - Queue Rebalance
  - Optimize Charging
  - Send to Depot / Schedule Service
- AI recommendation strip near the top, not buried lower in the page.

### 2. Vehicle/Fleet List

Inspired by the fleet list mockup:

- Search and filter chips.
- Vehicle rows with:
  - thumbnail or icon
  - name/VIN short form
  - status pill
  - battery
  - location freshness
  - charging/drive state
- Real Tesla should be pinned above simulated vehicles.

### 3. Vehicle Detail

Inspired by the Tesla detail mockup:

- Large vehicle visual or icon.
- OCE title, online/parked/charging status.
- Tabs:
  - Overview
  - Controls
  - Telemetry
- Metrics:
  - Battery
  - Speed
  - Odometer
  - Charge rate
  - Locked
  - GPS freshness
  - Software version
- AI explanation card:
  - What changed?
  - What matters?
  - Recommended next action.

### 4. Schedule / Trips / Routes

Inspired by the route schedule mockup:

- Timeline list of assignments and simulation events.
- AI route confidence.
- Route preview map.
- Event history eventually powered by RAG.

## AI-First Product Principle

AI should be the operator layer:

- Alerts are ranked and explained by AI.
- Recommendations include confidence, impact, and one-click execution.
- Tesla telemetry is treated as observed truth.
- Simulation is labeled as modeled context.
- RAG should eventually answer: “Have we seen a similar fleet state before, and what worked?”

## Implementation Phases

### Phase 1: Mobile Readability

- Add mobile bottom nav.
- Reorder mobile home screen so telemetry, KPIs, AI alerts, and map are immediately visible.
- Make map height mobile-aware instead of always 900px.
- Collapse lower desktop panels behind tabs or sections on small screens.

### Phase 2: Real Vehicle Detail

- Add dedicated OCE vehicle detail card/screen.
- Add real-vs-sim filter.
- Pin OCE at the top of fleet lists and AI context.

### Phase 3: AI Command Center

- Convert recommendations into a persistent action inbox.
- Track accepted/rejected recommendations.
- Store outcomes for RAG.

### Phase 4: RAG Memory

- Store fleet events, AI recommendations, operator actions, and outcomes.
- Retrieve similar past events during analysis.
- Show memory references in AI explanations.
