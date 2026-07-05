/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Landing page lives at repo root; React app is nested under /app/
  root: 'app',
  base: '/app/',
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
