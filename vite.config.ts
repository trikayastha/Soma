/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served behind the marketing landing page at /app
  base: '/app/',
  build: { outDir: 'dist/app', emptyOutDir: true },
  plugins: [react()],
  server: { port: 5173, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
