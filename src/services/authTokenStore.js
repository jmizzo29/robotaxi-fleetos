let tokenProvider = null;

export function setAuthTokenProvider(provider) {
  tokenProvider = provider;
}

export async function getAuthToken() {
  if (!tokenProvider) return null;
  try {
    return await tokenProvider();
  } catch {
    return null;
  }
}
