import { useEffect, useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SyncedNowPill } from '../components/SyncedNowPill';
import { PhaseGlyph } from '../components/PhaseGlyph';
import { track } from '../lib/analytics';
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
  // Count-up vs count-down — Zero's research point: a countdown hitting
  // 0:00 nudges people to eat; elapsed frames the fast as accumulation.
  const [showElapsed, setShowElapsed] = useState(false);

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
  const elapsedMs = Math.max(
    0,
    now.getTime() - new Date(session.startedAt).getTime(),
  );
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
    track('fast_aborted', {
      intensity: session.intensityHours,
      progress_pct: Math.round(progress * 100),
    });
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
    // A late completion still counts toward the mandala, so it belongs in the
    // same completion funnel as the post-log path — without this the timer's
    // late-complete button was silently uncounted.
    track('fast_completed', {
      status: lc.status,
      intensity: session.intensityHours,
      via: 'timer_late',
    });
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
            elapsedMs={elapsedMs}
            done={done}
            showElapsed={showElapsed}
            onToggleUnit={() => setShowElapsed((v) => !v)}
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

// Neutral waypoints along the ring — quarter marks, with the halfway
// point emphasized. Deliberately not metabolic "zones": Soma makes no
// medical claims about what hour N does to the body.
const MILESTONES = [0.25, 0.5, 0.75];

function ProgressRing({
  progress,
  remainingMs,
  elapsedMs,
  done,
  showElapsed,
  onToggleUnit,
  illumination,
  waxing,
}: {
  progress: number;
  remainingMs: number;
  elapsedMs: number;
  done: boolean;
  showElapsed: boolean;
  onToggleUnit: () => void;
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
  // Past the goal the ring shifts to the accent tone — status readable
  // at a glance, no numbers needed.
  const ringColor = done ? 'var(--accent, #7dd3fc)' : '#F4EFD9';
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
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 600ms ease',
          }}
        />
        {MILESTONES.map((f) => {
          const a = ((-90 + f * 360) * Math.PI) / 180;
          const passed = clamped >= f;
          return (
            <circle
              key={f}
              cx={cx + r * Math.cos(a)}
              cy={cy + r * Math.sin(a)}
              r={f === 0.5 ? 4 : 3}
              fill={passed ? ringColor : 'var(--surface-elev, #11182e)'}
              stroke={passed ? 'none' : 'rgba(255,255,255,0.25)'}
              strokeWidth={1}
            />
          );
        })}
        <g transform={`translate(${glyphX} ${glyphY})`}>
          <PhaseGlyph
            illumination={illumination}
            waxing={waxing}
            size={glyphSize}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Demoted countdown — no longer the hero number. Tapping it flips
            between time remaining and time elapsed. */}
        <button
          type="button"
          onClick={onToggleUnit}
          aria-label={
            showElapsed ? 'Show time remaining' : 'Show time elapsed'
          }
          className="flex flex-col items-center rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-soma-accent"
        >
          <div className="text-soma-mist text-xs tracking-widest uppercase">
            {Math.round(progress * 100)}% complete
          </div>
          <div className="text-soma-moon text-2xl tabular-nums mt-1">
            {formatCountdown(showElapsed ? elapsedMs : remainingMs)}
          </div>
          <div className="text-soma-mist text-[10px] tracking-widest uppercase mt-0.5">
            {showElapsed ? 'elapsed' : 'remaining'}
          </div>
        </button>
      </div>
    </div>
  );
}
