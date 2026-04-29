import { AmbientBackground } from '../components/AmbientBackground';
import { ReminderSettings } from '../components/ReminderSettings';
import { generateSchedule } from '../lib/lunar';
import type { Intensity } from '../lib/types';
import { useAppState } from '../state/AppStateContext';

export function Settings() {
  const { state, setSchedule, reset, setProfile } = useAppState();
  const profile = state.profile;

  function setIntensity(i: Intensity) {
    if (!profile) return;
    setProfile({ ...profile, defaultIntensity: i });
    setSchedule(generateSchedule(new Date(), 60, i));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soma-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (!confirm('Reset Soma completely? This deletes all local data.')) return;
    reset();
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">Settings</h1>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-5 pb-8">
        <section className="soma-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">Profile</div>
          <div className="text-soma-moon text-lg mt-1">{profile?.name ?? '—'}</div>
          <div className="text-soma-mist text-xs mt-1">
            Goal: {profile?.goal} · Experience: {profile?.experience}
          </div>
        </section>

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Default intensity
          </div>
          <div className="mt-3 flex gap-2">
            {(['12h', '16h', '24h'] as Intensity[]).map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`flex-1 py-2 rounded-full text-sm border transition-colors ${
                  profile?.defaultIntensity === i
                    ? 'bg-soma-glow text-soma-ink border-soma-glow'
                    : 'border-white/15 text-soma-moon'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-soma-mist mt-2">
            Changing this regenerates your 60-day schedule.
          </p>
        </section>

        <ReminderSettings />

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">Data</div>
          <button className="soma-btn-ghost w-full mt-3" onClick={exportData}>
            Export my data (JSON)
          </button>
          <button
            className="w-full mt-2 py-3 rounded-full border border-soma-crimson/40 text-soma-crimson text-sm"
            onClick={handleReset}
          >
            Reset Soma
          </button>
        </section>

        <p className="text-[10px] text-soma-mist text-center mt-6 leading-relaxed">
          Soma is wellness, not medicine. We make no medical claims.
          <br />
          Beta v0.1 · Built by founders with lived lineage to the source tradition.
        </p>
        </div>
      </div>
    </div>
  );
}
