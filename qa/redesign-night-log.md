# RoboAgent Overnight Redesign Log

Goal: iterate until the app looks and feels ready to show Elon Musk / a top designer, and is beta-ready. Bar: radical simplicity, instant clarity (<10s), calm premium Tesla/Apple/Linear/Arc aesthetic, mobile-first, delightful micro-interactions, zero clutter, consistent design system.

## Design system (source of truth)
- Primitives: `src/ui/{Button,Card,Chip,Metric,StatusDot}` via `import { ... } from '../ui'`
- Tokens (src/index.css @theme): surface, surface-raised, ink, ink-muted, ink-subtle, accent, accent-hover, status-ready/caution/critical/active; `.animate-fade-up`
- Avoid old dark slate-900 / font-black uppercase styling and the legacy `.robo-minimal` override hack.

## Status by screen (update each cycle)
- Landing: REDESIGNED (editorial hero + dark glowing-map product card)
- Home / Command dashboard: REDESIGNED
- Agent chat: REDESIGNED
- Fleet list: REDESIGNED
- Onboarding / Login / Signup / Account: REDESIGNED + polish pass in progress
- Vehicle Detail: redesign in progress (tabs)
- Command Map: strengthening in progress (integrations + glass controls)
- Money / Finance: PENDING
- Analytics / Reports: PENDING
- Health / Charging / Dispatch / Readiness: PENDING
- Settings / Integrations / Tesla panels: PENDING
- Alerts / Memory: PENDING

## Known issues / backlog (groomed each cycle)
- Retire `.robo-minimal` CSS override block once all panels use tokens
- Code-split / trim Mapbox bundle (~1.76MB)
- Delete orphaned `MobileCommandDashboard.jsx` once confirmed unused
- Modernize shared consent components (TeslaDataAccessDisclosure, BetaConsentPanel, TeslaIndependenceNotice) onto tokens
- Fix pre-existing lint errors in: SignOutButton.jsx, AIRecommendationPanel.jsx, OwnerValueDashboard.jsx, (and any newly surfaced)

## Cycle history
- Cycle 0: design system + nav + dashboard/agent/fleet + onboarding/login + landing shipped.
- Logo pass: redesigned the RoboAgent "R" mark. New mark = a calm, geometric monogram "R" — a true-vertical stem, a clean circular-counter bowl, and a single confident forward-kicking leg whose foot aligns to the bowl's right edge for a balanced silhouette. One restrained accent: an emerald (`status-ready` #10b981) "sensor eye" set in the bowl counter, reading as the autonomous/agent core. Built as optimized inline SVG on a pixel-friendly 0 0 32 32 grid (filled shapes, not strokes, so it stays crisp 16→64px). The in-app `RoboLogo` is a bare glyph using `currentColor` (inherits ink on light surfaces, white on the dark Fleet-Command card) + the emerald token, with `useId` masks so multiple instances are valid; `favicon.svg` and a new `robo-mark` symbol in `icons.svg` wrap the identical glyph in a graphite squircle app-tile. Pairs cleanly inline with the ROBOAGENT wordmark. Rejected directions: floating "beacon dot" at the leg foot (read as a blemish/dust), full app-tile as the primary in-app mark (a dark tile disappears on the dark landing card — the adaptive currentColor glyph wins), and a single-continuous-line R (too light/generic at 16px favicon). Monochrome-safe (drop or recolor the eye). Build + lint green for the changed files (pre-existing repo lint errors untouched).
