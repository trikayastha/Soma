import { useEffect, useRef, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';

interface MeditationProps {
  onExit: () => void;
  durationSeconds?: number;
}

/**
 * 10-minute paired meditation. Uses the Web Audio API to synthesize a soft
 * ambient drone so we don't need to ship audio assets with the beta.
 * A breathing animation paces the user without narration.
 */
export function Meditation({ onExit, durationSeconds = 600 }: MeditationProps) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= durationSeconds) {
          clearInterval(t);
          stopAudio();
          setPlaying(false);
          return durationSeconds;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, durationSeconds]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  function startAudio() {
    if (nodesRef.current) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    audioCtxRef.current = ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 136.1; // "Om" frequency — a traditional anchor
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    nodesRef.current = { osc, gain };
  }

  function stopAudio() {
    const nodes = nodesRef.current;
    const ctx = audioCtxRef.current;
    if (!nodes || !ctx) return;
    try {
      nodes.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      nodes.osc.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore
    }
    nodesRef.current = null;
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }, 600);
  }

  function toggle() {
    if (playing) {
      setPlaying(false);
      stopAudio();
    } else {
      setPlaying(true);
      startAudio();
    }
  }

  const progress = elapsed / durationSeconds;
  const remaining = durationSeconds - elapsed;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 pt-8 pb-8 animate-fade-in">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-soma-accent">
            Paired meditation
          </div>
          <h2 className="display-serif text-3xl text-soma-glow mt-2">Breathe</h2>
          <p className="text-soma-mist text-xs mt-1">
            In for four · hold · out for six
          </p>
        </div>

        <BreathingOrb playing={playing} progress={progress} />

        <div className="w-full space-y-3">
          <div className="text-center">
            <div className="display-serif text-4xl text-soma-glow tabular-nums">
              {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-soma-mist mt-1 tracking-wider uppercase">
              {Math.round(progress * 100)}% complete
            </div>
          </div>
          <button className="soma-btn-primary w-full" onClick={toggle}>
            {playing ? 'Pause' : elapsed === 0 ? 'Begin' : 'Resume'}
          </button>
          <button className="soma-btn-ghost w-full" onClick={onExit}>
            Back to fast
          </button>
        </div>
      </div>
    </div>
  );
}

function BreathingOrb({ playing }: { playing: boolean; progress: number }) {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    if (!playing) {
      setPhase('Inhale');
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = ((performance.now() - start) / 1000) % 12;
      if (t < 4) setPhase('Inhale');
      else if (t < 6) setPhase('Hold');
      else setPhase('Exhale');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div
      className="relative flex items-center justify-center aspect-square"
      style={{ width: 'min(58vw, 220px)' }}
    >
      <div
        className={`absolute inset-0 rounded-full bg-soma-glow/10 ${
          playing ? 'animate-breathe-cue' : ''
        }`}
        style={{ filter: 'blur(20px)' }}
      />
      <div
        className={`absolute inset-[12%] rounded-full bg-soma-glow/20 border border-soma-glow/40 ${
          playing ? 'animate-breathe-cue' : ''
        }`}
      />
      <div className="absolute inset-[28%] rounded-full bg-soma-glow/80 shadow-glow" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="display-serif text-soma-ink/80 text-sm tracking-[0.25em] uppercase">
          {playing ? phase : ''}
        </span>
      </div>
    </div>
  );
}
