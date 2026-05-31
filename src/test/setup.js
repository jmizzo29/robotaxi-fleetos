import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Clerk for tests
vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useSignIn: () => ({ signIn: null, isLoaded: true }),
  useSignUp: () => ({ signUp: null, isLoaded: true }),
  ClerkProvider: ({ children }) => children,
}));

// Mock window.Clerk
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {};
}
globalThis.window.Clerk = {
  loaded: true,
  signOut: vi.fn(),
  openSignIn: vi.fn(),
  openSignUp: vi.fn(),
};
