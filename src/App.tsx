import { useEffect, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { BottomNav, type TabId } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { FastTimer } from './screens/FastTimer';
import { LogForm } from './screens/LogForm';
import { FirstFastIntensity } from './screens/FirstFastIntensity';
import { FastComplete } from './screens/FastComplete';
import { Meditation } from './screens/Meditation';
import { Rhythm } from './screens/Rhythm';
import { Wisdom } from './screens/Wisdom';
import { Settings } from './screens/Settings';
import type { FastSession, Intensity, SomaDay, SubjectiveLog } from './lib/types';
import { completeSession, findActiveSession, startSession } from './lib/scheduler';
import { generateSchedule } from './lib/lunar';
import { useTheme } from './themes/useTheme';
import { track, identify } from './lib/analytics';

type Overlay =
  | { kind: 'none' }
  | { kind: 'intensity'; day: SomaDay }
  | { kind: 'pre-log'; day: SomaDay }
  | { kind: 'timer' }
  | { kind: 'meditation' }
  | { kind: 'post-log'; session: FastSession }
  | { kind: 'celebrate' }
  | { kind: 'settings' };

function Shell() {
  const {
    state,
    upsertSession,
    setPreferences,
    setProfile,
    setSchedule,
    setMandalaAnchor,
  } = useAppState();
  // Mount the active theme on <html data-theme="..."> so CSS variables
  // resolve before any themed pixel is painted.
  useTheme();

  // Deep-link handler: visiting `?reset_intent=1` clears the stored intent
  // so the IntentRouter shows again on next onboarding entry. We strip
  // the param after handling so reload doesn't keep firing the reset.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_intent') !== '1') return;
    setPreferences({ intent: null });
    params.delete('reset_intent');
    const search = params.toString();
    const url =
      window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
    window.history.replaceState({}, '', url);
  }, [setPreferences]);

  // Returning-visitor identity: onboarding calls identify() once, but a reload
  // starts an anonymous PostHog session. Re-attach person properties whenever a
  // stored profile is present so segmentation survives reloads and stays fresh.
  useEffect(() => {
    if (!state.onboardingComplete || !state.profile) return;
    identify({
      goal: state.profile.goal,
      intent: state.preferences.intent ?? null,
      experience: state.profile.experience,
      default_intensity: state.profile.defaultIntensity,
      timezone: state.profile.timezone,
    });
  }, [state.onboardingComplete, state.profile, state.preferences.intent]);

  const [tab, setTab] = useState<TabId>('today');
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });

  if (!state.onboardingComplete || !state.profile) {
    return <Onboarding />;
  }

  const active = findActiveSession(state.sessions);
  const isFirstFast = state.sessions.length === 0;

  // --- overlay handlers -------------------------------------------------
  function handleStartFast(day: SomaDay) {
    // On the very first fast, ask the one load-bearing question (how long)
    // before the mood log. Afterwards the profile default is used directly.
    setOverlay(isFirstFast ? { kind: 'intensity', day } : { kind: 'pre-log', day });
  }

  // First fast only: the chosen intensity becomes the profile default and
  // reshapes the schedule, then we proceed to the (skippable) pre-log.
  function handleIntensityChosen(day: SomaDay, intensity: Intensity) {
    const hours = parseInt(intensity, 10);
    if (state.profile) {
      setProfile({ ...state.profile, defaultIntensity: intensity });
      setSchedule(
        generateSchedule(new Date(), 60, intensity, state.profile.location ?? null),
      );
    }
    track('first_fast_intensity_chosen', { intensity });
    setOverlay({ kind: 'pre-log', day: { ...day, intensityHours: hours } });
  }

  // Shared start path for both the logged and skipped first fast.
  function beginFast(day: SomaDay, log?: SubjectiveLog) {
    const session = startSession(day, log);
    // `first` powers the activation metric: did this user start a fast in
    // their first session? Measured before the new session is stored.
    track('fast_started', {
      kind: day.kind,
      intensity: day.intensityHours,
      first: isFirstFast,
      logged: log !== undefined,
    });
    upsertSession(session);
    setOverlay({ kind: 'timer' });
  }

  function handlePreLogSubmit(day: SomaDay, log: SubjectiveLog) {
    beginFast(day, log);
  }

  function handleOpenTimer() {
    setOverlay({ kind: 'timer' });
  }

  function handleExitTimer() {
    setOverlay({ kind: 'none' });
  }

  function handleCompleteFast() {
    if (!active) return;
    setOverlay({ kind: 'post-log', session: active });
  }

  function handlePostLogSubmit(session: FastSession, log: SubjectiveLog) {
    const completed = completeSession(session, log);
    track('fast_completed', {
      status: completed.status,
      intensity: completed.intensityHours,
    });
    upsertSession(completed);
    // Seed the mandala anchor live on the first credited fast so the payoff
    // ring fills immediately (otherwise it is only derived on next load).
    if (
      !state.mandalaAnchor.firstObservedFastDate &&
      !state.mandalaAnchor.manualResetDate
    ) {
      setMandalaAnchor({
        ...state.mandalaAnchor,
        firstObservedFastDate: completed.dayDate,
      });
    }
    setOverlay({ kind: 'celebrate' });
  }

  // --- render -----------------------------------------------------------
  // Overlays take over the full viewport (no bottom nav) for focus.
  if (overlay.kind === 'intensity') {
    return (
      <FirstFastIntensity
        defaultIntensity={state.profile.defaultIntensity}
        onConfirm={(intensity) => handleIntensityChosen(overlay.day, intensity)}
        onCancel={() => setOverlay({ kind: 'none' })}
      />
    );
  }

  if (overlay.kind === 'pre-log') {
    const day = overlay.day;
    return (
      <LogForm
        title="Before you begin"
        subtitle="How are you right now? We'll compare after."
        submitLabel="Start fast"
        onCancel={() => setOverlay({ kind: 'none' })}
        onSubmit={(log) => handlePreLogSubmit(day, log)}
        // First fast is skippable so nothing stands between tap and timer.
        onSkip={isFirstFast ? () => beginFast(day) : undefined}
      />
    );
  }

  function handleOpenMeditation() {
    track('meditation_started', { intensity: active?.intensityHours ?? null });
    setOverlay({ kind: 'meditation' });
  }

  if (overlay.kind === 'timer' && active) {
    return (
      <FastTimer
        session={active}
        onOpenMeditation={handleOpenMeditation}
        onComplete={handleCompleteFast}
        onExit={handleExitTimer}
      />
    );
  }

  if (overlay.kind === 'meditation') {
    return <Meditation onExit={() => setOverlay({ kind: 'timer' })} />;
  }

  if (overlay.kind === 'settings') {
    return <Settings onClose={() => setOverlay({ kind: 'none' })} />;
  }

  if (overlay.kind === 'post-log') {
    return (
      <LogForm
        title="You completed the fast"
        subtitle="How do you feel right now?"
        submitLabel="Save"
        onCancel={() => setOverlay({ kind: 'none' })}
        onSubmit={(log) => handlePostLogSubmit(overlay.session, log)}
      />
    );
  }

  if (overlay.kind === 'celebrate') {
    return (
      <FastComplete
        onDone={() => {
          setOverlay({ kind: 'none' });
          setTab('rhythm');
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {tab === 'today' && (
          <Today onStartFast={handleStartFast} onResumeActive={handleOpenTimer} />
        )}
        {tab === 'wisdom' && <Wisdom />}
        {tab === 'rhythm' && (
          <Rhythm onOpenSettings={() => setOverlay({ kind: 'settings' })} />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <PhoneFrame>
        <ErrorBoundary>
          <Shell />
        </ErrorBoundary>
      </PhoneFrame>
    </AppStateProvider>
  );
}
