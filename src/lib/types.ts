export type Intensity = '12h' | '16h' | '24h';

export type LunarPhaseName =
  | 'new-moon'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full-moon'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export type SomaDayKind =
  | 'ekadashi'
  | 'full-moon'
  | 'new-moon'
  | 'chaturthi'
  | 'pradosh'
  | 'sankashti-chaturthi'
  | 'shivaratri';

/** Provenance of a tithi computation — drives Receipts UI copy. */
export type TithiAccuracy = 'sunrise' | 'approximate' | 'polar-fallback';

export interface SomaDay {
  date: string; // ISO yyyy-mm-dd
  kind: SomaDayKind;
  intensityHours: number;
  title: string;
  tradition: 'vedic' | 'newa-buddhist';
  /** ISO 8601 sunrise instant used to anchor the tithi computation. */
  sunriseAt?: string | null;
  /** Optional named Ekadashi like "Putrada", "Vaikuntha". */
  ekadashiName?: string | null;
  /** Lunar month index 1..12 (Chaitra=1). Present when location provided. */
  lunarMonth?: number;
  /** True if this day falls inside an Adhik (intercalary) month. */
  adhik?: boolean;
  /** Optional Vedic tithi metadata for the day. */
  tithi?: {
    index: number;
    indexInPaksha: number;
    paksha: 'shukla' | 'krishna';
    name: string;
    accuracy?: TithiAccuracy;
    boundaryStart?: string | null;
    boundaryEnd?: string | null;
  };
}

/**
 * Geographic location for sunrise-anchored tithi computation. Persisted in
 * `UserProfile.location`. `slug` is used in S5 SEO/URL routing.
 */
export interface Location {
  lat: number;
  lon: number;
  label: string;
  slug: string;
  tz: string;
  countryCode?: string;
}

/** Curated city seed entry. */
export interface City {
  slug: string;
  label: string;
  lat: number;
  lon: number;
  tz: string;
  countryCode: string;
  population?: number;
}

export interface FastSession {
  id: string;
  dayDate: string;
  startedAt: string;
  endedAt?: string;
  intensityHours: number;
  status: 'active' | 'completed' | 'aborted';
  preLog?: SubjectiveLog;
  postLog?: SubjectiveLog;
}

export interface SubjectiveLog {
  energy: number;
  focus: number;
  mood: number;
  sleep: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  timezone: string;
  experience: 'none' | 'some' | 'experienced';
  goal: 'focus' | 'calm' | 'discipline' | 'metabolic';
  defaultIntensity: Intensity;
  onboardedAt: string;
  safetyFlags: SafetyFlags;
  reminders: RemindersPrefs;
  /** Optional geographic location for sunrise-anchored tithi (S2). */
  location?: Location | null;
}

export interface RemindersPrefs {
  /** Local time HH:mm when the fast begins on the day. */
  dayOfTime: string;
  /** Minutes before dayOfTime for the "get ready" reminder. */
  leadMinutes: number;
  /** Whether the in-session Notification scheduler is active. */
  liveNotifications: boolean;
}

export function defaultRemindersPrefs(): RemindersPrefs {
  return { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false };
}

export interface SafetyFlags {
  pregnant: boolean;
  eatingDisorderHistory: boolean;
  diabetes: boolean;
  under18: boolean;
}

/* -------------------------------------------------------------------------
 * Preferences (S1)
 * -----------------------------------------------------------------------*/

/** Tone of all user-facing copy. */
export type Voice = 'scientific' | 'traditional' | 'coach';

/** Visual theme: surface palette + typography family. */
export type Theme = 'performance' | 'devotional' | 'minimal';

/** User's stated reason for using Soma. Drives default theme + voice. */
export type Intent = 'optimize' | 'tradition' | 'tired' | 'curious';

/** How loudly Soma reminds the user. */
export type NotificationPhilosophy = 'quiet' | 'standard' | 'detailed';

export interface Preferences {
  voice: Voice;
  theme: Theme;
  intent: Intent | null;
  notificationPhilosophy: NotificationPhilosophy;
}

export function defaultPreferences(): Preferences {
  return {
    voice: 'coach',
    theme: 'performance',
    intent: null,
    notificationPhilosophy: 'quiet',
  };
}

/** Schema version persisted alongside state. Bump on breaking change. */
export const APP_STATE_VERSION = 3 as const;
export type AppStateVersion = typeof APP_STATE_VERSION;

export interface AppState {
  profile: UserProfile | null;
  schedule: SomaDay[];
  sessions: FastSession[];
  onboardingComplete: boolean;
  preferences: Preferences;
  version: AppStateVersion;
}
