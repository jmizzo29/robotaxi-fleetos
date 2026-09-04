/**
 * Public connect/login screens that should skip to Command when a Tesla
 * session is already live. `#/add-vehicle` is not included: signed-in owners
 * use that route to add another car, so a connected session must stay put.
 */
export const TESLA_CONNECT_ENTRY_ROUTES = new Set([
  'landing',
  'landing-entry',
  'login',
  'signup',
  'signup-email',
  'onboarding',
]);

export function shouldRestoreConnectedSessionToCommand(route) {
  return TESLA_CONNECT_ENTRY_ROUTES.has(route);
}
