'use client';

import { motion } from 'framer-motion';
import {
  TRACK_ROWS,
  GRID,
  FINISH,
  START,
  HEADING_DEG,
  isRoad,
  scenery,
} from '@/lib/gameTrack';
import { useGameStore } from '@/stores/useGameStore';

/**
 * The scenic map.
 *
 * The grid itself is static and rendered once. Only the vehicle moves, and
 * it moves by transform — Framer tweens x/y/rotate, so the whole drive is a
 * compositor job with no layout work per step.
 */

const CELL = 44; // px at full size; the wrapper scales down responsively

export default function TrackMap() {
  const x = useGameStore((s) => s.x);
  const y = useGameStore((s) => s.y);
  const heading = useGameStore((s) => s.heading);
  const jumping = useGameStore((s) => s.jumping);
  const status = useGameStore((s) => s.status);

  const size = GRID * CELL;

  return (
    <div className="anime-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2 font-mono text-[10px] font-bold tracking-widest">
        <span>SWITCHBACK PASS</span>
        <span className="ml-auto text-[var(--ink-muted)]">
          {status === 'driving'
            ? 'DRIVING'
            : status === 'crashed'
              ? 'OFF ROAD'
              : status === 'won'
                ? 'FINISHED'
                : `X ${x} · Y ${y} · ${heading}`}
        </span>
      </div>

      <div className="flex justify-center bg-[var(--surface-alt)] p-3">
        <div
          className="relative"
          style={{
            width: size,
            height: size,
            maxWidth: '100%',
            aspectRatio: '1 / 1',
          }}
        >
          {/* Terrain */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              gridTemplateRows: `repeat(${GRID}, 1fr)`,
            }}
          >
            {TRACK_ROWS.map((row, ry) =>
              row.split('').map((_, rx) => (
                <Tile key={`${rx}-${ry}`} x={rx} y={ry} />
              )),
            )}
          </div>

          {/* Vehicle. Positioned in percentage units so it tracks the grid
              at any rendered size. */}
          <motion.div
            className="absolute"
            style={{
              width: `${100 / GRID}%`,
              height: `${100 / GRID}%`,
              left: 0,
              top: 0,
              willChange: 'transform',
            }}
            animate={{
              x: `${x * 100}%`,
              y: `${y * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <motion.div
              className="flex h-full w-full items-center justify-center"
              animate={{
                rotate: HEADING_DEG[heading],
                scale: jumping ? 1.45 : 1,
              }}
              transition={{
                rotate: { type: 'spring', stiffness: 400, damping: 22 },
                scale: { duration: 0.16 },
              }}
              style={{ willChange: 'transform' }}
            >
              <Scooter />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Tile({ x, y }: { x: number; y: number }) {
  const road = isRoad(x, y);
  const finish = x === FINISH.x && y === FINISH.y;
  const start = x === START.x && y === START.y;

  if (finish) {
    return (
      <div className="relative border border-[var(--line)] bg-[var(--accent)]">
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[var(--accent-ink)]">
          ⚑
        </span>
      </div>
    );
  }

  if (road) {
    return (
      <div
        className="border border-[var(--line)]"
        style={{ background: 'var(--surface)' }}
      >
        {start && (
          <span className="flex h-full w-full items-center justify-center font-mono text-[9px] text-[var(--ink-muted)]">
            S
          </span>
        )}
      </div>
    );
  }

  const kind = scenery(x, y);
  return (
    <div
      className="flex items-center justify-center border border-[var(--line)] text-[11px] opacity-70"
      style={{ background: 'var(--surface-alt)' }}
      aria-hidden
    >
      {kind === 'tree' ? '🌲' : kind === 'rock' ? '🪨' : ''}
    </div>
  );
}

/** Top-down scooter. Nose points up, so rotation maps directly to heading. */
function Scooter() {
  return (
    <svg viewBox="0 0 24 24" className="h-[80%] w-[80%]">
      <ellipse cx={12} cy={12} rx={5.5} ry={8} fill="var(--accent)" stroke="var(--line)" strokeWidth={1.6} />
      <rect x={7} y={3} width={10} height={3} rx={1.5} fill="var(--line)" />
      <circle cx={12} cy={9} r={2} fill="var(--surface)" stroke="var(--line)" strokeWidth={1.2} />
      <rect x={9.5} y={17} width={5} height={4} rx={1.4} fill="var(--line)" />
    </svg>
  );
}
