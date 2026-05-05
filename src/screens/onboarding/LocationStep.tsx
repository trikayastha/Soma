import { useMemo, useState } from 'react';
import { searchCities, customCity } from '../../lib/cities';
import type { City, Location } from '../../lib/types';

interface LocationStepProps {
  value: Location | null;
  onChange: (next: Location | null) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Optional onboarding step: ask the user for their location so the app
 * can anchor tithi computation at local sunrise.
 *
 * - Plain text input with debounced (memoized) prefix-search across the
 *   30-city seed.
 * - "Skip" / "Continue without location" preserves the legacy (UTC-noon)
 *   behaviour and tags days as `accuracy: 'approximate'` downstream.
 * - Custom-city fallback: if the user types a label not in the seed, we
 *   surface a "Use as custom location" affordance — coords are inferred
 *   from a small lookup and default to (0,0) when missing (caller can
 *   later refine via Settings).
 *
 * Privacy: we do NOT geolocate. The user always types or picks. Location
 * lives entirely client-side in `state.profile.location`.
 */
export function LocationStep({ value, onChange, onNext, onBack }: LocationStepProps) {
  const [query, setQuery] = useState(value?.label ?? '');
  const matches = useMemo(() => searchCities(query, 6), [query]);

  function pickCity(c: City) {
    const loc: Location = {
      lat: c.lat,
      lon: c.lon,
      label: c.label,
      slug: c.slug,
      tz: c.tz,
      countryCode: c.countryCode,
    };
    onChange(loc);
    setQuery(c.label);
  }

  function clearLocation() {
    onChange(null);
    setQuery('');
  }

  function useCustomLabel() {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const c = customCity(trimmed, 0, 0, tz);
    pickCity(c);
  }

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="display-serif text-3xl text-soma-glow">Where are you?</h2>
      <p className="text-soma-mist text-sm mt-2" style={{ textWrap: 'balance' }}>
        Optional. Your city anchors tithi at local sunrise — the way Drik
        Panchang and almanacs do it. Stays on this device.
      </p>

      <label className="mt-8 text-xs text-soma-mist uppercase tracking-wider">City</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search…"
        autoComplete="off"
        className="mt-2 bg-transparent border-b border-white/20 text-soma-moon py-2 text-lg outline-none focus:border-soma-glow focus-visible:outline-none"
      />

      {query.length >= 2 && matches.length > 0 && (
        <ul role="listbox" className="mt-3 flex flex-col gap-1">
          {matches.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => pickCity(c)}
                className={`w-full text-left soma-card px-4 py-2 transition-colors ${
                  value?.slug === c.slug
                    ? 'border-soma-glow/60 bg-soma-glow/5'
                    : ''
                }`}
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

      {query.length >= 2 && matches.length === 0 && (
        <button
          type="button"
          onClick={useCustomLabel}
          className="mt-3 soma-card text-left px-4 py-2 text-soma-mist text-sm hover:text-soma-glow"
        >
          Use "{query.trim()}" as a custom location
        </button>
      )}

      {value && (
        <div className="mt-5 text-[11px] text-soma-mist">
          Selected: <span className="text-soma-glow">{value.label}</span>
          {' · '}
          <button
            type="button"
            onClick={clearLocation}
            className="underline hover:text-soma-glow"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>
          Back
        </button>
        <button className="soma-btn-ghost flex-1" onClick={() => { clearLocation(); onNext(); }}>
          Skip
        </button>
        <button className="soma-btn-primary flex-1" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}
