import { describe, it, expect } from 'vitest';
import {
  awakeWeight,
  isSyncedNowKind,
  mulberry32,
  seedFromIso,
  syncedNowCount,
} from '../syncedNow';

describe('seedFromIso', () => {
  it('is deterministic', () => {
    expect(seedFromIso('2026-04-29')).toBe(seedFromIso('2026-04-29'));
  });

  it('changes for different dates', () => {
    expect(seedFromIso('2026-04-29')).not.toBe(seedFromIso('2026-04-30'));
  });
});

describe('mulberry32', () => {
  it('produces a deterministic sequence per seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('returns numbers in [0,1)', () => {
    const r = mulberry32(123);
    for (let i = 0; i < 20; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('awakeWeight', () => {
  it('peaks near UTC 01 and dips near UTC 13.5', () => {
    expect(awakeWeight(1)).toBeGreaterThan(awakeWeight(7));
    expect(awakeWeight(0)).toBeGreaterThan(0.5);
  });

  it('stays in [0.15, 0.95]', () => {
    for (let h = 0; h < 24; h++) {
      const w = awakeWeight(h);
      expect(w).toBeGreaterThan(0.14);
      expect(w).toBeLessThan(0.96);
    }
  });
});

describe('isSyncedNowKind', () => {
  it('accepts the three observance kinds', () => {
    expect(isSyncedNowKind('ekadashi')).toBe(true);
    expect(isSyncedNowKind('full-moon')).toBe(true);
    expect(isSyncedNowKind('new-moon')).toBe(true);
  });

  it('rejects regular and chaturthi', () => {
    expect(isSyncedNowKind('chaturthi')).toBe(false);
    expect(isSyncedNowKind(null)).toBe(false);
    expect(isSyncedNowKind(undefined)).toBe(false);
  });
});

describe('syncedNowCount', () => {
  it('returns null for non-observance kinds', () => {
    expect(
      syncedNowCount({ date: new Date('2026-04-29T12:00:00Z'), kind: 'chaturthi' }),
    ).toBeNull();
    expect(
      syncedNowCount({ date: new Date('2026-04-29T12:00:00Z'), kind: null }),
    ).toBeNull();
  });

  it('is deterministic for the same minute', () => {
    const date = new Date('2026-04-29T13:30:00Z');
    expect(syncedNowCount({ date, kind: 'ekadashi' })).toBe(
      syncedNowCount({ date: new Date(date), kind: 'ekadashi' }),
    );
  });

  it('rounds to the nearest 100', () => {
    const date = new Date('2026-04-29T13:30:00Z');
    const v = syncedNowCount({ date, kind: 'ekadashi' });
    expect(v).not.toBeNull();
    expect((v as number) % 100).toBe(0);
  });

  it('returns a non-negative integer', () => {
    const v = syncedNowCount({
      date: new Date('2026-04-29T13:30:00Z'),
      kind: 'full-moon',
    });
    expect(v).not.toBeNull();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(v as number)).toBe(true);
  });

  it('Ekadashi tends to outsize Amavasya in same minute', () => {
    const date = new Date('2026-04-29T01:00:00Z');
    const ek = syncedNowCount({ date, kind: 'ekadashi' });
    const am = syncedNowCount({ date: new Date(date), kind: 'new-moon' });
    expect(ek).not.toBeNull();
    expect(am).not.toBeNull();
    expect(ek as number).toBeGreaterThan(am as number);
  });

  it('drifts within ±400 across consecutive minutes (same kind)', () => {
    const base = new Date('2026-04-29T13:30:00Z');
    const a = syncedNowCount({ date: base, kind: 'full-moon' })!;
    const b = syncedNowCount({
      date: new Date(base.getTime() + 60_000),
      kind: 'full-moon',
    })!;
    // Both anchor to the same hour so the base × awakeWeight component is
    // identical; the difference is purely PRNG drift (±200 per minute).
    expect(Math.abs(a - b)).toBeLessThanOrEqual(400);
  });
});
