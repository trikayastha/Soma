import { describe, it, expect } from 'vitest';
import {
  abortSession,
  completeSession,
  findActiveSession,
  formatCountdown,
  makeId,
  sessionProgress,
  sessionTimeRemainingMs,
  startSession,
} from '../scheduler';
import type { SomaDay, SubjectiveLog } from '../types';

const sampleDay: SomaDay = {
  date: '2025-03-14',
  kind: 'ekadashi',
  intensityHours: 16,
  title: 'Shukla Ekadashi',
  tradition: 'vedic',
};

const baselineLog: SubjectiveLog = {
  energy: 3,
  focus: 3,
  mood: 3,
  sleep: 3,
};

describe('scheduler / ids', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeId()));
    expect(ids.size).toBe(100);
  });
});

describe('scheduler / session lifecycle', () => {
  it('starts an active session with the pre-fast log attached', () => {
    const s = startSession(sampleDay, baselineLog);
    expect(s.status).toBe('active');
    expect(s.intensityHours).toBe(16);
    expect(s.dayDate).toBe('2025-03-14');
    expect(s.preLog).toEqual(baselineLog);
    expect(s.endedAt).toBeUndefined();
  });

  it('completing a session sets status, endedAt, and postLog immutably', () => {
    const s = startSession(sampleDay, baselineLog);
    const completed = completeSession(s, { ...baselineLog, focus: 5 });
    expect(completed.status).toBe('completed');
    expect(completed.endedAt).toBeTruthy();
    expect(completed.postLog?.focus).toBe(5);
    // original not mutated
    expect(s.status).toBe('active');
    expect(s.postLog).toBeUndefined();
  });

  it('aborting a session sets status aborted and records endedAt', () => {
    const s = startSession(sampleDay, baselineLog);
    const aborted = abortSession(s);
    expect(aborted.status).toBe('aborted');
    expect(aborted.endedAt).toBeTruthy();
    expect(s.status).toBe('active');
  });

  it('findActiveSession returns the active one or null', () => {
    const s = startSession(sampleDay, baselineLog);
    expect(findActiveSession([s])?.id).toBe(s.id);
    const done = completeSession(s, baselineLog);
    expect(findActiveSession([done])).toBeNull();
  });
});

describe('scheduler / progress + countdown', () => {
  it('progress 0 at start, 1 at end, clamps beyond end', () => {
    const start = new Date('2025-03-14T08:00:00Z');
    const session = {
      ...startSession(sampleDay, baselineLog),
      startedAt: start.toISOString(),
      intensityHours: 10,
    };
    expect(sessionProgress(session, start)).toBe(0);
    const mid = new Date(start.getTime() + 5 * 3600 * 1000);
    expect(sessionProgress(session, mid)).toBeCloseTo(0.5, 2);
    const end = new Date(start.getTime() + 10 * 3600 * 1000);
    expect(sessionProgress(session, end)).toBe(1);
    const after = new Date(start.getTime() + 12 * 3600 * 1000);
    expect(sessionProgress(session, after)).toBe(1);
  });

  it('time remaining never goes negative', () => {
    const start = new Date('2025-03-14T08:00:00Z');
    const session = {
      ...startSession(sampleDay, baselineLog),
      startedAt: start.toISOString(),
      intensityHours: 1,
    };
    const future = new Date(start.getTime() + 5 * 3600 * 1000);
    expect(sessionTimeRemainingMs(session, future)).toBe(0);
  });

  it('formatCountdown renders hh:mm:ss zero-padded', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(61 * 1000)).toBe('00:01:01');
    expect(formatCountdown(3723 * 1000)).toBe('01:02:03');
  });
});
