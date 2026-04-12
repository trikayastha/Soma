import { useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { BottomNav, type TabId } from './components/BottomNav';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { FastTimer } from './screens/FastTimer';
import { LogForm } from './screens/LogForm';
import { Meditation } from './screens/Meditation';
import { Trends } from './screens/Trends';
import { Learn } from './screens/Learn';
import { Settings } from './screens/Settings';
import type { FastSession, SomaDay, SubjectiveLog } from './lib/types';
import { completeSession, findActiveSession, startSession } from './lib/scheduler';

type Overlay =
  | { kind: 'none' }
  | { kind: 'pre-log'; day: SomaDay }
  | { kind: 'timer' }
  | { kind: 'meditation' }
  | { kind: 'post-log'; session: FastSession };

function Shell() {
  const { state, upsertSession } = useAppState();
  const [tab, setTab] = useState<TabId>('today');
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });

  if (!state.onboardingComplete || !state.profile) {
    return <Onboarding />;
  }

  const active = findActiveSession(state.sessions);

  // --- overlay handlers -------------------------------------------------
  function handleStartFast(day: SomaDay) {
    setOverlay({ kind: 'pre-log', day });
  }

  function handlePreLogSubmit(day: SomaDay, log: SubjectiveLog) {
    const session = startSession(day, log);
    upsertSession(session);
    setOverlay({ kind: 'timer' });
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
    upsertSession(completed);
    setOverlay({ kind: 'none' });
    setTab('trends');
  }

  // --- render -----------------------------------------------------------
  // Overlays take over the full viewport (no bottom nav) for focus.
  if (overlay.kind === 'pre-log') {
    return (
      <LogForm
        title="Before you begin"
        subtitle="How are you right now? We'll compare after."
        submitLabel="Start fast"
        onCancel={() => setOverlay({ kind: 'none' })}
        onSubmit={(log) => handlePreLogSubmit(overlay.day, log)}
      />
    );
  }

  if (overlay.kind === 'timer' && active) {
    return (
      <FastTimer
        session={active}
        onOpenMeditation={() => setOverlay({ kind: 'meditation' })}
        onComplete={handleCompleteFast}
        onExit={handleExitTimer}
      />
    );
  }

  if (overlay.kind === 'meditation') {
    return <Meditation onExit={() => setOverlay({ kind: 'timer' })} />;
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {tab === 'today' && (
          <Today onStartFast={handleStartFast} onResumeActive={handleOpenTimer} />
        )}
        {tab === 'trends' && <Trends />}
        {tab === 'learn' && <Learn />}
        {tab === 'settings' && <Settings />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <PhoneFrame>
        <Shell />
      </PhoneFrame>
    </AppStateProvider>
  );
}
