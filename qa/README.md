# FleetOS Breaker

FleetOS Breaker is a small external QA harness for trying to break the deployed FleetOS app before beta users do.

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
