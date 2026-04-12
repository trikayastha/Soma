import type { AppState, FastSession, SomaDay, UserProfile } from './types';

const STORAGE_KEY = 'soma.state.v1';

export function emptyState(): AppState {
  return {
    profile: null,
    schedule: [],
    sessions: [],
    onboardingComplete: false,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    return {
      profile: parsed.profile ?? null,
      schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      onboardingComplete: !!parsed.onboardingComplete,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Immutable update helpers — returns a new state object. */
export function withProfile(state: AppState, profile: UserProfile): AppState {
  return { ...state, profile };
}

export function withSchedule(state: AppState, schedule: SomaDay[]): AppState {
  return { ...state, schedule };
}

export function withSession(state: AppState, session: FastSession): AppState {
  const idx = state.sessions.findIndex((s) => s.id === session.id);
  const sessions =
    idx >= 0
      ? state.sessions.map((s, i) => (i === idx ? session : s))
      : [...state.sessions, session];
  return { ...state, sessions };
}

export function withOnboardingComplete(state: AppState, value: boolean): AppState {
  return { ...state, onboardingComplete: value };
}
