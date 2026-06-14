/** Map Tesla disconnect API errors to owner-facing messages. */

const ERROR_MESSAGES = {
  LOGIN_REQUIRED: 'Sign in to ROBOAGENT before disconnecting Tesla.',
  DATABASE_REQUIRED: 'ROBOAGENT account storage is unavailable. Try again shortly.',
  TESLA_DISCONNECT_FAILED: 'Unable to remove the Tesla connection. Try again.',
  NO_ACTIVE_CONNECTION: 'No active Tesla connection found.',
  NETWORK_ERROR: 'Unable to reach ROBOAGENT services. Check your connection and try again.',
};

export function mapTeslaDisconnectError(error) {
  if (!error) return ERROR_MESSAGES.TESLA_DISCONNECT_FAILED;

  const code = error.code || error.error;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  const status = Number(error.status);
  if (status === 401) return ERROR_MESSAGES.LOGIN_REQUIRED;
  if (status === 503) return ERROR_MESSAGES.DATABASE_REQUIRED;
  if (status === 0 || error.name === 'TypeError') return ERROR_MESSAGES.NETWORK_ERROR;

  const message = String(error.message || '').trim();
  if (/database|postgres|DATABASE_URL/i.test(message)) return ERROR_MESSAGES.DATABASE_REQUIRED;
  if (/sign in|login|unauthorized/i.test(message)) return ERROR_MESSAGES.LOGIN_REQUIRED;
  if (/network|fetch|failed to fetch/i.test(message)) return ERROR_MESSAGES.NETWORK_ERROR;
  if (/no active tesla/i.test(message)) return ERROR_MESSAGES.NO_ACTIVE_CONNECTION;

  return message || ERROR_MESSAGES.TESLA_DISCONNECT_FAILED;
}

export function logTeslaDisconnect(stage, detail = {}) {
  if (typeof console === 'undefined') return;
  console.info('[ROBOAGENT][TeslaDisconnect]', stage, detail);
}
