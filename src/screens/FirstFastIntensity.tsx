import { useState } from 'react';
import type { Intensity } from '../lib/types';

interface FirstFastIntensityProps {
  /** Preselected option — the profile's current default (16h for new users). */
  defaultIntensity: Intensity;
  onConfirm: (intensity: Intensity) => void;
  onCancel: () => void;
}

const OPTIONS: Array<{ id: Intensity; label: string; sub: string }> = [
  { id: '12h', label: '12 hours', sub: 'Overnight — a gentle start' },
  { id: '16h', label: '16 hours', sub: 'Classic 16:8 — steady' },
  { id: '24h', label: '24 hours', sub: 'Sunset to sunset — traditional' },
];

/**
 * Deferred intensity ask, shown once on the user's first "Begin fast" tap
 * (AARRR activation). Intensity is the only pre-fast choice that is genuinely
 * load-bearing, so it earns its place here rather than in onboarding. The
 * choice becomes the profile default for every fast afterward.
 */
export function FirstFastIntensity({
  defaultIntensity,
  onConfirm,
  onCancel,
}: FirstFastIntensityProps) {
  const [choice, setChoice] = useState<Intensity>(defaultIntensity);

  return (
    <div className="relative h-full flex flex-col bg-soma-ink">
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 animate-fade-in">
        <h2 className="display-serif text-2xl text-soma-glow">
          How long today?
        </h2>
        <p className="text-soma-mist text-sm mt-1 leading-relaxed">
          Pick a length for your first fast. You can change it any time — this
          becomes your default.
        </p>

        <div
          className="mt-7 flex flex-col gap-2"
          role="radiogroup"
          aria-label="Fasting intensity"
        >
          {OPTIONS.map((o) => {
            const selected = choice === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChoice(o.id)}
                className={`soma-card text-left px-4 py-4 transition-colors ${
                  selected ? 'border-soma-glow/60 bg-soma-glow/5' : ''
                }`}
              >
                <div className="text-soma-moon text-sm font-medium">{o.label}</div>
                <div className="text-soma-mist text-xs">{o.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex gap-3">
        <button className="soma-btn-ghost flex-1" onClick={onCancel}>
          Back
        </button>
        <button
          className="soma-btn-primary flex-1"
          onClick={() => onConfirm(choice)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
