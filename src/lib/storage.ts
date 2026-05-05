import {
  APP_STATE_VERSION,
  defaultPreferences,
  type AppState,
  type FastSession,
  type Preferences,
  type SomaDay,
  type UserProfile,
} from './types';

/**
 * Storage layout
 * --------------
 * We persist the entire {@link AppState} as a single JSON blob in
 * localStorage. The schema is versioned via {@link APP_STATE_VERSION}.
 *
 * Beta users have data under `soma.state.v1` (no `version` field, no
 * `preferences`). On load we read v2 first; if absent, we read v1 and
 * migrate. Save is non-destructive: the v1 blob is left in place for one
 * release so users can roll back if needed.
 */
const LEGACY_KEY = 'soma.state.v1';
const STORAGE_KEY = 'soma.state.v2';

interface UnknownState {
  version?: unknown;
  profile?: unknown;
  schedule?: unknown;
  sessions?: unknown;
  onboardingComplete?: unknown;
  preferences?: unknown;
  [k: string]: unknown;
}

export function emptyState(): AppState {
  return {
    profile: null,
    schedule: [],
    sessions: [],
    onboardingComplete: false,
    preferences: defaultPreferences(),
    version: APP_STATE_VERSION,
  };
}

/**
 * Migrate any legacy state blob into a valid v2 {@link AppState}. Idempotent:
 * passing a v2 state through migrateToV2 returns an equivalent v2 state.
 */
export function migrateToV2(raw: UnknownState): AppState {
  const profile =
    raw.profile && typeof raw.profile === 'object'
      ? (raw.profile as UserProfile)
      : null;

  const schedule = Array.isArray(raw.schedule)
    ? (raw.schedule as SomaDay[])
    : [];

  const sessions = Array.isArray(raw.sessions)
    ? (raw.sessions as FastSession[])
    : [];

  const onboardingComplete = raw.onboardingComplete === true;

  const preferences = mergePreferences(raw.preferences);

  return {
    profile,
    schedule,
    sessions,
    onboardingComplete,
    preferences,
    version: APP_STATE_VERSION,
  };
}

function mergePreferences(raw: unknown): Preferences {
  const defaults = defaultPreferences();
  if (!raw || typeof raw !== 'object') return defaults;
  const p = raw as Partial<Preferences>;
  return {
    voice:
      p.voice === 'scientific' || p.voice === 'traditional' || p.voice === 'coach'
        ? p.voice
        : defaults.voice,
    theme:
      p.theme === 'performance' ||
      p.theme === 'devotional' ||
      p.theme === 'minimal'
        ? p.theme
        : defaults.theme,
    intent:
      p.intent === 'optimize' ||
      p.intent === 'tradition' ||
      p.intent === 'tired' ||
      p.intent === 'curious'
        ? p.intent
        : null,
    notificationPhilosophy:
      p.notificationPhilosophy === 'quiet' ||
      p.notificationPhilosophy === 'standard' ||
      p.notificationPhilosophy === 'detailed'
        ? p.notificationPhilosophy
        : defaults.notificationPhilosophy,
  };
}

export function loadState(): AppState {
  try {
    // Prefer v2.
    const v2Raw = localStorage.getItem(STORAGE_KEY);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as UnknownState;
      return migrateToV2(parsed);
    }
    // Fall back to v1 for beta users.
    const v1Raw = localStorage.getItem(LEGACY_KEY);
    if (v1Raw) {
      const parsed = JSON.parse(v1Raw) as UnknownState;
      return migrateToV2(parsed);
    }
    return emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  // Always persist as v2; we intentionally do NOT touch the v1 key so that
  // beta users can roll back during this release window (see H6).
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

/* ------------------------------------------------------------------------
 * Immutable update helpers — every helper returns a new state object.
 * ----------------------------------------------------------------------*/

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

export function withOnboardingComplete(
  state: AppState,
  value: boolean,
): AppState {
  return { ...state, onboardingComplete: value };
}

export function withPreferences(
  state: AppState,
  prefs: Partial<Preferences>,
): AppState {
  return {
    ...state,
    preferences: { ...state.preferences, ...prefs },
  };
}
