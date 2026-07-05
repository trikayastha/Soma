import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

interface MockMQL {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener?: (type: string, cb: (e: MediaQueryListEvent) => void) => void;
  removeEventListener?: (type: string, cb: (e: MediaQueryListEvent) => void) => void;
  addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
  removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
  dispatchEvent: (e: Event) => boolean;
}

function patchMatchMedia(impl: (q: string) => MockMQL): () => void {
  const saved = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(impl),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: saved,
    });
  };
}

describe('useReducedMotion', () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    if (restore) restore();
    restore = null;
  });

  it('returns true when matchMedia says reduce is set', () => {
    restore = patchMatchMedia(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when matchMedia says no preference', () => {
    restore = patchMatchMedia(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('reacts to change events via addEventListener', () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    restore = patchMatchMedia(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: (_type, cb) => {
        listener = cb;
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });

  it('falls back to addListener when addEventListener is absent', () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    restore = patchMatchMedia(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      // Force the legacy path by omitting addEventListener entirely.
      addListener: (cb) => {
        listener = cb;
      },
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });
});
