# Soma Graphics Engine

Deterministic **brief → PNG** renderer. A JSON brief describes the slides; `render.mjs` rasterises them to social-ready PNGs in Soma's brand chrome (OLED black, gold accent, Sen / Lora / Tiro Devanagari, real moon assets). No LLM in the renderer — a human or skill authors the brief; this turns it into pixels, the same every time. Mirrors the build/render split in `yirifi-social-marketing/content-engine/graphics-engine`.

## Requirements

Playwright + Chromium (already in the repo's devDeps). One-time: `npx playwright install chromium`.

## Usage

```bash
# from docs/marketing/content-engine/graphics/
node render.mjs briefs/2026-W28-lunar-fasting-101.json           # 1080×1350 (default)
node render.mjs briefs/2026-W28-this-months-sky.json --size 1080x1920   # Story/Reel
```

Output → `out/<brief-name>/slide-NN.png` at 2× (retina).

## Brief format

```jsonc
{
  "slides": [                    // or a single "card": {…} for card-native
    {
      "role": "cover|promise|body|synthesis|cta",  // drives layout + type scale
      "kicker": "LUNAR FASTING 101",               // small gold eyebrow
      "deva": "एकादशी",                             // Devanagari (gold, Tiro)
      "title": "Ekadashi",                          // supports <br/> and <em>
      "support": ["11th day · twice a month", "Kept without grains"],
      "image": "phases/waxing-crescent.webp",       // path under soma/assets/
      "imageClass": "phase",                        // "phase" = framed top-right; omit on cover for full-bleed
      "cta": "Free · link in bio",                  // gold pill
      "mark": true                                  // सोम wordmark (default true)
    }
  ]
}
```

- **Images** are inlined as base64 (setContent pages can't load `file://` subresources), so rendering is offline once fonts are cached.
- **Assets** resolve relative to `soma/assets/` — `moon.jpg`, `phases/*.webp`.

## Compute upcoming fasts

```bash
node compute-next-fasts.mjs     # next Ekadashi / Pradosh / Purnima / Amavasya (astronomy-engine)
```

Feeds the `this-months-sky` card date. Dates are derived from real Sun–Moon elongation; location-exact observance resolves in the app.

## Files

| File | Purpose |
|---|---|
| `render.mjs` | the renderer (brief → PNG) |
| `compute-next-fasts.mjs` | upcoming fast dates from astronomy-engine |
| `briefs/*.json` | one brief per drop |
| `out/<name>/*.png` | rendered assets (git-ignored candidates — regenerate from briefs) |
