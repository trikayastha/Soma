import { useMemo, useState } from 'react';
import { MoonPhase } from '../components/MoonPhase';
import { AmbientBackground } from '../components/AmbientBackground';
import { evaluateSafety, emptySafetyFlags } from '../lib/safety';
import { generateSchedule } from '../lib/lunar';
import {
  defaultRemindersPrefs,
  type Intensity,
  type Location,
  type SafetyFlags,
  type UserProfile,
} from '../lib/types';
import { useAppState } from '../state/AppStateContext';
import { IntentRouter } from './onboarding/IntentRouter';
import { LocationStep } from './onboarding/LocationStep';

// Intent step inserted ahead of welcome (S1). Location step inserted
// after `you` (S2). Unwinding in reverse is handled by `back()` so flow
// remains symmetrical.
const STEPS = [
  'intent',
  'welcome',
  'you',
  'location',
  'experience',
  'safety',
  'intensity',
] as const;
type Step = (typeof STEPS)[number];

export function Onboarding() {
  const { state, setProfile, setSchedule, completeOnboarding } = useAppState();
  // If the user has already chosen an intent (e.g. resumable session), skip
  // straight to the existing welcome step. Resuming preserves their pick.
  const initialStep: Step = state.preferences.intent ? 'welcome' : 'intent';
  const [step, setStep] = useState<Step>(initialStep);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['goal']>('focus');
  const [experience, setExperience] = useState<UserProfile['experience']>('some');
  const [intensity, setIntensity] = useState<Intensity>('16h');
  const [safety, setSafety] = useState<SafetyFlags>(emptySafetyFlags());
  const [location, setLocation] = useState<Location | null>(null);

  const verdict = useMemo(() => evaluateSafety(safety), [safety]);
  const idx = STEPS.indexOf(step);

  function next() {
    const nextIdx = idx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  }
  function back() {
    const prevIdx = idx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
  }

  function finish() {
    if (!verdict.allowed) return;
    const profile: UserProfile = {
      name: name.trim() || 'Seeker',
      timezone:
        location?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      experience,
      goal,
      defaultIntensity: intensity,
      onboardedAt: new Date().toISOString(),
      safetyFlags: safety,
      reminders: defaultRemindersPrefs(),
      location,
    };
    const schedule = generateSchedule(new Date(), 60, intensity, location);
    setProfile(profile);
    setSchedule(schedule);
    completeOnboarding();
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col px-7 pt-10 pb-8 animate-fade-in">
        <Progress current={idx} total={STEPS.length} />

        {step === 'intent' && (
          <IntentRouter onSelected={next} />
        )}
        {step === 'welcome' && (
          <WelcomeStep onNext={next} />
        )}
        {step === 'you' && (
          <YouStep
            name={name}
            setName={setName}
            goal={goal}
            setGoal={setGoal}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 'location' && (
          <LocationStep
            value={location}
            onChange={setLocation}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 'experience' && (
          <ExperienceStep
            value={experience}
            onChange={setExperience}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 'safety' && (
          <SafetyStep
            flags={safety}
            setFlags={setSafety}
            verdict={verdict}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 'intensity' && (
          <IntensityStep
            value={intensity}
            onChange={setIntensity}
            experience={experience}
            onBack={back}
            onFinish={finish}
            canFinish={verdict.allowed}
          />
        )}
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

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-between text-center">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <MoonPhase illumination={0.72} waxing size={180} />
        <div>
          <h1 className="display-serif text-4xl leading-tight text-soma-glow">
            Moon for Mental Performance
          </h1>
          <p
            className="mt-4 text-soma-mist text-sm leading-relaxed max-w-[90%]"
            style={{ textWrap: 'balance' }}
          >
            A thousand-year-old lunar practice, translated for the modern mind.
            Fast with the moon. Think with clarity.
          </p>
        </div>
      </div>
      <button className="soma-btn-primary w-full" onClick={onNext}>
        Begin
      </button>
    </div>
  );
}

interface YouStepProps {
  name: string;
  setName: (v: string) => void;
  goal: UserProfile['goal'];
  setGoal: (v: UserProfile['goal']) => void;
  onNext: () => void;
  onBack: () => void;
}
function YouStep({ name, setName, goal, setGoal, onNext, onBack }: YouStepProps) {
  const goals: Array<{ id: UserProfile['goal']; label: string; sub: string }> = [
    { id: 'focus', label: 'Sharper focus', sub: 'Cognitive performance, deep work' },
    { id: 'calm', label: 'More calm', sub: 'Stress reactivity, sleep' },
    { id: 'discipline', label: 'Ritual & discipline', sub: 'Meaningful self-care rhythm' },
    { id: 'metabolic', label: 'Metabolic health', sub: "IF benefits, don't lose the plot" },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="display-serif text-3xl text-soma-glow">Tell us who you are</h2>
      <p className="text-soma-mist text-sm mt-2">We'll keep it simple.</p>

      <label className="mt-8 text-xs text-soma-mist uppercase tracking-wider">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What should we call you?"
        autoComplete="given-name"
        className="mt-2 bg-transparent border-b border-white/20 text-soma-moon py-2 text-lg outline-none focus:border-soma-glow focus-visible:outline-none"
      />

      <p className="mt-8 text-xs text-soma-mist uppercase tracking-wider">What matters most?</p>
      <div className="mt-3 flex flex-col gap-2">
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`soma-card text-left px-4 py-3 transition-colors ${
              goal === g.id ? 'border-soma-glow/60 bg-soma-glow/5' : ''
            }`}
          >
            <div className="text-soma-moon text-sm font-medium">{g.label}</div>
            <div className="text-soma-mist text-xs">{g.sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>Back</button>
        <button className="soma-btn-primary flex-1" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

function ExperienceStep({
  value, onChange, onNext, onBack,
}: {
  value: UserProfile['experience'];
  onChange: (v: UserProfile['experience']) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const opts: Array<{ id: UserProfile['experience']; label: string; sub: string }> = [
    { id: 'none', label: 'New to fasting', sub: 'Start gently — 12 hours' },
    { id: 'some', label: 'Some IF experience', sub: "I've tried 16:8" },
    { id: 'experienced', label: 'Experienced', sub: '24h fasts are familiar' },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="display-serif text-3xl text-soma-glow">Your experience</h2>
      <p className="text-soma-mist text-sm mt-2">
        Be honest. We'll tune intensity to match.
      </p>
      <div className="mt-8 flex flex-col gap-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`soma-card text-left px-4 py-4 transition-colors ${
              value === o.id ? 'border-soma-glow/60 bg-soma-glow/5' : ''
            }`}
          >
            <div className="text-soma-moon text-sm font-medium">{o.label}</div>
            <div className="text-soma-mist text-xs">{o.sub}</div>
          </button>
        ))}
      </div>
      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>Back</button>
        <button className="soma-btn-primary flex-1" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

function SafetyStep({
  flags, setFlags, verdict, onNext, onBack,
}: {
  flags: SafetyFlags;
  setFlags: (v: SafetyFlags) => void;
  verdict: ReturnType<typeof evaluateSafety>;
  onNext: () => void;
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
          onClick={onNext}
          disabled={!verdict.allowed}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function IntensityStep({
  value, onChange, experience, onBack, onFinish, canFinish,
}: {
  value: Intensity;
  onChange: (v: Intensity) => void;
  experience: UserProfile['experience'];
  onBack: () => void;
  onFinish: () => void;
  canFinish: boolean;
}) {
  const recs: Record<UserProfile['experience'], Intensity> = {
    none: '12h',
    some: '16h',
    experienced: '24h',
  };
  const recommended = recs[experience];
  const opts: Array<{ id: Intensity; label: string; sub: string }> = [
    { id: '12h', label: '12 hours', sub: 'Overnight — gentle start' },
    { id: '16h', label: '16 hours', sub: 'Classic 16:8 — steady' },
    { id: '24h', label: '24 hours', sub: 'Sunset to sunset — traditional' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="display-serif text-3xl text-soma-glow">Pick your intensity</h2>
      <p
        className="text-soma-mist text-sm mt-2"
        style={{ textWrap: 'balance' }}
      >
        You can change this any time. Suggested for you:{' '}
        <span className="text-soma-glow">{recommended}</span>
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`soma-card text-left px-4 py-4 transition-colors ${
              value === o.id ? 'border-soma-glow/60 bg-soma-glow/5' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-soma-moon text-sm font-medium">{o.label}</div>
                <div className="text-soma-mist text-xs">{o.sub}</div>
              </div>
              {recommended === o.id && (
                <span className="text-[10px] uppercase tracking-wider text-soma-accent">
                  Suggested
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>Back</button>
        <button
          className="soma-btn-primary flex-1 disabled:opacity-40"
          onClick={onFinish}
          disabled={!canFinish}
        >
          Enter Soma
        </button>
      </div>
    </div>
  );
}
