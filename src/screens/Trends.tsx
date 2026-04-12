import { AmbientBackground } from '../components/AmbientBackground';
import { useAppState } from '../state/AppStateContext';
import { toISODate } from '../lib/lunar';

export function Trends() {
  const { state } = useAppState();
  const completed = state.sessions.filter((s) => s.status === 'completed');
  const todayIso = toISODate(new Date());
  const upcoming = state.schedule.filter((d) => d.date >= todayIso).slice(0, 4);
  const focusDeltas = completed
    .map((s) => (s.postLog && s.preLog ? s.postLog.focus - s.preLog.focus : null))
    .filter((v): v is number => v !== null);
  const avgDelta =
    focusDeltas.length > 0
      ? focusDeltas.reduce((a, b) => a + b, 0) / focusDeltas.length
      : 0;

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">Your trends</h1>
          <p className="text-soma-mist text-xs mt-1">
            Your focus on Soma days vs. your baseline.
          </p>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Fasts completed" value={String(completed.length)} />
          <Stat
            label="Focus delta"
            value={avgDelta >= 0 ? `+${avgDelta.toFixed(1)}` : avgDelta.toFixed(1)}
            sub="post - pre"
          />
          <Stat
            label="Scheduled ahead"
            value={String(state.schedule.length)}
          />
          <Stat
            label="Active now"
            value={state.sessions.some((s) => s.status === 'active') ? 'Yes' : 'No'}
          />
        </div>

        <div className="soma-card p-5 mt-6">
          <h2 className="display-serif text-xl text-soma-glow">Recent sessions</h2>
          {completed.length === 0 ? (
            <p className="text-soma-mist text-xs mt-3">
              Nothing yet. Complete your first fast to see it here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {completed
                .slice()
                .reverse()
                .slice(0, 6)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-xs text-soma-moon border-b border-white/5 pb-2 last:border-0"
                  >
                    <span>{s.dayDate}</span>
                    <span className="text-soma-mist">
                      {s.intensityHours}h
                      {s.postLog && s.preLog
                        ? ` · focus ${s.preLog.focus}→${s.postLog.focus}`
                        : ''}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {upcoming.length > 0 && (
          <div className="soma-card p-5 mt-4">
            <h2 className="display-serif text-xl text-soma-glow">Upcoming</h2>
            <ul className="mt-3 space-y-2">
              {upcoming.map((d) => {
                const whenDate = new Date(d.date + 'T00:00:00Z');
                const pretty = whenDate.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <li
                    key={d.date + d.kind}
                    className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0"
                  >
                    <span className="text-soma-moon">{d.title}</span>
                    <span className="text-soma-mist">{pretty}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="soma-card p-4">
      <div className="text-[10px] text-soma-mist uppercase tracking-wider">{label}</div>
      <div className="display-serif text-2xl text-soma-glow mt-1">{value}</div>
      {sub && <div className="text-[10px] text-soma-mist mt-1">{sub}</div>}
    </div>
  );
}
