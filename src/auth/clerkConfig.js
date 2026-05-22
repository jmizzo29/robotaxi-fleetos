export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export function isClerkConfigured() {
  return Boolean(clerkPublishableKey);
}
