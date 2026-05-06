import { useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import {
  ARCHETYPE_DESCRIPTION,
  ARCHETYPE_LABEL,
  ARCHETYPE_QUESTIONS,
  scoreArchetype,
  type ArchetypeAnswers,
  type ArchetypeQuestionId,
} from '../lib/archetype';
import type { Archetype } from '../lib/types';

interface EnergyArchetypeProps {
  /** Called once the user finishes the quiz with their dominant archetype. */
  onComplete: (archetype: Archetype) => void;
  /** Called when the user dismisses the quiz without finishing. */
  onSkip?: () => void;
  /** Override label on the final CTA — useful in onboarding vs Settings. */
  finishLabel?: string;
  /** When true, hides the explicit "Skip" affordance (e.g. Settings re-take). */
  hideSkip?: boolean;
}

type Stage = 'intro' | 'question' | 'result';

/**
 * 3-question Energy Archetype quiz screen (S4).
 * - Plain-English prompts (no Sanskrit).
 * - Stage flow: intro → 3 questions → result → onComplete(archetype).
 * - Tie-break order resolved deterministically inside `scoreArchetype`.
 */
export function EnergyArchetype({
  onComplete,
  onSkip,
  finishLabel = 'Save my archetype',
  hideSkip = false,
}: EnergyArchetypeProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<ArchetypeAnswers>>({});

  const totalQuestions = ARCHETYPE_QUESTIONS.length;
  const currentQuestion = ARCHETYPE_QUESTIONS[questionIdx];

  const result = useMemo(() => {
    const all = Object.keys(answers).length === totalQuestions;
    if (!all) return null;
    return scoreArchetype(answers as ArchetypeAnswers);
  }, [answers, totalQuestions]);

  function pickOption(qid: ArchetypeQuestionId, optionId: string) {
    const next = { ...answers, [qid]: optionId };
    setAnswers(next);
    if (questionIdx + 1 < totalQuestions) {
      setQuestionIdx(questionIdx + 1);
    } else {
      setStage('result');
    }
  }

  function back() {
    if (stage === 'question' && questionIdx > 0) {
      setQuestionIdx(questionIdx - 1);
    } else if (stage === 'question' && questionIdx === 0) {
      setStage('intro');
    } else if (stage === 'result') {
      setStage('question');
      setQuestionIdx(totalQuestions - 1);
    }
  }

  function startQuiz() {
    setStage('question');
    setQuestionIdx(0);
  }

  function handleFinish() {
    if (!result) return;
    onComplete(result.archetype);
  }

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col px-7 pt-10 pb-8 motion-safe:animate-fade-in">
        {stage === 'intro' && (
          <IntroStep
            onStart={startQuiz}
            onSkip={hideSkip ? undefined : onSkip}
          />
        )}
        {stage === 'question' && currentQuestion && (
          <QuestionStep
            question={currentQuestion}
            current={questionIdx}
            total={totalQuestions}
            selected={answers[currentQuestion.id] ?? null}
            onPick={(opt) => pickOption(currentQuestion.id, opt)}
            onBack={back}
          />
        )}
        {stage === 'result' && result && (
          <ResultStep
            archetype={result.archetype}
            tied={result.tied}
            onBack={back}
            onFinish={handleFinish}
            finishLabel={finishLabel}
          />
        )}
      </div>
    </div>
  );
}

function IntroStep({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="display-serif text-3xl text-soma-glow">Your energy</h1>
      <p
        className="mt-3 text-soma-mist text-sm leading-relaxed"
        style={{ textWrap: 'balance' }}
      >
        Three quick questions. Soma uses your answer to tune copy — never to
        prescribe. You can retake this any time in Settings.
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <button className="soma-btn-primary w-full" onClick={onStart}>
          Begin quiz
        </button>
        {onSkip && (
          <button className="soma-btn-ghost w-full" onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

interface QuestionStepProps {
  question: (typeof ARCHETYPE_QUESTIONS)[number];
  current: number;
  total: number;
  selected: string | null;
  onPick: (optionId: string) => void;
  onBack: () => void;
}

function QuestionStep({
  question,
  current,
  total,
  selected,
  onPick,
  onBack,
}: QuestionStepProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex gap-1.5 mb-6" aria-label="Quiz progress">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
              i <= current ? 'bg-soma-glow' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <h2 className="display-serif text-2xl text-soma-glow leading-tight">
        {question.prompt}
      </h2>

      <div
        className="mt-6 flex flex-col gap-2"
        role="radiogroup"
        aria-label={question.prompt}
      >
        {question.options.map((o) => {
          const on = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(o.id)}
              className={`soma-card text-left px-4 py-3 transition-colors ${
                on ? 'border-soma-glow/60 bg-soma-glow/5' : ''
              }`}
            >
              <div className="text-soma-moon text-sm">{o.label}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

function ResultStep({
  archetype,
  tied,
  onBack,
  onFinish,
  finishLabel,
}: {
  archetype: Archetype;
  tied: boolean;
  onBack: () => void;
  onFinish: () => void;
  finishLabel: string;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="display-serif text-3xl text-soma-glow">
        Your archetype
      </h1>
      <p className="mt-2 text-soma-mist text-sm">
        Based on your three answers.
      </p>

      <div className="mt-8 soma-card p-6 text-center">
        <div className="text-[10px] uppercase tracking-wider text-soma-accent">
          Dominant
        </div>
        <div className="display-serif text-4xl text-soma-glow mt-2">
          {ARCHETYPE_LABEL[archetype]}
        </div>
        <p
          className="mt-3 text-soma-mist text-sm leading-relaxed"
          style={{ textWrap: 'balance' }}
        >
          {ARCHETYPE_DESCRIPTION[archetype]}
        </p>
        {tied && (
          <p className="mt-3 text-[11px] text-soma-mist italic">
            Your answers tied across two energies — Soma resolved this in
            order Wind, Fire, Earth.
          </p>
        )}
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        <button className="soma-btn-ghost flex-1" onClick={onBack}>
          Retake
        </button>
        <button className="soma-btn-primary flex-1" onClick={onFinish}>
          {finishLabel}
        </button>
      </div>
    </div>
  );
}
