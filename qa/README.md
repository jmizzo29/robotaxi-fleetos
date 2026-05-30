# ROBOAGENT Breaker

ROBOAGENT Breaker is a small external QA harness for trying to break the deployed ROBOAGENT app before beta users do.

It checks:

- public page shell loading
- stale homepage copy
- Clerk/auth health
- signed-out API gates
- admin protection
- Tesla OAuth callback misuse
- Tesla login auth gate
- unsupported method handling
- basic concurrent health load

Run against production:

```bash
npm run qa:break
```

Run the deeper static/code security audit:

```bash
npm run qa:static
```

Run browser/mobile public-flow smoke tests:

```bash
npm run qa:browser
```

Run the full local QA suite:

```bash
npm run qa:all
```

Run against another target:

```bash
npm run qa:break -- https://your-preview-url.vercel.app
```

Optional load burst size:

```bash
$env:FLEETOS_QA_BURST=50
npm run qa:break
```

Reports are written to:

- `qa/reports/fleetos-breaker-latest.html`
- `qa/reports/fleetos-breaker-latest.json`

This harness does not need secrets and should not use real Tesla tokens. It tests the app from the outside, like a signed-out user or confused beta tester.

If `qa:browser` fails because Playwright browsers are missing, install Chromium once:

```bash
npx playwright install chromium
```
