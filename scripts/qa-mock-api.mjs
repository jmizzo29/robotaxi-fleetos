// Throwaway QA mock backend for manual verification of the auth route guard
// and billing-error UI. Run with: node scripts/qa-mock-api.mjs [mode]
//   mode=guest   -> /api/auth/session returns 401 (logged out)
//   mode=billing -> session OK, /api/vehicles returns 402 BILLING_REQUIRED
//   mode=ok      -> session OK, /api/vehicles returns one vehicle
import http from 'node:http';

const mode = process.argv[2] || 'guest';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = req.url || '';

  if (url.startsWith('/api/auth/session')) {
    if (mode === 'guest') {
      res.statusCode = 401;
      res.end(JSON.stringify({ authenticated: false, error: 'LOGIN_REQUIRED', message: 'Sign in to continue.' }));
    } else {
      // email:null matches a real Tesla-OAuth anonymous session (this shape
      // previously masked the AccountPanel signed-out bug).
      res.end(JSON.stringify({
        authenticated: true,
        user: { id: 'qa-user', email: null, name: null, role: 'owner' },
        billing: { vehicleCount: 2, includedVehicles: 1, coveredVehicles: 1, billableVehicles: 1, billingRequired: mode === 'billing' },
        teslaConnected: true,
        teslaConnectedAt: new Date().toISOString(),
      }));
    }
    return;
  }

  if (url.startsWith('/api/vehicles')) {
    if (mode === 'billing') {
      res.statusCode = 402;
      res.end(JSON.stringify({
        error: 'BILLING_REQUIRED',
        message: 'This ROBOAGENT beta account includes the first Tesla free. Add a paid vehicle plan before syncing additional Teslas.',
      }));
    } else if (mode === 'ok') {
      res.end(JSON.stringify({
        response: [{
          id: 'qa-tesla-1', vin: '5YJ3E1EA7KF000000', display_name: 'QA Model 3',
          state: 'online', status: 'ONLINE', battery: 81, latitude: 28.54, longitude: -81.38,
          syncedAt: new Date().toISOString(),
        }],
      }));
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'LOGIN_REQUIRED', message: 'Sign in to continue.' }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'NOT_FOUND', message: `No mock for ${url}` }));
});

server.listen(3001, () => console.log(`QA mock API listening on :3001 (mode=${mode})`));
