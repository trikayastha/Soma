import type { FastSession, SomaDay } from '../lib/types';

interface PaksaSessionListProps {
  sessions: FastSession[];
  schedule: SomaDay[];
}

/**
 * Two-column session list grouped by paksha (Shukla / Krishna). Sessions
 * are sorted by date descending. No streak counter — Soma is anti-streak
 * by design.
 */
export function PaksaSessionList({ sessions, schedule }: PaksaSessionListProps) {
  const byDate = new Map<string, SomaDay>();
  for (const d of schedule) byDate.set(d.date, d);

  const credited = sessions
    .filter((s) => s.status === 'completed' || s.status === 'late-completed')
    .slice()
    .sort((a, b) => (a.dayDate < b.dayDate ? 1 : -1));

  const shukla: FastSession[] = [];
  const krishna: FastSession[] = [];
  for (const s of credited) {
    const day = byDate.get(s.dayDate);
    const paksha = day?.tithi?.paksha ?? 'shukla';
    if (paksha === 'krishna') krishna.push(s);
    else shukla.push(s);
  }

  return (
    <section className="soma-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-soma-mist">
        Sessions by paksha
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <Column title="Shukla" items={shukla} byDate={byDate} />
        <Column title="Krishna" items={krishna} byDate={byDate} />
      </div>
    </section>
  );
}

function Column({
  title,
  items,
  byDate,
}: {
  title: string;
  items: FastSession[];
  byDate: Map<string, SomaDay>;
}) {
  return (
    <div>
      <h3 className="text-soma-accent text-xs uppercase tracking-wider">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-soma-mist text-[11px] mt-2">No sessions yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((s) => {
            const day = byDate.get(s.dayDate);
            return (
              <li
                key={s.id}
                className="text-xs text-soma-moon flex justify-between border-b border-white/5 pb-1 last:border-0"
              >
                <span className="tabular-nums">{s.dayDate}</span>
                <span className="text-soma-mist truncate ml-2">
                  {day?.title ?? `${s.intensityHours}h`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
