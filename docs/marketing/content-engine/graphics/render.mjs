/**
 * Soma graphics engine — brief → PNG.
 *
 * Deterministic renderer: reads a validated JSON brief (a carousel or a single
 * card) and rasterises each slide to a social-ready PNG using Soma's brand
 * chrome (OLED black, gold accent, Sen / Lora / Tiro Devanagari). No LLM here —
 * a human/skill authors the brief; this turns it into pixels. Mirrors the split
 * in yirifi-social-marketing/content-engine/graphics-engine (build vs render).
 *
 * Usage:
 *   node render.mjs briefs/2026-W28-lunar-fasting-101.json
 *   node render.mjs briefs/<name>.json --size 1080x1080
 *
 * Output: out/<brief-name>/slide-01.png ...
 */
import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, extname } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dir, '../../../..');            // soma/
const assets = resolve(repoRoot, 'assets');

const briefPath = process.argv[2];
if (!briefPath) throw new Error('usage: node render.mjs <brief.json> [--size WxH]');
const sizeArg = (process.argv.find((a) => a.startsWith('--size')) || '').split('=')[1]
  || (process.argv[process.argv.indexOf('--size') + 1] || '');
const [W, H] = (sizeArg && /^\d+x\d+$/.test(sizeArg) ? sizeArg : '1080x1350')
  .split('x').map(Number);

const brief = JSON.parse(await readFile(briefPath, 'utf8'));
const name = basename(briefPath).replace(/\.json$/, '');
const outDir = resolve(__dir, 'out', name);
await mkdir(outDir, { recursive: true });

// Resolve a brief image ref ("phases/full.webp" | "moon.jpg") to an inlined
// base64 data URI. setContent pages have an opaque origin and cannot load
// file:// subresources, so we embed the bytes directly.
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const imgUrl = (ref) => {
  if (!ref) return '';
  const p = resolve(assets, ref);
  const mime = MIME[extname(p).toLowerCase()] || 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(p).toString('base64')}`;
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Sen:wght@400;600;700;800&family=Lora:ital@0;1&family=Tiro+Devanagari+Sanskrit&display=swap';

function slideHTML(s) {
  const kicker = s.kicker ? `<p class="kicker">${s.kicker}</p>` : '';
  const deva = s.deva ? `<span class="deva">${s.deva}</span>` : '';
  const title = s.title ? `<h1 class="title ${s.role || ''}">${s.title}</h1>` : '';
  const support = (s.support || []).map((l) => `<li>${l}</li>`).join('');
  const supportBlock = support ? `<ul class="support">${support}</ul>` : '';
  const img = s.image
    ? `<div class="moon ${s.imageClass || ''}"><img src="${imgUrl(s.image)}" alt="" /></div>` : '';
  const mark = s.mark !== false ? `<p class="mark">Soma<span class="deva-mark">सोम</span></p>` : '';
  const cta = s.cta ? `<p class="cta-chip">${s.cta}</p>` : '';
  return `<div class="slide role-${s.role || 'body'}">
    <div class="veil"></div>
    ${img}
    <div class="copy">${kicker}${deva}${title}${supportBlock}${cta}</div>
    ${mark}
  </div>`;
}

const css = `
:root{
  --bg:#05060a; --ink:#f3f0e7; --silver:#cbc9d3; --muted:#83828d;
  --gold:#e2c98f; --gold-dim:#b3a175; --line:#1b1c28;
  --serif:"Sen",system-ui,sans-serif; --body:"Lora",Georgia,serif;
  --deva:"Tiro Devanagari Sanskrit",serif;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#000;}
.slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;
  background:var(--bg);color:var(--ink);
  display:flex;flex-direction:column;justify-content:flex-end;
  padding:96px;}
.veil{position:absolute;inset:0;z-index:0;
  background:
    radial-gradient(58% 42% at 78% 4%, #0e0f1c 0%, #05060d 46%, var(--bg) 74%),
    radial-gradient(50% 40% at 12% 98%, #08080f 0%, var(--bg) 66%);}
.moon{position:absolute;z-index:1;}
.moon img{display:block;object-fit:cover;}
.role-cover .moon{inset:0;}
.role-cover .moon img{width:100%;height:100%;opacity:.72;
  mask-image:linear-gradient(180deg,#000 40%,transparent 96%);}
.moon.phase{top:120px;right:96px;width:300px;height:300px;}
.moon.phase img{width:100%;height:100%;filter:drop-shadow(0 0 40px rgba(226,201,143,.25));}
.role-synthesis .moon.phase{top:50%;left:50%;transform:translate(-50%,-60%);right:auto;width:360px;height:360px;}
.copy{position:relative;z-index:2;max-width:${W-192}px;}
.kicker{font-family:var(--serif);font-size:26px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--gold-dim);margin-bottom:28px;}
.deva{display:block;font-family:var(--deva);font-size:64px;color:var(--gold);
  line-height:1;margin-bottom:20px;}
.title{font-family:var(--serif);font-weight:700;color:var(--ink);
  font-size:82px;line-height:1.04;letter-spacing:-.01em;}
.title.small{font-size:60px;}
.role-cover .title{font-size:96px;}
.role-synthesis .title{text-align:center;font-size:78px;}
.support{list-style:none;margin-top:36px;display:flex;flex-direction:column;gap:18px;}
.support li{font-family:var(--body);font-size:38px;line-height:1.4;color:var(--silver);
  padding-left:34px;position:relative;}
.support li::before{content:"";position:absolute;left:0;top:.62em;
  width:14px;height:14px;border-radius:50%;background:var(--gold);
  box-shadow:0 0 14px var(--gold);}
.cta-chip{margin-top:44px;display:inline-block;align-self:flex-start;
  font-family:var(--serif);font-weight:600;font-size:40px;color:var(--bg);
  background:var(--gold);padding:22px 40px;border-radius:999px;}
.mark{position:absolute;z-index:3;right:96px;bottom:72px;text-align:right;
  font-family:var(--serif);font-weight:700;font-size:34px;color:var(--ink);}
.copy{padding-bottom:24px;}
.mark .deva-mark{font-family:var(--deva);color:var(--gold-dim);font-size:26px;margin-left:10px;}
.role-cover .copy{margin-bottom:60px;}
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });

const slides = brief.slides || (brief.card ? [brief.card] : []);
let i = 0;
for (const s of slides) {
  i++;
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <link rel="stylesheet" href="${FONTS}"><style>${css}</style></head>
    <body>${slideHTML(s)}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = resolve(outDir, `slide-${String(i).padStart(2, '0')}.png`);
  await page.locator('.slide').screenshot({ path: file });
  console.log('rendered', file.replace(repoRoot + '/', ''));
}
await browser.close();
console.log(`\n${i} slide(s) → ${outDir.replace(repoRoot + '/', '')}  (${W}×${H})`);
