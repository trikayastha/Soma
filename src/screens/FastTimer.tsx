import { useEffect, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { abortSession, formatCountdown, sessionProgress, sessionTimeRemainingMs } from '../lib/scheduler';
import { useAppState } from '../state/AppStateContext';
import type { FastSession } from '../lib/types';

interface FastTimerProps {
  session: FastSession;
  onOpenMeditation: () => void;
  onComplete: () => void;
  onExit: () => void;
}

export function FastTimer({ session, onOpenMeditation, onComplete, onExit }: FastTimerProps) {
  const { upsertSession } = useAppState();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const progress = sessionProgress(session, now);
  const remainingMs = sessionTimeRemainingMs(session, now);
  const done = remainingMs === 0;

  function endEarly() {
    if (!confirm('End this fast early? It will be marked as aborted.')) return;
    const aborted = abortSession(session, new Date());
    upsertSession(aborted);
    onExit();
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col px-6 pt-8 pb-8 text-center animate-fade-in">
        <div className="text-xs uppercase tracking-widest text-soma-accent">
          Fasting · {session.intensityHours}h
        </div>

        <div className="flex-1 flex items-center justify-center">
          <ProgressRing progress={progress} remainingMs={remainingMs} />
        </div>

        <div className="space-y-3">
          {done ? (
            <button className="soma-btn-primary w-full" onClick={onComplete}>
              Complete fast
            </button>
          ) : (
            <>
              <button className="soma-btn-primary w-full" onClick={onOpenMeditation}>
                Begin 10-minute meditation
              </button>
              <button className="soma-btn-ghost w-full" onClick={onExit}>
                Back
              </button>
              <button
                className="text-soma-crimson/80 text-xs underline underline-offset-4"
                onClick={endEarly}
              >
                End fast early
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({
  progress, remainingMs,
}: {
  progress: number;
  remainingMs: number;
}) {
  const stroke = 6;
  const size = 260;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

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
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#F4EFD9"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display-serif text-[clamp(2.25rem,11vw,3rem)] text-soma-glow tabular-nums">
          {formatCountdown(remainingMs)}
        </div>
        <div className="text-soma-mist text-xs mt-2 tracking-wider uppercase">
          {Math.round(progress * 100)}% complete
        </div>
      </div>
    </div>
  );
}
