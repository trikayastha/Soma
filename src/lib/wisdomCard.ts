import type { ResolvedPalette } from '../themes/resolvePalette';
import { ensureFontLoaded } from '../themes/fonts';
import { toISODate } from './lunar';
import type { Theme, Voice } from './types';

/**
 * 1080×1080 shareable PNG renderer (S4 §T11).
 *
 * Pure-vector output (no bitmaps) so the canvas never taints — `toBlob()`
 * works across browsers including Safari. The moon glyph, typography, and
 * radial background are all built from `ctx` primitives and the active
 * theme palette read at render time via `resolvePaletteFromCssVars()`.
 */

const SIZE = 1080;
const PADDING = 96;
const MOON_RADIUS = 220;
const MOON_CENTER_Y = SIZE / 2 - 80;

export interface WisdomCardConfig {
  /** Date the card represents — used in the wordmark stamp + filename. */
  date: Date;
  /** Pretty tithi label, e.g. "Shukla Ekadashi" or "Putrada Ekadashi". */
  tithiLabel: string;
  /** One-word benefit, e.g. "FOCUS" or "STILLNESS". Rendered uppercase. */
  oneWordBenefit: string;
  /** Wisdom line, ≤120 chars. Rendered word-wrapped. */
  wisdomLine: string;
  /** 0..1 illuminated fraction — drives the moon glyph. */
  illumination: number;
  /** True if waxing (lit side on the right). */
  waxing: boolean;
  /** Theme-resolved palette. */
  palette: ResolvedPalette;
  /** Active voice — kept for analytics; not rendered today. */
  voice: Voice;
  /** Active theme — kept for analytics; not rendered today. */
  theme: Theme;
}

export interface WisdomCardOutput {
  blob: Blob;
  dataUrl: string;
  filename: string;
}

/** Slugify a tithi label for filenames: "Shukla Ekadashi" → "shukla-ekadashi". */
export function slugifyTithi(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface MoonGlyphArgs {
  cx: number;
  cy: number;
  radius: number;
  illumination: number;
  waxing: boolean;
  moonTint: string;
  shadow: string;
}

function drawMoon(ctx: CanvasRenderingContext2D, a: MoonGlyphArgs): void {
  // Lit body: full circle filled with moon tint.
  ctx.beginPath();
  ctx.fillStyle = a.moonTint;
  ctx.arc(a.cx, a.cy, a.radius, 0, Math.PI * 2);
  ctx.fill();

  // Terminator: shrink an ellipse over the unlit half. The ellipse width
  // shrinks toward zero at full moon and toward `radius` at new moon.
  const illum = Math.min(Math.max(a.illumination, 0), 1);
  const ellipseW = Math.abs(1 - 2 * illum) * a.radius;
  const onRight = a.waxing; // lit side on right when waxing
  const sign = onRight ? -1 : 1; // shadow on the opposite side of lit
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = a.shadow;
  if (illum < 0.5) {
    // Crescent: shadow covers most of the disc except a sliver on lit side.
    // Approximate by drawing a filled half-disc plus the shrinking ellipse.
    ctx.beginPath();
    ctx.arc(a.cx, a.cy, a.radius, -Math.PI / 2, Math.PI / 2, !onRight);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(a.cx, a.cy, ellipseW, a.radius, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Gibbous: shadow is a shrinking ellipse on the dark side.
    ctx.beginPath();
    ctx.ellipse(
      a.cx + sign * (a.radius - ellipseW),
      a.cy,
      ellipseW,
      a.radius,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baselineY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const tentative = current.length === 0 ? word : `${current} ${word}`;
    if (ctx.measureText(tentative).width <= maxWidth) {
      current = tentative;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  // Center vertical block on baselineY.
  const total = lines.length;
  const startY = baselineY - ((total - 1) * lineHeight) / 2;
  for (let i = 0; i < total; i += 1) {
    ctx.fillText(lines[i], cx, startY + i * lineHeight);
  }
}

function formatDateStamp(d: Date): string {
  try {
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Render the wisdom card and return a PNG blob, data URL, and filename.
 *
 * Throws if the canvas 2D context is unavailable or `toBlob` returns null.
 * Callers should treat this as a user-facing error and fall back to a
 * "couldn't share" message.
 */
export async function renderWisdomCardCanvas(
  cfg: WisdomCardConfig,
): Promise<WisdomCardOutput> {
  // Race font load against a short timeout so we never hang the share flow.
  await ensureFontLoaded(cfg.palette.displayFont, 64);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Background — radial glow biased toward the moon.
  const bg = ctx.createRadialGradient(
    SIZE / 2,
    MOON_CENTER_Y,
    80,
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.7,
  );
  bg.addColorStop(0, cfg.palette.surfaceElev);
  bg.addColorStop(1, cfg.palette.surface);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Moon glyph.
  drawMoon(ctx, {
    cx: SIZE / 2,
    cy: MOON_CENTER_Y,
    radius: MOON_RADIUS,
    illumination: cfg.illumination,
    waxing: cfg.waxing,
    moonTint: cfg.palette.moonTint,
    shadow: cfg.palette.surface,
  });

  // Tithi label.
  ctx.fillStyle = cfg.palette.glow;
  ctx.font = `600 64px ${cfg.palette.displayFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(cfg.tithiLabel, SIZE / 2, SIZE - 360);

  // One-word benefit.
  ctx.fillStyle = cfg.palette.accent;
  ctx.font = `500 28px ${cfg.palette.bodyFont}`;
  ctx.fillText(cfg.oneWordBenefit.toUpperCase(), SIZE / 2, SIZE - 300);

  // Wisdom line.
  ctx.fillStyle = cfg.palette.mist;
  ctx.font = `400 36px ${cfg.palette.bodyFont}`;
  drawWrappedText(
    ctx,
    cfg.wisdomLine,
    SIZE / 2,
    SIZE - 220,
    SIZE - PADDING * 2,
    48,
  );

  // Wordmark + date.
  ctx.fillStyle = cfg.palette.mist;
  ctx.font = `500 20px ${cfg.palette.bodyFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('SOMA', PADDING, SIZE - PADDING);
  ctx.textAlign = 'right';
  ctx.fillText(formatDateStamp(cfg.date), SIZE - PADDING, SIZE - PADDING);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
      'image/png',
    );
  });
  const dataUrl = canvas.toDataURL('image/png');
  const filename = `soma-${toISODate(cfg.date)}-${slugifyTithi(cfg.tithiLabel)}.png`;

  return { blob, dataUrl, filename };
}
