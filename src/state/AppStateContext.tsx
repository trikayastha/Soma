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
  Preferences,
  SomaDay,
  UserProfile,
} from '../lib/types';
import {
  emptyState,
  loadState,
  saveState,
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
  // notifications are disabled.
  useEffect(() => {
    if (!state.profile) return;
    const handle = scheduleLiveReminders(state.profile, state.schedule);
    return () => handle.clear();
  }, [state.profile, state.schedule]);

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
  const reset = useCallback(() => setState(emptyState()), []);

  const value = useMemo(
    () => ({
      state,
      setProfile,
      setSchedule,
      upsertSession,
      completeOnboarding,
      setPreferences,
      reset,
    }),
    [
      state,
      setProfile,
      setSchedule,
      upsertSession,
      completeOnboarding,
      setPreferences,
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
