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
    // Listen on 0.0.0.0 so a phone/tablet on the same network can reach the dev
    // server at http://<your-LAN-IP>:5173 for mobile testing.
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Forward X-Forwarded-Host/Proto so the backend can build a Tesla OAuth
        // redirect URI pointing back at the host the browser actually used
        // (the LAN IP) instead of an unreachable localhost.
        xfwd: true,
      },
      // Mirror backend callback routes so mobile LAN OAuth can use the same path
      // as TESLA_REDIRECT_URI (e.g. /callback) on the Vite dev-server port.
      '/callback': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        xfwd: true,
      },
      '/auth/callback': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        xfwd: true,
      },
    },
  },
})
