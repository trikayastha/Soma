import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useShareImage } from '../useShareImage';
import type { WisdomCardOutput } from '../wisdomCard';

function makeOutput(size = 1024): WisdomCardOutput {
  // Pad with whitespace to hit the requested size; type doesn't matter here.
  const filler = ' '.repeat(size);
  return {
    blob: new Blob([filler], { type: 'image/png' }),
    dataUrl: 'data:image/png;base64,AAAA',
    filename: 'soma-2026-04-29-shukla-ekadashi.png',
  };
}

interface MockNavigator {
  canShare?: ReturnType<typeof vi.fn>;
  share?: ReturnType<typeof vi.fn>;
}

function patchNavigator(patch: MockNavigator): () => void {
  const saved = {
    canShare: (navigator as unknown as MockNavigator).canShare,
    share: (navigator as unknown as MockNavigator).share,
  };
  Object.defineProperty(navigator, 'canShare', {
    value: patch.canShare,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, 'share', {
    value: patch.share,
    writable: true,
    configurable: true,
  });
  return () => {
    Object.defineProperty(navigator, 'canShare', {
      value: saved.canShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: saved.share,
      writable: true,
      configurable: true,
    });
  };
}

describe('useShareImage', () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    if (restore) restore();
    restore = null;
    vi.restoreAllMocks();
  });

  it('shares files when canShare({files}) returns true', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    restore = patchNavigator({ canShare, share });
    const { result } = renderHook(() => useShareImage());
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.share(makeOutput());
    });
    expect(outcome).toBe('shared');
    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: expect.any(Array) }),
    );
  });

  it('reports cancelled on AbortError', async () => {
    const abort = Object.assign(new Error('user dismissed'), {
      name: 'AbortError',
    });
    const share = vi.fn().mockRejectedValue(abort);
    const canShare = vi.fn().mockReturnValue(true);
    restore = patchNavigator({ canShare, share });
    const { result } = renderHook(() => useShareImage());
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.share(makeOutput());
    });
    expect(outcome).toBe('cancelled');
  });

  it('falls back to text share when canShare(files) is false', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    restore = patchNavigator({ canShare, share });
    const { result } = renderHook(() => useShareImage());
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.share(makeOutput());
    });
    expect(outcome).toBe('shared');
    // Called once for text share path (no files).
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0]).not.toHaveProperty('files');
    expect(share.mock.calls[0][0]).toHaveProperty('url');
  });

  it('falls back to download when navigator.share is missing', async () => {
    restore = patchNavigator({});
    // Spy on createElement to capture the download anchor.
    const created: HTMLAnchorElement[] = [];
    const orig = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = orig(tag) as HTMLElement;
        if (tag === 'a') {
          // Stub click so JSDOM doesn't navigate.
          (el as HTMLAnchorElement).click = vi.fn();
          created.push(el as HTMLAnchorElement);
        }
        return el;
      });
    // JSDOM lacks createObjectURL — assign stubs directly.
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const revokeObjectURL = vi.fn();
    const savedCreate = (URL as unknown as { createObjectURL?: unknown })
      .createObjectURL;
    const savedRevoke = (URL as unknown as { revokeObjectURL?: unknown })
      .revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      writable: true,
      configurable: true,
    });

    try {
      const { result } = renderHook(() => useShareImage());
      let outcome: string | undefined;
      await act(async () => {
        outcome = await result.current.share(makeOutput());
      });
      expect(outcome).toBe('downloaded');
      expect(created.length).toBeGreaterThan(0);
      expect(created[0].download).toBe(
        'soma-2026-04-29-shukla-ekadashi.png',
      );
      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      Object.defineProperty(URL, 'createObjectURL', {
        value: savedCreate,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: savedRevoke,
        writable: true,
        configurable: true,
      });
    }
  });
});
