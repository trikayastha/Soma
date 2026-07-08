/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Landing page lives at repo root; React app is nested under /app/
  root: 'app',
  base: '/app/',
  // .env lives at the repo root, but our Vite root is app/ — load env from
  // one level up so VITE_PUBLIC_* vars (PostHog) are inlined at build time.
  envDir: '..',
  build: {
    outDir: '../dist/app',
    emptyOutDir: true,
  },
  server: { port: 5173, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../src/test/setup.ts',
    include: ['../src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
