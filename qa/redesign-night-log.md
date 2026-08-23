# RoboAgent Overnight Redesign Log

Goal: iterate until the app looks and feels ready to show Elon Musk / a top designer, and is beta-ready. Bar: radical simplicity, instant clarity (<10s), calm premium Tesla command-layer aesthetic — type on photography, graphite, one quiet accent. Not Linear/Stripe admin. Not a longer SaaS marketing page.

## Design system (source of truth)
- Tokens: `src/design/roboagentTokens.js` — graphite canvas `#0E0F12`, white ink, teal accent `#5BA8A0`. Monument tokens map to this file.
- Primitives: `src/ui/{Button,Card,Chip,Metric,StatusDot}`
- Wordmark: Inter, wide tracking. Orbitron is gone.
- `.robo-minimal` is a dark canvas class only. The old light-forcing override hack is retired.

## Status by screen (update each cycle)
- Landing (`#/landing-entry`): TESLA CINEMATIC — full-bleed night photograph, type on the photo, one sentence, one Connect Tesla action. Replaces cream explainer + electric-blue pill (live before).
- How it works: TESLA CINEMATIC — same night photograph, giant 3, hairline steps, Connect Tesla. No white cards, no beige telemetry card, no blue pill.
- Home / Command: TESLA COMMAND LAYER — giant number on empty graphite. Status-card / intelligence mockup card farms removed from the default path.
- Map: full-bleed dark surface with overlay type.
- Agent chat: raised onto graphite. Same conversation structure, prompts, and test ids. No cream canvas, no font-black, no Orbitron.
- Fleet list: still the existing intelligence panel; Command Fleet tab is the owner-facing list (giant 3/4, not a card farm).
- Vehicle detail: already on token primitives (Card/Metric/Chip). Inherits graphite. Mid-redesign tabs kept.
- Onboarding / Login: already dark; left alone.
- Money / Finance / Analytics / Health / Charging / Dispatch / Settings: inherit tokens; not first-viewport work.
- In-app dashboard is behind Tesla OAuth — no public demo to screenshot.

## Known issues / backlog
- Code-split / trim Mapbox bundle (~1.76MB)
- Delete orphaned `MobileCommandDashboard.jsx` once confirmed unused
- Modernize shared consent components onto tokens
- Pre-existing lint errors in SignOutButton / AIRecommendationPanel / OwnerValueDashboard left untouched

## Cycle history
- Cycle 0: earlier editorial + product-card landing. Live production never shipped that look; production is the cream monument + blue CTA (see official before shots).
- Cycle Tesla-slick: first viewport is tesla.com/robotaxi structure (photo, display type, one action). Orbitron killed. Command/Map no longer a card farm. Official live befores locked: landing-entry cream explainer, How It Works green 3 + white cards + blue pill.
