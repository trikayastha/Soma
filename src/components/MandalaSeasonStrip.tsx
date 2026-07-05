import type { Mandala } from '../lib/types';

interface MandalaSeasonStripProps {
  mandalas: Mandala[];
  /** Number of trailing mandalas to show. Defaults to 12 (~1 lunar year). */
  count?: number;
}

/**
 * Horizontal strip of the last N mandalas. Each cell is a thin bar whose
 * fill height = `completionRate`. The current (last) mandala is highlighted
 * with an accent border. Pure SVG; no images.
 */
export function MandalaSeasonStrip({
  mandalas,
  count = 12,
}: MandalaSeasonStripProps) {
  if (mandalas.length === 0) return null;
  const slice = mandalas.slice(-count);
  return (
    <section className="soma-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-soma-mist">
        Last {slice.length} mandalas
      </div>
      <div
        className="mt-3 flex items-end gap-1 h-16"
        role="img"
        aria-label={`Last ${slice.length} mandalas — completion rates`}
      >
        {slice.map((m, i) => {
          const isCurrent = i === slice.length - 1;
          const fillH = Math.max(0.05, Math.min(1, m.completionRate)) * 100;
          return (
            <div
              key={m.startDate}
              className={`flex-1 h-full rounded-sm bg-white/5 border ${
                isCurrent ? 'border-soma-accent/70' : 'border-white/10'
              } relative overflow-hidden`}
              title={`Mandala ${m.index} · ${Math.round(m.completionRate * 100)}%`}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 ${
                  m.status === 'completed'
                    ? 'bg-soma-glow/80'
                    : m.status === 'partial'
                    ? 'bg-soma-mist/40'
                    : 'bg-soma-accent/50'
                }`}
                style={{ height: `${fillH}%` }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
