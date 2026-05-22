# FleetOS Backend Direction

## Current Production Path

FleetOS uses Vercel Serverless functions under `/api` as the production backend.
The browser should not be configured with a public backend host for normal
production use. Deployed pages call relative `/api` routes, which keeps the
frontend and backend on the same origin.

## Local Development Path

Local development can still use the Express backend in `backend/server.js`.
When the app is opened on `localhost` or `127.0.0.1`, the frontend uses:

```bash
VITE_LOCAL_API_BASE=http://localhost:3001/api
```

This lets the Vite dev server run on `http://localhost:5173` while the local
API server runs on `http://localhost:3001`.

## Database

Persistent beta data, revenue records, asset records, and fleet memory should
use Postgres through `DATABASE_URL`. In production, set this in Vercel
environment variables. Locally, set it in `backend/.env`.

## Express Server Role

Keep the Express server for local development and future jobs that may need a
long-running process, such as WebSocket telemetry streaming, background polling,
or queue workers. Do not treat it as the primary production API while FleetOS is
hosted on Vercel.

## Next Refactor

The Vercel functions and Express server still share behavior by duplication in
some places. The next cleanup should move Tesla, storage, AI, and compliance
logic into shared backend modules that both runtimes can import.
