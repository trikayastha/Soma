import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  FastSession,
  Location,
  MandalaAnchor,
  NotificationPhilosophy,
  Preferences,
  SomaDay,
  UserProfile,
} from '../lib/types';
import {
  emptyState,
  loadState,
  saveState,
  withLocation,
  withMandalaAnchor,
  withOnboardingComplete,
  withPreferences,
  withProfile,
  withSchedule,
  withSession,
} from '../lib/storage';
import { scheduleLiveReminders } from '../lib/reminders';

interface AppStateContextValue {
  state: AppState;
  setProfile: (profile: UserProfile) => void;
  setSchedule: (schedule: SomaDay[]) => void;
  upsertSession: (session: FastSession) => void;
  completeOnboarding: () => void;
  setPreferences: (prefs: Partial<Preferences>) => void;
  setLocation: (location: Location | null) => void;
  setMandalaAnchor: (anchor: MandalaAnchor) => void;
  setNotificationPhilosophy: (p: NotificationPhilosophy) => void;
  /** Re-anchor the mandala forward to "now". History is retained. */
  manualResetMandala: (now?: Date) => void;
  reset: () => void;
}

const Ctx = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => emptyState());

  // Hydrate on mount (client-only localStorage).
  useEffect(() => {
    setState(loadState());
  }, []);

  // Persist on every change (except the very first hydration).
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Keep in-session browser notifications in sync with the current schedule
  // and preferences. No-op when permission is not granted or when live
  // notifications are disabled. The philosophy tier (quiet/standard/detailed)
  // drives both the volume and the kind of notifications scheduled.
  useEffect(() => {
    if (!state.profile) return;
    const handle = scheduleLiveReminders(
      state.profile,
      state.schedule,
      new Date(),
      state.preferences.notificationPhilosophy,
    );
    return () => handle.clear();
  }, [
    state.profile,
    state.schedule,
    state.preferences.notificationPhilosophy,
  ]);

  const setProfile = useCallback(
    (profile: UserProfile) => setState((s) => withProfile(s, profile)),
    [],
  );
  const setSchedule = useCallback(
    (schedule: SomaDay[]) => setState((s) => withSchedule(s, schedule)),
    [],
  );
  const upsertSession = useCallback(
    (session: FastSession) => setState((s) => withSession(s, session)),
    [],
  );
  const completeOnboarding = useCallback(
    () => setState((s) => withOnboardingComplete(s, true)),
    [],
  );
  const setPreferences = useCallback(
    (prefs: Partial<Preferences>) =>
      setState((s) => withPreferences(s, prefs)),
    [],
  );
  const setLocation = useCallback(
    (location: Location | null) => setState((s) => withLocation(s, location)),
    [],
  );
  const setMandalaAnchor = useCallback(
    (anchor: MandalaAnchor) => setState((s) => withMandalaAnchor(s, anchor)),
    [],
  );
  const setNotificationPhilosophy = useCallback(
    (p: NotificationPhilosophy) =>
      setState((s) => withPreferences(s, { notificationPhilosophy: p })),
    [],
  );
  const manualResetMandala = useCallback(
    (now: Date = new Date()) =>
      setState((s) =>
        withMandalaAnchor(s, {
          ...s.mandalaAnchor,
          manualResetDate: now.toISOString(),
        }),
      ),
    [],
  );
  const reset = useCallback(() => setState(emptyState()), []);

  const value = useMemo(
    () => ({
      state,
      setProfile,
      setSchedule,
      upsertSession,
      completeOnboarding,
      setPreferences,
      setLocation,
      setMandalaAnchor,
      setNotificationPhilosophy,
      manualResetMandala,
      reset,
    }),
    [
      state,
      setProfile,
      setSchedule,
      upsertSession,
      completeOnboarding,
      setPreferences,
      setLocation,
      setMandalaAnchor,
      setNotificationPhilosophy,
      manualResetMandala,
      reset,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppStateContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used inside AppStateProvider');
  return v;
}
