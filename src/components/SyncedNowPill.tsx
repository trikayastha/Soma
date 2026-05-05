import { useEffect, useState } from 'react';
import { syncedNowCount } from '../lib/syncedNow';
import type { SomaDayKind } from '../lib/types';

interface SyncedNowPillProps {
  /** The kind of observance day. Pill renders only for ekadashi/full-moon/new-moon. */
  kind: SomaDayKind | null | undefined;
  /** Optional override for current time — used by tests for determinism. */
  now?: Date;
}

/**
 * Tiny pill rendered on Today / FastTimer when the current day is an
 * Ekadashi, Purnima, or Amavasya. Shows an estimate of how many people
 * are observing right now. Polls once per minute via {@link useEffect}.
 */
export function SyncedNowPill({ kind, now }: SyncedNowPillProps) {
  const [tick, setTick] = useState(() => now ?? new Date());

  useEffect(() => {
    if (now) return; // tests pass an explicit time and disable the timer.
    const t = setInterval(() => setTick(new Date()), 60_000);
    return () => clearInterval(t);
  }, [now]);

  const count = syncedNowCount({ date: tick, kind });
  if (count === null) return null;

  const formatted = count.toLocaleString();
  const aria = `Approximately ${formatted} people observing today.`;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-soma-mist text-[11px] tracking-wide"
      role="status"
      aria-label={aria}
    >
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-soma-glow/80" />
      <span>{formatted} synced now</span>
    </div>
  );
}
