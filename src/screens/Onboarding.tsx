import { useEffect, useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { MoonPhase } from '../components/MoonPhase';
import { identify, track } from '../lib/analytics';
import { evaluateSafety, emptySafetyFlags } from '../lib/safety';
import { generateSchedule, phaseNameToLabel, toISODate } from '../lib/lunar';
import { describeTithi } from '../lib/describeTithi';
import { useLunarDay } from '../lib/useLunarDay';
import {
  defaultRemindersPrefs,
  type Intent,
  type SafetyFlags,
  type UserProfile,
} from '../lib/types';
import { useAppState } from '../state/AppStateContext';
import { IntentRouter } from './onboarding/IntentRouter';

// Moon-first onboarding (AARRR activation inversion): the very first screen
// shows today's actual moon + tithi with zero input — Soma's magic moment.
// Only two questions gate entry: intent (sets theme/voice + goal) and the
// safety check (a genuine health gate). Everything else — name, location,
// experience, intensity — is deferred and asked contextually the moment it is
// first needed:
//   • name       → editable in Settings (defaults to "Seeker")
//   • intensity  → asked on the first "Begin fast" tap
//   • location   → asked in Settings when tithi precision matters
const STEPS = ['moon', 'intent', 'safety'] as const;
type Step = (typeof STEPS)[number];

// Intent → goal mapping. The single intent question sets both fields so
// downstream code and Settings keep reading `profile.goal` unchanged.
const INTENT_GOAL: Record<Intent, UserProfile['goal']> = {
  optimize: 'metabolic',
  tradition: 'discipline',
  tired: 'calm',
  curious: 'focus',
};

// Sensible defaults for everything we no longer ask up front. Each of these is
// editable later (name/location/intensity in Settings; intensity also at the
// first fast) so the deferral never traps the user in a wrong choice.
const DEFAULT_NAME = 'Seeker';
const DEFAULT_EXPERIENCE: UserProfile['experience'] = 'some';
const DEFAULT_INTENSITY: UserProfile['defaultIntensity'] = '16h';

export function Onboarding() {
  const { setProfile, setSchedule, completeOnboarding, state } = useAppState();
  const [step, setStep] = useState<Step>('moon');
  const [goal, setGoal] = useState<UserProfile['goal']>(
    state.preferences.intent ? INTENT_GOAL[state.preferences.intent] : 'focus',
  );
  const [safety, setSafety] = useState<SafetyFlags>(emptySafetyFlags());

  const verdict = useMemo(() => evaluateSafety(safety), [safety]);
  const idx = STEPS.indexOf(step);

  // Funnel: which onboarding step a user reaches, to locate drop-off.
  useEffect(() => {
    track('onboarding_step', { step, index: idx });
  }, [step, idx]);

  function goto(next: Step) {
    setStep(next);
  }

  function finish() {
    if (!verdict.allowed) return;
    const profile: UserProfile = {
      name: DEFAULT_NAME,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      experience: DEFAULT_EXPERIENCE,
      goal,
      defaultIntensity: DEFAULT_INTENSITY,
      onboardedAt: new Date().toISOString(),
      safetyFlags: safety,
      reminders: defaultRemindersPrefs(),
      location: null,
    };
    const schedule = generateSchedule(new Date(), 60, DEFAULT_INTENSITY, null);
    setProfile(profile);
    setSchedule(schedule);
    completeOnboarding();
    track('onboarding_complete', { intent: state.preferences.intent, goal });
    identify({
      goal,
      intent: state.preferences.intent ?? null,
      experience: profile.experience,
      default_intensity: profile.defaultIntensity,
      timezone: profile.timezone,
    });
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col px-7 pt-10 pb-8 animate-fade-in">
        {/* The moon screen is the magic moment — no progress chrome on it. */}
        {step !== 'moon' && <Progress current={idx - 1} total={STEPS.length - 1} />}

        {step === 'moon' && (
          <MoonFirstStep
            onNext={() => goto(state.preferences.intent ? 'safety' : 'intent')}
          />
        )}
        {step === 'intent' && (
          <IntentRouter
            onSelected={(intent) => {
              setGoal(INTENT_GOAL[intent]);
              goto('safety');
            }}
          />
        )}
        {step === 'safety' && (
          <SafetyStep
            flags={safety}
            setFlags={setSafety}
            verdict={verdict}
            onFinish={finish}
            onBack={() => goto(state.preferences.intent ? 'moon' : 'intent')}
          />
        )}
      </div>
    </div>
  );
}

function MoonFirstStep({ onNext }: { onNext: () => void }) {
  const todayIso = toISODate(new Date());
  const { illum, waxing, phaseName, tithi } = useLunarDay(todayIso, null);
  const desc = describeTithi(tithi.index);

  return (
    <div className="flex-1 flex flex-col">
      <p className="text-soma-mist text-xs tracking-widest uppercase">
        Tonight's sky
      </p>
      <h1 className="display-serif text-3xl text-soma-glow mt-1">
        {phaseNameToLabel(phaseName)}
      </h1>
      <p className="text-soma-mist text-xs mt-1">
        {Math.round(illum * 100)}% illuminated · {waxing ? 'waxing' : 'waning'}
      </p>

      <div className="flex justify-center my-8">
        <MoonPhase
          illumination={illum}
          waxing={waxing}
          size={200}
          tithiIndex={tithi.index}
        />
      </div>

      <p className="text-soma-moon text-lg leading-relaxed" style={{ textWrap: 'balance' }}>
        {desc.landmark} — {desc.practice}.
      </p>
      <p className="text-soma-mist text-sm mt-3 leading-relaxed">
        This is Soma. It follows the moon above you — and, if you like, so can
        your body. Two quick questions and you're in.
      </p>

      <div className="mt-auto pt-6">
        <button className="soma-btn-primary w-full" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8" aria-label="Onboarding progress">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            i <= current ? 'bg-soma-glow' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

function SafetyStep({
  flags, setFlags, verdict, onFinish, onBack,
}: {
  flags: SafetyFlags;
  setFlags: (v: SafetyFlags) => void;
  verdict: ReturnType<typeof evaluateSafety>;
  onFinish: () => void;
  onBack: () => void;
}) {
  const toggle = (key: keyof SafetyFlags) =>
    setFlags({ ...flags, [key]: !flags[key] });

  const items: Array<{ key: keyof SafetyFlags; label: string }> = [
    { key: 'under18', label: 'I am under 18 years old' },
    { key: 'pregnant', label: 'I am pregnant or breastfeeding' },
    {
      key: 'eatingDisorderHistory',
      label: 'I have a history of disordered eating',
    },
    { key: 'diabetes', label: 'I have diabetes (type 1 or type 2)' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="display-serif text-3xl text-soma-glow">A few safety checks</h2>
      <p className="text-soma-mist text-sm mt-2">
        Fasting isn't for everyone. Please answer honestly.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {items.map((it) => {
          const on = flags[it.key];
          return (
            <button
              key={it.key}
              onClick={() => toggle(it.key)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                on ? 'border-soma-crimson/60 bg-soma-crimson/10' : 'border-white/10'
              }`}
              aria-pressed={on}
            >
              <span className="text-soma-moon text-sm text-left pr-3">{it.label}</span>
              <span
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  on ? 'bg-soma-crimson' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    on ? 'left-[calc(100%-22px)]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>

      {!verdict.allowed && (
        <div className="mt-5 soma-card p-4 border-soma-crimson/40 bg-soma-crimson/5">
          <div className="text-soma-crimson text-xs font-semibold uppercase tracking-wider">
            Soma cannot support this right now
          </div>
          <p className="text-soma-moon text-sm mt-2 leading-relaxed">
            {verdict.reason}
          </p>
        </div>
      )}

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>Back</button>
        <button
          className="soma-btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onFinish}
          disabled={!verdict.allowed}
        >
          Enter Soma
        </button>
      </div>
    </div>
  );
}
