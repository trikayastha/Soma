// Assemble the final deploy tree:
//   dist/      -> the static marketing landing page (site root)
//   dist/app/  -> the built React app (produced by `vite build`, base '/app/')
// Run after `vite build`.
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const landing = resolve(root, 'landing');

if (!existsSync(resolve(dist, 'app'))) {
  throw new Error('dist/app is missing — run `vite build` before assembling.');
}

// Landing becomes the site root (the app already sits at dist/app).
cpSync(landing, dist, { recursive: true });

// Keep the standalone pitch deck reachable under /app if it exists.
const pitch = resolve(root, 'pitch.html');
if (existsSync(pitch)) cpSync(pitch, resolve(dist, 'app', 'pitch.html'));

console.log('assembled: landing -> dist/, app -> dist/app/');
