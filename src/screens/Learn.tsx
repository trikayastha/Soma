import { AmbientBackground } from '../components/AmbientBackground';

const ARTICLES = [
  {
    kind: 'Tradition',
    title: 'Why the moon became the calendar',
    body: 'For most of human history, the moon was the only reliable long-interval clock. Ekadashi and Purnima built rhythm into lives without wristwatches — rhythm is the point, not the moon itself.',
  },
  {
    kind: 'Science',
    title: 'Full moon and sleep — Cajochen 2013',
    body: 'A 2013 study in Current Biology found measurable reductions in sleep efficiency and melatonin around the full moon, independent of light exposure. A rare case of traditional observation matching instrumented evidence.',
  },
  {
    kind: 'Practice',
    title: 'The "weak moon" reframe',
    body: "Newa Buddhist teaching suggests that on certain lunar phases the mind is more reactive — not weaker in a mystical sense, but more in need of support. Fasting + meditation on those days is protective, not punishing.",
  },
  {
    kind: 'Caution',
    title: 'Soma is wellness, not medicine',
    body: 'We share practices and observations. We do not make medical claims. If a fast feels wrong for your body, end it. Talk to a physician before changing your relationship with food.',
  },
];

export function Learn() {
  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">Learn</h1>
          <p className="text-soma-mist text-xs mt-1">Short, honest, optional.</p>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-6 pb-8 space-y-3">
          {ARTICLES.map((a) => (
            <article key={a.title} className="soma-card p-4">
              <div className="text-[10px] uppercase tracking-wider text-soma-accent">
                {a.kind}
              </div>
              <h2 className="text-soma-moon text-sm font-medium mt-1">{a.title}</h2>
              <p className="text-soma-mist text-xs leading-relaxed mt-2">{a.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
