'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { AssessmentGame } from '@/types/curriculum';

interface Props {
  data: AssessmentGame;
  /** Fires the first time the learner clears the challenge. */
  onCleared?: () => void;
}

export default function GamifiedAssessment({ data, onCleared }: Props) {
  const [cleared, setCleared] = useState(false);

  const clear = () => {
    if (cleared) return;
    setCleared(true);
    onCleared?.();
  };

  return (
    <section className="anime-panel relative overflow-hidden p-6">
      <p className="font-mono text-[10px] font-bold tracking-widest text-[var(--ink-muted)]">
        FINAL CHALLENGE
      </p>
      <p className="mt-3 text-base leading-relaxed">{data.question}</p>

      <div className="mt-6">
        {data.kind === 'match' && <MatchGame data={data} onClear={clear} />}
        {data.kind === 'order' && <OrderGame data={data} onClear={clear} />}
        {data.kind === 'predict' && <PredictGame data={data} onClear={clear} />}
      </div>

      <AnimatePresence>
        {cleared && <Burst message={data.successMessage} />}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function MatchGame({
  data,
  onClear,
}: {
  data: AssessmentGame;
  onClear: () => void;
}) {
  const pairs = data.pairs ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  const shuffled = useMemo(
    () => [...pairs].sort((a, b) => a.definition.localeCompare(b.definition)),
    [pairs],
  );

  const choose = (defId: string) => {
    if (!picked) return;
    if (picked === defId) {
      const next = new Set(solved).add(defId);
      setSolved(next);
      setPicked(null);
      setWrong(null);
      if (next.size === pairs.length) onClear();
    } else {
      setWrong(defId);
      setPicked(null);
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <ul className="grid content-start gap-2">
        {pairs.map((p) => {
          const done = solved.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={done}
                onClick={() => setPicked(p.id)}
                className="w-full border-2 border-[var(--line)] p-3 text-left text-sm font-bold disabled:opacity-40"
                style={{
                  background:
                    picked === p.id ? 'var(--accent)' : 'var(--surface-alt)',
                  color: picked === p.id ? 'var(--accent-ink)' : 'var(--ink)',
                }}
              >
                {p.term}
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="grid content-start gap-2">
        {shuffled.map((p) => {
          const done = solved.has(p.id);
          return (
            <li key={p.id}>
              <motion.button
                type="button"
                disabled={done}
                onClick={() => choose(p.id)}
                animate={wrong === p.id ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full border-2 border-[var(--line)] p-3 text-left text-sm"
                style={{
                  background: done ? 'var(--accent)' : 'var(--surface)',
                  color: done ? 'var(--accent-ink)' : 'var(--ink)',
                }}
              >
                {p.definition}
              </motion.button>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-[var(--ink-muted)] sm:col-span-2">
        Pick a term on the left, then the description it belongs to.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OrderGame({
  data,
  onClear,
}: {
  data: AssessmentGame;
  onClear: () => void;
}) {
  const steps = data.steps ?? [];
  const [order, setOrder] = useState(() =>
    [...steps].sort((a, b) => a.label.localeCompare(b.label)),
  );
  const [checked, setChecked] = useState(false);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    if (order.every((s, i) => s.position === i)) onClear();
  };

  return (
    <div className="grid gap-3">
      <ol className="grid gap-2">
        {order.map((s, i) => {
          const right = checked && s.position === i;
          const off = checked && s.position !== i;
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 border-2 p-3"
              style={{
                borderColor: off ? 'var(--warn)' : 'var(--line)',
                background: right ? 'var(--accent)' : 'var(--surface-alt)',
                color: right ? 'var(--accent-ink)' : 'var(--ink)',
              }}
            >
              <span className="font-mono text-xs font-bold">{i + 1}</span>
              <span className="flex-1 text-sm">{s.label}</span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                aria-label="Move up"
                className="border-2 border-current px-2 text-xs"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                aria-label="Move down"
                className="border-2 border-current px-2 text-xs"
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={check}
        className="anime-chip justify-self-start px-5 py-2.5 font-mono text-xs font-bold tracking-widest"
      >
        CHECK ORDER
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PredictGame({
  data,
  onClear,
}: {
  data: AssessmentGame;
  onClear: () => void;
}) {
  const options = data.options ?? [];
  const [choice, setChoice] = useState<string | null>(null);

  const pick = (id: string) => {
    setChoice(id);
    if (options.find((o) => o.id === id)?.correct) onClear();
  };

  const chosen = options.find((o) => o.id === choice);

  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const isChoice = choice === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => pick(o.id)}
            className="border-2 border-[var(--line)] p-3 text-left text-sm"
            style={{
              background:
                isChoice && o.correct
                  ? 'var(--accent)'
                  : 'var(--surface-alt)',
              color: isChoice && o.correct ? 'var(--accent-ink)' : 'var(--ink)',
              borderColor:
                isChoice && !o.correct ? 'var(--warn)' : 'var(--line)',
            }}
          >
            {o.label}
          </button>
        );
      })}

      {chosen && (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{chosen.feedback}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Anime-style radial burst. Twelve shards, one spring, then it's gone. */
function Burst({ message }: { message: string }) {
  const reduceMotion = useReducedMotion();
  const shards = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {!reduceMotion &&
        shards.map((angle, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-8"
            style={{ background: 'var(--accent)' }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: (angle * 180) / Math.PI }}
            animate={{
              x: Math.cos(angle) * 190,
              y: Math.sin(angle) * 130,
              opacity: 0,
            }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
        ))}

      <motion.p
        initial={reduceMotion ? false : { scale: 0.6, rotate: -4 }}
        animate={{ scale: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        className="anime-chip px-6 py-3 text-center font-[family-name:var(--font-display)] text-lg italic uppercase"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
