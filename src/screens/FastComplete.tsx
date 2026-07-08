import { useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { MandalaRing } from '../components/MandalaRing';
import { WisdomCard } from '../components/WisdomCard';
import { useAppState } from '../state/AppStateContext';
import { currentMandala } from '../lib/mandala';
import { downloadIcs, requestPermission } from '../lib/reminders';
import { track } from '../lib/analytics';
import {
  elongationToPhaseName,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
  toISODate,
} from '../lib/lunar';
import { computeTithiAtSunrise, tithiLabel } from '../lib/tithi';
import { resolveWisdom } from '../lib/wisdomContent';
import { MANDALA_CONFIG } from '../lib/types';

interface FastCompleteProps {
  onDone: () => void;
}

/**
 * The payoff screen shown right after a fast is logged (AARRR retention +
 * referral). It closes the loop at the emotional peak by:
 *   1. Naming the win — the mandala ring with this fast's mark filled.
 *   2. Naming the reason to return — "N more and Soma shows your patterns".
 *   3. Offering the shareable card (referral) while the user feels it.
 *   4. Asking for the reminder in context — the reliable .ics + optional push.
 */
export function FastComplete({ onDone }: FastCompleteProps) {
  const { state, setProfile } = useAppState();
  const profile = state.profile;
  const now = useMemo(() => new Date(), []);
  const todayIso = toISODate(now);

  // Today's lunar reading, mirrored from the Wisdom screen so the shared card
  // is identical to the one users find under Wisdom → Today.
  const noonUtc = useMemo(() => new Date(`${todayIso}T12:00:00Z`), [todayIso]);
  const elongation = useMemo(() => moonElongation(noonUtc), [noonUtc]);
  const illum = useMemo(() => moonIllumination(noonUtc), [noonUtc]);
  const phaseName = elongationToPhaseName(elongation);
  const waxing = elongation < 180;
  const location = profile?.location ?? null;
  const tithi = useMemo(
    () => computeTithiAtSunrise(noonUtc, location),
    [noonUtc, location],
  );
  const todaysSomaDay = state.schedule.find((d) => d.date === todayIso) ?? null;
  const cardLabel = todaysSomaDay
    ? todaysSomaDay.title
    : `${phaseNameToLabel(phaseName)} · ${tithiLabel(tithi)}`;
  const wisdom = useMemo(
    () => resolveWisdom(tithi.index, todaysSomaDay?.kind ?? null),
    [tithi.index, todaysSomaDay],
  );

  const completedCount = state.sessions.filter(
    (s) => s.status === 'completed' || s.status === 'late-completed',
  ).length;
  const remaining = Math.max(0, MANDALA_CONFIG.minExpected - completedCount);
  const mandala = useMemo(() => currentMandala(state, now), [state, now]);

  const nextFast = useMemo(() => {
    const upcoming = state.schedule
      .filter((d) => d.date > todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [state.schedule, todayIso]);

  const [reminderStatus, setReminderStatus] = useState<
    'idle' | 'on' | 'blocked'
  >(profile?.reminders.liveNotifications ? 'on' : 'idle');

  function handleAddToCalendar() {
    if (!profile) return;
    downloadIcs(profile, state.schedule);
    track('calendar_exported', { source: 'fast_complete' });
  }

  async function handleEnableReminders() {
    if (!profile) return;
    const res = await requestPermission();
    if (res === 'granted') {
      setProfile({
        ...profile,
        reminders: { ...profile.reminders, liveNotifications: true },
      });
      track('reminder_scheduled', { channel: 'push' });
      setReminderStatus('on');
    } else {
      setReminderStatus('blocked');
    }
  }

  const patternLine =
    remaining > 0
      ? `${remaining} more logged fast${remaining === 1 ? '' : 's'} and Soma starts showing your personal patterns.`
      : 'Your personal patterns are live — see them under Wisdom → You.';

  return (
    <div className="relative h-full flex flex-col bg-soma-ink">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-10 pb-8 animate-fade-in">
        <p className="text-soma-accent text-xs uppercase tracking-widest">
          Fast complete
        </p>
        <h1 className="display-serif text-3xl text-soma-glow mt-1">
          {completedCount <= 1 ? 'Your first mark is set' : 'Another one kept'}
        </h1>

        {mandala && (
          <div className="flex justify-center my-6">
            <MandalaRing mandala={mandala} today={now} size={200} />
          </div>
        )}

        <p
          className="text-soma-moon text-sm leading-relaxed text-center"
          style={{ textWrap: 'balance' }}
        >
          {patternLine}
        </p>

        {/* Referral: the card at the emotional peak. */}
        <div className="mt-7">
          <WisdomCard
            date={now}
            tithiLabel={cardLabel}
            oneWordBenefit={wisdom.benefit}
            wisdomLine={wisdom.line}
            illumination={illum}
            waxing={waxing}
          />
        </div>

        {/* Retention: contextual reminder ask, hidden once reminders are on. */}
        {reminderStatus !== 'on' && nextFast && (
          <section className="soma-card p-5 mt-4">
            <div className="text-[10px] uppercase tracking-wider text-soma-accent">
              Don't lose the rhythm
            </div>
            <p className="text-soma-moon text-sm mt-1 leading-relaxed">
              Your next fast is <strong>{nextFast.title}</strong>,{' '}
              {describeWhen(todayIso, nextFast.date)}.
            </p>
            <button
              className="soma-btn-primary w-full mt-3"
              onClick={handleAddToCalendar}
            >
              Add my fasts to calendar
            </button>
            <button
              className="soma-btn-ghost w-full mt-2"
              onClick={handleEnableReminders}
            >
              Or turn on reminders in the app
            </button>
            {reminderStatus === 'blocked' && (
              <p className="text-[11px] text-soma-mist mt-2 text-center">
                Notifications are blocked in your browser — the calendar file is
                the reliable path.
              </p>
            )}
          </section>
        )}
        {reminderStatus === 'on' && (
          <p className="text-[11px] text-soma-sage text-center mt-4">
            Reminders are on. We'll ping you when Soma is open.
          </p>
        )}

        <button className="soma-btn-ghost w-full mt-6" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

/** "tomorrow" / "in N days" from one ISO date to another. */
function describeWhen(fromIso: string, toIso: string): string {
  const days = Math.round(
    (new Date(toIso + 'T00:00:00Z').getTime() -
      new Date(fromIso + 'T00:00:00Z').getTime()) /
      86_400_000,
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
