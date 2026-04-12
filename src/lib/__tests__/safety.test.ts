import { describe, it, expect } from 'vitest';
import { emptySafetyFlags, evaluateSafety } from '../safety';

describe('safety / evaluateSafety', () => {
  it('allows users with no flags', () => {
    const v = evaluateSafety(emptySafetyFlags());
    expect(v.allowed).toBe(true);
  });

  it('blocks under-18 with age category', () => {
    const v = evaluateSafety({ ...emptySafetyFlags(), under18: true });
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.category).toBe('age');
  });

  it('blocks pregnancy with medical category', () => {
    const v = evaluateSafety({ ...emptySafetyFlags(), pregnant: true });
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.category).toBe('medical');
  });

  it('blocks eating-disorder history', () => {
    const v = evaluateSafety({
      ...emptySafetyFlags(),
      eatingDisorderHistory: true,
    });
    expect(v.allowed).toBe(false);
  });

  it('blocks diabetes', () => {
    const v = evaluateSafety({ ...emptySafetyFlags(), diabetes: true });
    expect(v.allowed).toBe(false);
  });

  it('under-18 takes precedence over other flags', () => {
    const v = evaluateSafety({
      under18: true,
      pregnant: true,
      eatingDisorderHistory: true,
      diabetes: true,
    });
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.category).toBe('age');
  });
});
