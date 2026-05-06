import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// JSDOM doesn't ship a canvas implementation. Stub `getContext('2d')` with a
// no-op CanvasRenderingContext2D so WisdomCard tests can drive the renderer
// end-to-end without pulling in node-canvas.
function createMockCanvasContext(): unknown {
  const mock = {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
    lineWidth: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 }) as TextMetrics),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    clip: vi.fn(),
  };
  return mock;
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    function getContext(this: HTMLCanvasElement, kind: string) {
      if (kind === '2d') return createMockCanvasContext() as never;
      return null as never;
    },
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = vi.fn(function toBlob(
    this: HTMLCanvasElement,
    cb: BlobCallback,
    type?: string,
  ) {
    cb(new Blob(['mock-png'], { type: type ?? 'image/png' }));
  }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(function toDataURL() {
    return 'data:image/png;base64,bW9jaw==';
  }) as unknown as typeof HTMLCanvasElement.prototype.toDataURL;
}
