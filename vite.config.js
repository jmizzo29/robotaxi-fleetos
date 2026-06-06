/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function resolveClerkPublishableKey() {
  const candidates = [
    process.env.VITE_CLERK_PUBLISHABLE_KEY,
    process.env.CLERK_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ];

  for (const candidate of candidates) {
    const key = String(candidate || '').trim();
    if (!key || /your_|pk_test_your_|replace-with/i.test(key)) continue;
    if (!key.startsWith('pk_')) continue;
    return key;
  }

  return '';
}

const clerkPublishableKey = resolveClerkPublishableKey()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
