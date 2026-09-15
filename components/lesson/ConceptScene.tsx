'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { SceneId, SceneBeat } from '@/types/curriculum';
import {
  W,
  H,
  LineFitting,
  GradientDescent,
  LogisticBoundary,
  DecisionTree,
  EnsembleVote,
  KMeans,
  PcaProjection,
  HoldoutFolds,
  Overfitting,
  Perceptron,
  Attention,
  QTable,
} from './scenes';

/**
 * Concept visualizations, drawn rather than filmed.
 *
 * Each scene is a pure function of a 0–1 progress value, so a learner can
 * play it, pause it, or drag through it frame by frame — which video does
 * badly and which matters when the whole point is watching one quantity
 * respond to another.
 *
 * `beats` is what ties this back to the lesson text: captions written in the
 * story's own language, pinned to moments on the timeline. Scrubbing walks
 * the same arc the learner just read.
 */

const SCENES: Record<SceneId, (p: { t: number }) => React.JSX.Element> = {
  'line-fitting': LineFitting,
  'gradient-descent': GradientDescent,
  'logistic-boundary': LogisticBoundary,
  'decision-tree': DecisionTree,
  'ensemble-vote': EnsembleVote,
  kmeans: KMeans,
  'pca-projection': PcaProjection,
  'holdout-folds': HoldoutFolds,
  overfitting: Overfitting,
  perceptron: Perceptron,
  attention: Attention,
  'q-table': QTable,
};

interface Props {
  scene: SceneId;
  caption?: string;
  beats?: SceneBeat[];
  onWatched?: () => void;
}

export default function ConceptScene({ scene, caption, beats, onWatched }: Props) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const fired = useRef(false);
  const reduceMotion = useReducedMotion();

  const Scene = SCENES[scene];

  const ordered = useMemo(
    () => [...(beats ?? [])].sort((a, b) => a.at - b.at),
    [beats],
  );

  // The beat currently in force is the last one whose mark has passed.
  const beatIndex = useMemo(() => {
    let idx = -1;
    ordered.forEach((b, i) => {
      if (t >= b.at) idx = i;
    });
    return idx;
  }, [ordered, t]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt / 9; // a nine-second read-through
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  useEffect(() => {
    if (!fired.current && t > 0.5) {
      fired.current = true;
      onWatched?.();
    }
  }, [t, onWatched]);

  const toggle = () => {
    if (t >= 1) setT(0);
    setPlaying((p) => !p);
  };

  return (
    <figure className="anime-panel overflow-hidden">
      <div className="bg-[var(--surface-alt)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={caption ?? 'Concept visualization'}
        >
          <Scene t={t} />
        </svg>
      </div>

      {/* Beat track — the story, synced to the picture */}
      {ordered.length > 0 && (
        <div className="border-t-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <div className="min-h-12" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={beatIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="text-sm leading-relaxed"
              >
                {beatIndex >= 0
                  ? ordered[beatIndex].text
                  : 'Press play, or drag the slider to step through it yourself.'}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Chapter marks, clickable */}
          <div className="mt-3 flex gap-1.5">
            {ordered.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setT(b.at);
                }}
                aria-label={`Jump to: ${b.text}`}
                className="h-1.5 flex-1 border border-[var(--line)]"
                style={{
                  background: i <= beatIndex ? 'var(--accent)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-t-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="anime-chip flex h-9 w-9 shrink-0 items-center justify-center text-xs"
        >
          {playing ? '❚❚' : t >= 1 ? '↻' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          aria-label="Scrub the animation"
          className="h-1.5 w-full cursor-pointer appearance-none bg-[var(--line)] accent-[var(--accent)]"
        />

        <span className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)]">
          {Math.round(t * 100)}%
        </span>
      </div>

      {caption && (
        <figcaption className="border-t-2 border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
