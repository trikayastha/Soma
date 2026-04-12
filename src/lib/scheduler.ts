import type { FastSession, SomaDay, SubjectiveLog } from './types';

/** Generate a short, collision-resistant id without pulling in a uuid dep. */
export function makeId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function startSession(day: SomaDay, preLog: SubjectiveLog): FastSession {
  return {
    id: makeId(),
    dayDate: day.date,
    startedAt: new Date().toISOString(),
    intensityHours: day.intensityHours,
    status: 'active',
    preLog,
  };
}

export function completeSession(
  session: FastSession,
  postLog: SubjectiveLog,
  now: Date = new Date(),
): FastSession {
  return {
    ...session,
    status: 'completed',
    endedAt: now.toISOString(),
    postLog,
  };
}

export function abortSession(
  session: FastSession,
  now: Date = new Date(),
): FastSession {
  return {
    ...session,
    status: 'aborted',
    endedAt: now.toISOString(),
  };
}

/** Returns 0..1 progress of an active session. Clamped. */
export function sessionProgress(session: FastSession, now: Date = new Date()): number {
  const start = new Date(session.startedAt).getTime();
  const totalMs = session.intensityHours * 3600 * 1000;
  const elapsed = now.getTime() - start;
  if (elapsed <= 0) return 0;
  if (elapsed >= totalMs) return 1;
  return elapsed / totalMs;
}

export function sessionTimeRemainingMs(
  session: FastSession,
  now: Date = new Date(),
): number {
  const start = new Date(session.startedAt).getTime();
  const totalMs = session.intensityHours * 3600 * 1000;
  return Math.max(0, start + totalMs - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function findActiveSession(sessions: FastSession[]): FastSession | null {
  return sessions.find((s) => s.status === 'active') ?? null;
}
