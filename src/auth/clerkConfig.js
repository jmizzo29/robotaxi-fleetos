const CLERK_KEY_PLACEHOLDER = /your_|pk_test_your_|replace-with/i;

export const clerkPublishableKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();

export function isUsableClerkPublishableKey(value) {
  const key = String(value || '').trim();
  if (!key || CLERK_KEY_PLACEHOLDER.test(key)) return false;
  return key.startsWith('pk_');
}

export function isClerkConfigured() {
  return isUsableClerkPublishableKey(clerkPublishableKey);
}
