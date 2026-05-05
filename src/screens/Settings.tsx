import { useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { ReminderSettings } from '../components/ReminderSettings';
import { generateSchedule } from '../lib/lunar';
import { searchCities } from '../lib/cities';
import type { City, Intensity, Location, Theme, Voice } from '../lib/types';
import { useAppState } from '../state/AppStateContext';
import { VOICES } from '../i18n/voices';
import { THEMES } from '../themes/themes';
import { useVoice } from '../i18n/useVoice';

export function Settings() {
  const {
    state,
    setSchedule,
    reset,
    setProfile,
    setPreferences,
    setLocation,
    manualResetMandala,
  } = useAppState();
  const { t } = useVoice();
  const profile = state.profile;
  const prefs = state.preferences;
  const [locQuery, setLocQuery] = useState('');
  const matches = useMemo(() => searchCities(locQuery, 6), [locQuery]);

  function pickCity(c: City) {
    const loc: Location = {
      lat: c.lat,
      lon: c.lon,
      label: c.label,
      slug: c.slug,
      tz: c.tz,
      countryCode: c.countryCode,
    };
    setLocation(loc);
    setLocQuery('');
    if (profile) {
      setSchedule(
        generateSchedule(new Date(), 60, profile.defaultIntensity, loc),
      );
    }
  }

  function clearLocation() {
    setLocation(null);
    if (profile) {
      setSchedule(
        generateSchedule(new Date(), 60, profile.defaultIntensity, null),
      );
    }
  }

  function setIntensity(i: Intensity) {
    if (!profile) return;
    setProfile({ ...profile, defaultIntensity: i });
    setSchedule(generateSchedule(new Date(), 60, i, profile.location ?? null));
  }

  function setVoice(v: Voice) {
    setPreferences({ voice: v });
  }
  function setTheme(t: Theme) {
    setPreferences({ theme: t });
  }
  function resetIntent() {
    setPreferences({ intent: null });
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
    const msg =
      'Reset Soma completely? This deletes all local data, including your voice, theme, and intent.';
    if (!confirm(msg)) return;
    reset();
  }

  function handleResetRhythm() {
    if (!confirm(t('mandala.reset.confirm'))) return;
    manualResetMandala();
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

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Voice
          </div>
          <p className="text-[11px] text-soma-mist mt-1">
            Tone of every prompt and explainer.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`soma-card text-left px-4 py-3 transition-colors ${
                  prefs.voice === v.id ? 'border-soma-glow/60 bg-soma-glow/5' : ''
                }`}
                aria-pressed={prefs.voice === v.id}
              >
                <div className="text-soma-moon text-sm font-medium">{v.label}</div>
                <div className="text-soma-mist text-xs">{v.sub}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Theme
          </div>
          <p className="text-[11px] text-soma-mist mt-1">
            Surface palette and typography.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`soma-card text-left px-4 py-3 transition-colors ${
                  prefs.theme === th.id ? 'border-soma-glow/60 bg-soma-glow/5' : ''
                }`}
                aria-pressed={prefs.theme === th.id}
              >
                <div className="text-soma-moon text-sm font-medium">{th.label}</div>
                <div className="text-soma-mist text-xs">{th.sub}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Intent
          </div>
          <div className="text-soma-moon text-sm mt-1">
            {prefs.intent
              ? prefs.intent[0].toUpperCase() + prefs.intent.slice(1)
              : '—'}
          </div>
          <button
            className="soma-btn-ghost w-full mt-3"
            onClick={resetIntent}
            disabled={prefs.intent === null}
          >
            Re-run intent picker
          </button>
          <p className="text-[11px] text-soma-mist mt-2">
            Clears your stated intent so the picker shows on next visit.
          </p>
        </section>

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Location
          </div>
          <p className="text-[11px] text-soma-mist mt-1">
            Anchors tithi at your local sunrise. Stays on this device.
          </p>
          {profile?.location ? (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-soma-glow">{profile.location.label}</span>
              <button
                type="button"
                onClick={clearLocation}
                className="text-xs text-soma-mist underline hover:text-soma-glow"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="mt-3 text-soma-mist text-xs">No location set</p>
          )}
          <input
            value={locQuery}
            onChange={(e) => setLocQuery(e.target.value)}
            placeholder="Search city…"
            autoComplete="off"
            className="mt-3 w-full bg-transparent border-b border-white/20 text-soma-moon py-2 text-sm outline-none focus:border-soma-glow"
          />
          {locQuery.length >= 2 && matches.length > 0 && (
            <ul role="listbox" className="mt-2 flex flex-col gap-1">
              {matches.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => pickCity(c)}
                    className="w-full text-left soma-card px-3 py-2 hover:border-soma-glow/40"
                  >
                    <div className="text-soma-moon text-sm">{c.label}</div>
                    <div className="text-soma-mist text-[11px]">
                      {c.countryCode} · {c.tz}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ReminderSettings />

        <section className="soma-card p-5 mt-4">
          <div className="text-[10px] uppercase tracking-wider text-soma-mist">
            Rhythm
          </div>
          <p className="text-[11px] text-soma-mist mt-1">
            Mandalas grow from your earliest fast. Reset re-anchors a fresh
            40-day window starting today — past mandalas stay in history.
          </p>
          <button
            type="button"
            className="soma-btn-ghost w-full mt-3"
            onClick={handleResetRhythm}
          >
            {t('mandala.reset.cta')}
          </button>
        </section>

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
