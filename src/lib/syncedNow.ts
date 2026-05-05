import type { SomaDayKind } from './types';

/**
 * Synced-Now algorithm
 * --------------------
 * Returns a deterministic pseudo-realtime estimate of how many people are
 * observing today's lunar event. "Deterministic" = same minute on
 * different devices yields the same number. The number drifts ±200 within
 * a minute and is rounded to the nearest hundred for a natural feel.
 *
 * Calibration (subject to refinement, see master spec):
 *   ~1.05B Hindus globally × 0.4 typical observance rate × 0.7 awake-hour
 *   decay = ~294M potential observers worldwide. Per-event multipliers
 *   (Ekadashi 0.30, Purnima 0.18, Amavasya 0.12) reflect the relative
 *   share who actively observe each kind.
 */

const TOTAL_OBSERVERS = 294_000_000;

/**
 * Kinds of days for which a Synced-Now count is rendered. Other kinds
 * (regular, chaturthi, etc.) suppress the pill.
 */
export type SyncedNowKind = 'ekadashi' | 'full-moon' | 'new-moon';

const KIND_MULTIPLIERS: Record<SyncedNowKind, number> = {
  ekadashi: 0.3,
  'full-moon': 0.18,
  'new-moon': 0.12,
};

/** Returns true when the given SomaDayKind has a Synced-Now value. */
export function isSyncedNowKind(
  kind: SomaDayKind | null | undefined,
): kind is SyncedNowKind {
  return kind === 'ekadashi' || kind === 'full-moon' || kind === 'new-moon';
}

/* ------------------------------------------------------------------------
 * Determinism primitives
 * ----------------------------------------------------------------------*/

/** FNV-1a 32-bit hash of an ISO date string. */
export function seedFromIso(iso: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — small, fast, deterministic. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Smooth bell curve over UTC hours, peaking near 01 and 13 UTC
 * (≈ IST 06:30 and 18:30 — the two prayer / observance peaks).
 */
export function awakeWeight(utcHour: number): number {
  return 0.55 + 0.4 * Math.cos(((utcHour - 1) / 24) * 2 * Math.PI);
}

export interface SyncedNowArgs {
  date: Date;
  kind: SomaDayKind | null | undefined;
}

/**
 * Compute the synced-now count for the given date + day kind.
 * Returns null when the day is not an observance day.
 */
export function syncedNowCount(args: SyncedNowArgs): number | null {
  const { date, kind } = args;
  if (!isSyncedNowKind(kind)) return null;

  const iso = date.toISOString().slice(0, 10);
  const minuteSeed =
    seedFromIso(iso) ^ (date.getUTCHours() * 31 + date.getUTCMinutes());
  const rand = mulberry32(minuteSeed);

  const mult = KIND_MULTIPLIERS[kind];
  const base = TOTAL_OBSERVERS * awakeWeight(date.getUTCHours()) * mult;
  const drift = Math.floor((rand() - 0.5) * 400);
  return Math.max(0, Math.round((base + drift) / 100) * 100);
}
