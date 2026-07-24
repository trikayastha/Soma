// Assemble the final deploy tree:
//   dist/      -> the static marketing landing page (site root)
//   dist/app/  -> the built React app (base '/app/')
// Run after `vite build`.
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

if (!existsSync(resolve(dist, 'app'))) {
  throw new Error('dist/app is missing — run `npm run build` before assembling.');
}

// Landing page lives at repo root — copy static files to dist root
for (const f of [
  'index.html',
  'style.css',
  'moon.js',
  'assets',
  'manifest.webmanifest',
  'icon.svg',
  'icon-maskable.svg',
  'robots.txt',
  'sitemap.xml',
  'blog',
]) {
  cpSync(resolve(root, f), resolve(dist, f), { recursive: true });
}

// Keep pitch deck reachable at /app/pitch.html
const pitch = resolve(root, 'pitch.html');
if (existsSync(pitch)) cpSync(pitch, resolve(dist, 'app', 'pitch.html'));

console.log('assembled: landing -> dist/, app -> dist/app/');
