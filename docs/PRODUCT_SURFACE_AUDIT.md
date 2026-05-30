# RoboAgent Product Surface Audit

## Product Standard

RoboAgent should feel like a premium Tesla owner command layer: fast, minimal, confident, and obvious. The app should not feel like an internal demo catalog.

## Core V1 Surface

Keep these as first-class pages:

- Command: daily owner dashboard, AI brief, urgent actions, Tesla sync.
- Map: vehicle location, battery, status, service areas.
- Agent: ask questions, review recommendations, approve actions.
- Plan: dispatch, charging, and pricing plan.
- Health: maintenance, readiness, risk.
- Vehicles: registry and detail handoff.
- Money: revenue, ROI, asset economics.
- Setup: account, consent, Tesla OAuth, first sync.
- Tesla: connection health, scopes, safe controls.

## Advanced Or Internal

Keep available, but behind Advanced or role-based access:

- Alerts: useful after the alert model is trusted, not a top-level page.
- Reports: valuable, but not daily navigation.
- Memory: important infrastructure, not a customer-facing primary page.
- Settings: operational controls only.
- Admin: beta operations only.
- Privacy / Terms: legal footer or account links, not app navigation.

## Merge Candidates

- Assets should merge into Money unless asset management becomes a paid fleet feature.
- Readiness should merge into Health unless driverless readiness becomes its own workflow.
- Charging should eventually become a tab inside Plan or Health.
- Integrations should merge into Tesla/Setup unless multiple live integrations matter to owners.
- Vehicle Detail should be reached from Vehicles/Map, not top-level nav.

## Delete Or Defer Candidates

- Simulation/replay should be hidden for normal owners unless in demo mode.
- Memory Events should be hidden until retrieval actually improves recommendations.
- Standalone Reports should wait until there are exportable owner-ready reports.
- Beta Admin should be protected and absent from normal navigation.

## Next UX Pass

- Convert major pages into tabs inside fewer workflows.
- Use one design language for all panels: restrained dark, teal accent, fewer large cards.
- Remove decorative copy that explains the product instead of helping the next action.
- Make every page answer one question: what should the owner do now?
