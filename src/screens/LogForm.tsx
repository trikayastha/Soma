import { useState } from 'react';
import type { SubjectiveLog } from '../lib/types';

interface LogFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (log: SubjectiveLog) => void;
}

export function LogForm({ title, subtitle, submitLabel, onCancel, onSubmit }: LogFormProps) {
  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [notes, setNotes] = useState('');

  function submit() {
    onSubmit({ energy, focus, mood, sleep, notes: notes.trim() || undefined });
  }

  return (
    <div className="relative h-full flex flex-col bg-soma-ink">
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 animate-fade-in">
        <h2 className="display-serif text-2xl text-soma-glow">{title}</h2>
        <p className="text-soma-mist text-sm mt-1">{subtitle}</p>

        <div className="mt-7 space-y-5">
          <Scale label="Energy" value={energy} onChange={setEnergy} />
          <Scale label="Focus" value={focus} onChange={setFocus} />
          <Scale label="Mood" value={mood} onChange={setMood} />
          <Scale label="Sleep quality" value={sleep} onChange={setSleep} />
        </div>

        <div className="mt-6">
          <label className="text-xs text-soma-mist uppercase tracking-wider">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering?"
            className="mt-2 w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-soma-moon resize-none outline-none focus:border-soma-glow/50 focus:bg-white/10 transition-colors"
          />
        </div>
      </div>
      <div className="px-6 pb-6 pt-2 flex gap-3">
        <button className="soma-btn-ghost flex-1" onClick={onCancel}>Cancel</button>
        <button className="soma-btn-primary flex-1" onClick={submit}>{submitLabel}</button>
      </div>
    </div>
  );
}

function Scale({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-soma-moon text-sm">{label}</span>
        <span className="text-soma-mist text-xs">{value} / 5</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`${label} ${n}`}
            className={`flex-1 h-11 rounded-xl border transition-colors duration-200 ${
              n <= value
                ? 'bg-soma-glow/20 border-soma-glow/50 text-soma-glow'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-xs text-soma-moon">{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
