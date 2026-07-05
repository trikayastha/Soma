import { useEffect, useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SyncedNowPill } from '../components/SyncedNowPill';
import { PhaseGlyph } from '../components/PhaseGlyph';
import {
  abortSession,
  formatCountdown,
  lateCompleteSession,
  sessionProgress,
  sessionTimeRemainingMs,
} from '../lib/scheduler';
import { syncedNowCount } from '../lib/syncedNow';
import { moonElongation, moonIllumination } from '../lib/lunar';
import { useAppState } from '../state/AppStateContext';
import { useVoice } from '../i18n/useVoice';
import type { FastSession, SomaDay } from '../lib/types';

interface FastTimerProps {
  session: FastSession;
  onOpenMeditation: () => void;
  onComplete: () => void;
  onExit: () => void;
}

export function FastTimer({
  session,
  onOpenMeditation,
  onComplete,
  onExit,
}: FastTimerProps) {
  const { state, upsertSession } = useAppState();
  const { t, tFormat } = useVoice();
  const [now, setNow] = useState(new Date());
  const [endEarlyOpen, setEndEarlyOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const day: SomaDay | undefined = useMemo(
    () => state.schedule.find((d) => d.date === session.dayDate),
    [state.schedule, session.dayDate],
  );

  const progress = sessionProgress(session, now);
  const remainingMs = sessionTimeRemainingMs(session, now);
  const done = remainingMs === 0;
  const synced = syncedNowCount({ date: now, kind: day?.kind ?? null });
  // Live moon math — drives the PhaseGlyph riding the timer ring.
  const elongation = useMemo(() => moonElongation(now), [now]);
  const illumination = useMemo(() => moonIllumination(now), [now]);
  const waxing = elongation < 180;

  function endEarly() {
    setEndEarlyOpen(true);
  }

  function confirmEndEarly() {
    setEndEarlyOpen(false);
    const aborted = abortSession(session, new Date());
    upsertSession(aborted);
    onExit();
  }

  function logLateCompletion() {
    // Late-completion path: user finished the fast but is past the window.
    // We persist as 'late-completed' (counts toward Mandala) without a post-log.
    const lc = lateCompleteSession(
      session,
      session.postLog ?? {
        energy: 0,
        focus: 0,
        mood: 0,
        sleep: 0,
      },
      new Date(),
    );
    upsertSession(lc);
    onExit();
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col px-6 pt-8 pb-8 text-center animate-fade-in">
        <div className="text-xs uppercase tracking-widest text-soma-accent">
          {tFormat('fast.timer.label', { hours: session.intensityHours })}
        </div>

        {/* Primary mount: synced-now pill takes the lead frame on FastTimer. */}
        {synced !== null && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <SyncedNowPill kind={day?.kind ?? null} now={now} />
            <p className="text-soma-mist text-xs">
              {tFormat('fast.synced.primary', { n: synced.toLocaleString() })}
            </p>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <ProgressRing
            progress={progress}
            remainingMs={remainingMs}
            kind={day?.kind ?? null}
            illumination={illumination}
            waxing={waxing}
          />
        </div>

        <div className="space-y-3">
          {done ? (
            <>
              <div className="text-soma-glow text-sm">
                {t('fast.lateComplete.title')}
              </div>
              <p className="text-soma-mist text-xs leading-relaxed">
                {t('fast.lateComplete.body')}
              </p>
              <button className="soma-btn-primary w-full" onClick={onComplete}>
                {t('fast.complete.cta')}
              </button>
              <button
                className="soma-btn-ghost w-full"
                onClick={logLateCompletion}
              >
                {t('fast.lateComplete.cta')}
              </button>
            </>
          ) : (
            <>
              <button
                className="soma-btn-primary w-full"
                onClick={onOpenMeditation}
              >
                {t('fast.meditation.cta')}
              </button>
              <button className="soma-btn-ghost w-full" onClick={onExit}>
                Back
              </button>
              <button
                className="text-soma-mist text-xs underline underline-offset-4 hover:text-soma-moon transition-colors"
                onClick={endEarly}
              >
                {t('fast.endEarly.cta')}
              </button>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={endEarlyOpen}
        title={t('fast.endEarly.cta')}
        body={t('fast.endEarly.confirm.gentle')}
        confirmLabel={t('fast.endEarly.cta')}
        cancelLabel="Stay with it"
        variant="gentle"
        onConfirm={confirmEndEarly}
        onCancel={() => setEndEarlyOpen(false)}
      />
    </div>
  );
}

function ProgressRing({
  progress,
  remainingMs,
  illumination,
  waxing,
}: {
  progress: number;
  remainingMs: number;
  kind: SomaDay['kind'] | null;
  illumination: number;
  waxing: boolean;
}) {
  const stroke = 6;
  const size = 260;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  // Clamp progress to [0,1] so the glyph never overshoots on late completion.
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = c * (1 - clamped);
  // Position the phase glyph at the ring head — angle = -90deg + (progress * 360).
  const angleDeg = -90 + clamped * 360;
  const rad = (angleDeg * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const glyphSize = 24;
  const glyphX = cx + r * Math.cos(rad) - glyphSize / 2;
  const glyphY = cy + r * Math.sin(rad) - glyphSize / 2;

  return (
    <div
      className="relative w-full max-w-[78vw] aspect-square"
      style={{ maxWidth: 'min(78vw, 260px)' }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full drop-shadow-[0_0_30px_rgba(244,239,217,0.15)]"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#F4EFD9"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <g transform={`translate(${glyphX} ${glyphY})`}>
          <PhaseGlyph
            illumination={illumination}
            waxing={waxing}
            size={glyphSize}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Demoted countdown — no longer the hero number. */}
        <div className="text-soma-mist text-xs tracking-widest uppercase">
          {Math.round(progress * 100)}% complete
        </div>
        <div className="text-soma-moon text-2xl tabular-nums mt-1">
          {formatCountdown(remainingMs)}
        </div>
      </div>
    </div>
  );
}
