import {
  APP_STATE_VERSION,
  defaultMandalaAnchor,
  defaultPreferences,
  type AppState,
  type FastSession,
  type Location,
  type MandalaAnchor,
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
 * `preferences`). v2 added preferences (S1). v3 adds optional
 * `profile.location` and per-day `sunriseAt` / `tithi.accuracy` (S2).
 *
 * On load we prefer the latest key. Older blobs are migrated additively;
 * we never delete them so users can roll back during a release window.
 */
const LEGACY_V1_KEY = 'soma.state.v1';
const V2_KEY = 'soma.state.v2';
const STORAGE_KEY = 'soma.state.v3';

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
    mandalaAnchor: defaultMandalaAnchor(),
    version: APP_STATE_VERSION,
  };
}

/**
 * Migrate any legacy state blob into a valid v2 {@link AppState}. Idempotent:
 * passing a v2 state through migrateToV2 returns an equivalent v2 state.
 *
 * @deprecated S2: prefer {@link migrateToCurrent}. Kept for tests + back-compat.
 */
export function migrateToV2(raw: UnknownState): AppState {
  return migrateToCurrent(raw);
}

/**
 * Migrate any legacy state blob into a valid current {@link AppState}.
 * Additive across versions: v1 → v2 (preferences) → v3 (profile.location,
 * per-day sunriseAt + tithi.accuracy). Idempotent.
 */
export function migrateToCurrent(raw: UnknownState): AppState {
  const profile = sanitizeProfile(raw.profile);

  const schedule = Array.isArray(raw.schedule)
    ? (raw.schedule as SomaDay[]).map(sanitizeSomaDay)
    : [];

  const sessions = Array.isArray(raw.sessions)
    ? (raw.sessions as FastSession[])
    : [];

  const onboardingComplete = raw.onboardingComplete === true;

  const preferences = mergePreferences(raw.preferences);

  // S3: derive mandalaAnchor.firstObservedFastDate from earliest credited
  // session if not already persisted. Idempotent on a v3 state because the
  // existing anchor value is preserved when present.
  const mandalaAnchor = sanitizeMandalaAnchor(
    (raw as { mandalaAnchor?: unknown }).mandalaAnchor,
    sessions,
  );

  return {
    profile,
    schedule,
    sessions,
    onboardingComplete,
    preferences,
    mandalaAnchor,
    version: APP_STATE_VERSION,
  };
}

/** Derive the anchor when the persisted state has none (v1/v2 → v3). */
function sanitizeMandalaAnchor(
  raw: unknown,
  sessions: FastSession[],
): MandalaAnchor {
  const earliestCompleted = earliestCompletedDate(sessions);
  if (!raw || typeof raw !== 'object') {
    return {
      firstObservedFastDate: earliestCompleted,
      manualResetDate: null,
    };
  }
  const a = raw as Partial<MandalaAnchor>;
  const firstObservedFastDate =
    typeof a.firstObservedFastDate === 'string'
      ? a.firstObservedFastDate
      : earliestCompleted;
  const manualResetDate =
    typeof a.manualResetDate === 'string' ? a.manualResetDate : null;
  return { firstObservedFastDate, manualResetDate };
}

function earliestCompletedDate(sessions: FastSession[]): string | null {
  let earliest: string | null = null;
  for (const s of sessions) {
    if (s.status !== 'completed' && s.status !== 'late-completed') continue;
    if (earliest === null || s.dayDate < earliest) earliest = s.dayDate;
  }
  return earliest;
}

function sanitizeProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as UserProfile & { location?: unknown };
  // Coerce malformed location to null; preserve well-formed locations.
  const location = sanitizeLocation(p.location);
  return { ...p, location };
}

function sanitizeLocation(raw: unknown): Location | null {
  if (!raw || typeof raw !== 'object') return null;
  const l = raw as Partial<Location>;
  if (
    typeof l.lat !== 'number' ||
    typeof l.lon !== 'number' ||
    typeof l.label !== 'string' ||
    typeof l.slug !== 'string' ||
    typeof l.tz !== 'string'
  ) {
    return null;
  }
  return {
    lat: l.lat,
    lon: l.lon,
    label: l.label,
    slug: l.slug,
    tz: l.tz,
    countryCode: typeof l.countryCode === 'string' ? l.countryCode : undefined,
  };
}

/** v3 SomaDay sanitizer: backfills accuracy='approximate' for legacy rows. */
function sanitizeSomaDay(raw: SomaDay): SomaDay {
  if (!raw.tithi) return raw;
  const accuracy = raw.tithi.accuracy ?? 'approximate';
  return {
    ...raw,
    tithi: { ...raw.tithi, accuracy },
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
    // Prefer the current schema key.
    const v3Raw = localStorage.getItem(STORAGE_KEY);
    if (v3Raw) {
      const parsed = JSON.parse(v3Raw) as UnknownState;
      return migrateToCurrent(parsed);
    }
    // Fall back to v2 (S1 beta) — preferences exist, location does not.
    const v2Raw = localStorage.getItem(V2_KEY);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as UnknownState;
      return migrateToCurrent(parsed);
    }
    // Fall back to v1 (pre-S1 beta).
    const v1Raw = localStorage.getItem(LEGACY_V1_KEY);
    if (v1Raw) {
      const parsed = JSON.parse(v1Raw) as UnknownState;
      return migrateToCurrent(parsed);
    }
    return emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  // Always persist to current schema key. Legacy keys are left in place so
  // users can roll back during a release window (additive migration).
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(V2_KEY);
  localStorage.removeItem(LEGACY_V1_KEY);
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

/**
 * Update {@link UserProfile.location}. No-op when there is no profile.
 * Pass `null` to clear an existing location.
 */
export function withLocation(
  state: AppState,
  location: Location | null,
): AppState {
  if (!state.profile) return state;
  return {
    ...state,
    profile: { ...state.profile, location },
  };
}

/** Replace the mandala anchor wholesale (immutable). */
export function withMandalaAnchor(
  state: AppState,
  mandalaAnchor: MandalaAnchor,
): AppState {
  return { ...state, mandalaAnchor };
}
