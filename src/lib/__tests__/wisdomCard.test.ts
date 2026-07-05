import { describe, expect, it, vi } from 'vitest';
import {
  renderWisdomCardCanvas,
  slugifyTithi,
  type WisdomCardConfig,
} from '../wisdomCard';
import { DEFAULT_PALETTE } from '../../themes/resolvePalette';

function baseConfig(overrides: Partial<WisdomCardConfig> = {}): WisdomCardConfig {
  return {
    date: new Date('2026-04-29T00:00:00Z'),
    tithiLabel: 'Shukla Ekadashi',
    oneWordBenefit: 'focus',
    wisdomLine: 'A short fast steadies the mind for the work ahead.',
    illumination: 0.65,
    waxing: true,
    palette: DEFAULT_PALETTE,
    voice: 'coach',
    theme: 'performance',
    ...overrides,
  };
}

describe('slugifyTithi', () => {
  it('lowercases and dashes a multi-word label', () => {
    expect(slugifyTithi('Shukla Ekadashi')).toBe('shukla-ekadashi');
  });

  it('handles multi-space + punctuation', () => {
    expect(slugifyTithi("Putrada  Ekadashi!")).toBe('putrada-ekadashi');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugifyTithi('-Trayodashi-')).toBe('trayodashi');
  });
});

describe('renderWisdomCardCanvas', () => {
  it('returns a blob, dataUrl, and deterministic filename', async () => {
    // JSDOM's canvas is a polyfilled mock — toBlob/toDataURL do work but
    // the resulting bitmap is empty. We only assert the contract here.
    const out = await renderWisdomCardCanvas(baseConfig());
    expect(out.blob).toBeInstanceOf(Blob);
    expect(out.dataUrl).toMatch(/^data:image\/png/);
    expect(out.filename).toBe('soma-2026-04-29-shukla-ekadashi.png');
  });

  it('uses a 1080x1080 canvas', async () => {
    const created: HTMLCanvasElement[] = [];
    const orig = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = orig(tag);
        if (tag === 'canvas') created.push(el as HTMLCanvasElement);
        return el;
      });
    try {
      await renderWisdomCardCanvas(baseConfig());
      expect(created.length).toBeGreaterThan(0);
      const c = created[0];
      expect(c.width).toBe(1080);
      expect(c.height).toBe(1080);
    } finally {
      spy.mockRestore();
    }
  });

  it('throws if canvas 2D context is unavailable', async () => {
    const cv = document.createElement('canvas');
    const getCtx = vi.spyOn(cv, 'getContext').mockReturnValue(null);
    const create = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'canvas') return cv;
        return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
      });
    try {
      await expect(renderWisdomCardCanvas(baseConfig())).rejects.toThrow(
        /Canvas 2D context unavailable/,
      );
    } finally {
      getCtx.mockRestore();
      create.mockRestore();
    }
  });
});
