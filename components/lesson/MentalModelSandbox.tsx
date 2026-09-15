'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MentalModel } from '@/types/curriculum';

interface Props {
  data: MentalModel;
  /** Fires once the learner has moved every piece at least once. */
  onMapped?: () => void;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  moved: boolean;
  /** Set when the piece is sitting inside its target zone. */
  landed: boolean;
}

/**
 * A thinking space, not a test. The learner drags the parts of the idea
 * around until the arrangement matches the picture in their head. Pieces
 * with a target zone light up when they land somewhere sensible, but
 * nothing is ever marked wrong and nothing blocks progress.
 */
export default function MentalModelSandbox({ data, onMapped }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const announced = useRef(false);
  const reduceMotion = useReducedMotion();

  // Pieces are authored in 0–1 space so the canvas can be any size.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (box.w === 0) return;
    setPlaced((prev) =>
      data.pieces.map((p) => {
        const existing = prev.find((q) => q.id === p.id);
        if (existing?.moved) return existing;
        return {
          id: p.id,
          x: p.origin.x * box.w,
          y: p.origin.y * box.h,
          moved: false,
          landed: false,
        };
      }),
    );
  }, [data.pieces, box]);

  const handleDragEnd = (id: string, dx: number, dy: number) => {
    setPlaced((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;

        const x = Math.max(0, Math.min(box.w - 96, p.x + dx));
        const y = Math.max(0, Math.min(box.h - 64, p.y + dy));

        const spec = data.pieces.find((q) => q.id === id);
        let landed = false;

        if (spec?.target && box.w > 0) {
          const tx = spec.target.x * box.w;
          const ty = spec.target.y * box.h;
          const dist = Math.hypot(x + 48 - tx, y + 32 - ty);
          landed = dist <= spec.target.radius * box.w;
          setHint(landed ? spec.target.hint : null);
        }

        return { ...p, x, y, moved: true, landed };
      });

      if (!announced.current && next.every((p) => p.moved)) {
        announced.current = true;
        onMapped?.();
      }

      return next;
    });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Left: the words */}
      <div className="anime-panel flex flex-col p-6">
        <p className="font-mono text-[10px] font-bold tracking-widest text-[var(--ink-muted)]">
          PICTURE IT FIRST
        </p>

        <p className="mt-4 font-[family-name:var(--font-display)] text-xl italic uppercase leading-tight tracking-tight">
          {data.premise}
        </p>

        <p className="mt-5 text-sm leading-relaxed text-[var(--ink-muted)]">
          {data.analogy}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {data.keywords.map((word) => (
            <li
              key={word}
              className="border-2 border-[var(--line)] px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider"
            >
              {word}
            </li>
          ))}
        </ul>

        {data.imageUrl && (
          // Plain img: these are illustrative assets of unknown origin, and
          // next/image would need each host allow-listed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt=""
            className="mt-6 w-full border-2 border-[var(--line)]"
          />
        )}
      </div>

      {/* Right: the canvas */}
      <div className="anime-panel flex flex-col p-4">
        <p className="px-2 pb-3 font-mono text-[10px] font-bold tracking-widest text-[var(--ink-muted)]">
          {data.canvasCaption ?? 'DRAG THE PIECES INTO A SHAPE THAT MAKES SENSE'}
        </p>

        <div
          ref={canvasRef}
          className="relative min-h-[320px] flex-1 overflow-hidden border-2 border-dashed border-[var(--line)] bg-[var(--surface-alt)]"
        >
          {/* Target zones sit behind the pieces as faint wells. */}
          {box.w > 0 &&
            data.pieces
              .filter((p) => p.target)
              .map((p) => (
                <div
                  key={`t-${p.id}`}
                  aria-hidden
                  className="absolute rounded-full border-2 border-dashed border-[var(--line)] opacity-40"
                  style={{
                    width: p.target!.radius * box.w * 2,
                    height: p.target!.radius * box.w * 2,
                    left: p.target!.x * box.w - p.target!.radius * box.w,
                    top: p.target!.y * box.h - p.target!.radius * box.w,
                  }}
                />
              ))}

          {placed.map((p) => {
            const spec = data.pieces.find((q) => q.id === p.id);
            if (!spec) return null;

            return (
              <motion.div
                key={p.id}
                drag
                dragMomentum={false}
                dragElastic={0.06}
                onDragEnd={(_, info) =>
                  handleDragEnd(p.id, info.offset.x, info.offset.y)
                }
                whileDrag={reduceMotion ? undefined : { scale: 1.06, zIndex: 20 }}
                animate={{ x: p.x, y: p.y }}
                transition={{ type: 'spring', stiffness: 700, damping: 40 }}
                className="absolute left-0 top-0 w-24 cursor-grab select-none border-2 border-[var(--line)] p-2 text-center active:cursor-grabbing"
                style={{
                  background: p.landed ? 'var(--accent)' : 'var(--surface)',
                  color: p.landed ? 'var(--accent-ink)' : 'var(--ink)',
                  boxShadow: '3px 3px 0 0 var(--line)',
                  willChange: 'transform',
                }}
              >
                {spec.glyph && (
                  <span aria-hidden className="block text-lg leading-none">
                    {spec.glyph}
                  </span>
                )}
                <span className="mt-1 block font-mono text-[10px] font-bold leading-tight">
                  {spec.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <p
          className="min-h-8 px-2 pt-3 text-xs text-[var(--ink-muted)]"
          aria-live="polite"
        >
          {hint ?? 'Move each piece to keep going. There is no wrong layout.'}
        </p>
      </div>
    </section>
  );
}
