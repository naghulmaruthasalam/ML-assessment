'use client';

import { forwardRef } from 'react';

/**
 * Character sprite.
 *
 * Deliberately a plain div per pose so real artwork can be dropped in with no
 * other changes: replace the contents of each branch with an <img>, an
 * inline SVG, or a sprite-sheet frame. Keep the wrapper's dimensions — the
 * animation timeline positions against them.
 *
 * Nothing here animates layout. The parent moves the whole sprite with
 * transforms only.
 */

export type CharacterPose = 'idle' | 'grabbing' | 'pulling' | 'flying_upside_down';

export const CHARACTER_W = 72;
export const CHARACTER_H = 88;

interface Props {
  pose: CharacterPose;
}

const CharacterSprite = forwardRef<HTMLDivElement, Props>(function CharacterSprite(
  { pose },
  ref,
) {
  return (
    <div
      ref={ref}
      data-pose={pose}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: CHARACTER_W,
        height: CHARACTER_H,
        // Compositor-only. The sequence writes transform; nothing else moves.
        willChange: 'transform',
        transformOrigin: '50% 30%',
      }}
    >
      {/* ---- DROP YOUR ARTWORK IN HERE ------------------------------- *
       * Each branch is one pose. Swap the placeholder markup for an
       * <img src={...} /> or inline SVG of the same box size.
       * ------------------------------------------------------------- */}

      {pose === 'idle' && <Placeholder label="IDLE" arms="down" />}
      {pose === 'grabbing' && <Placeholder label="GRAB" arms="up" />}
      {pose === 'pulling' && <Placeholder label="PULL" arms="up" strain />}
      {pose === 'flying_upside_down' && <Placeholder label="OOF" arms="wild" />}
    </div>
  );
});

export default CharacterSprite;

/* ------------------------------------------------------------------ *
 * Placeholder art — comic-book flat fills, hard outlines, no gradients.
 * ------------------------------------------------------------------ */

function Placeholder({
  label,
  arms,
  strain = false,
}: {
  label: string;
  arms: 'down' | 'up' | 'wild';
  strain?: boolean;
}) {
  return (
    <svg viewBox="0 0 72 88" width={CHARACTER_W} height={CHARACTER_H}>
      {/* Cape / body */}
      <path
        d="M20 34 L52 34 L58 76 L14 76 Z"
        fill="var(--accent)"
        stroke="var(--line)"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* Head */}
      <circle cx={36} cy={22} r={15} fill="var(--surface)" stroke="var(--line)" strokeWidth={3} />

      {/* Eyes — squeezed shut when straining, wide when flying */}
      {strain ? (
        <>
          <path d="M27 20 l7 3" stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />
          <path d="M45 20 l-7 3" stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={30} cy={21} r={2.6} fill="var(--line)" />
          <circle cx={42} cy={21} r={2.6} fill="var(--line)" />
        </>
      )}

      {/* Mouth */}
      {arms === 'wild' ? (
        <ellipse cx={36} cy={29} rx={5} ry={4} fill="var(--line)" />
      ) : (
        <path
          d={strain ? 'M30 29 q6 5 12 0' : 'M31 29 q5 3 10 0'}
          fill="none"
          stroke="var(--line)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* Arms */}
      {arms === 'down' && (
        <>
          <path d="M20 40 L8 58" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
          <path d="M52 40 L64 58" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
        </>
      )}
      {arms === 'up' && (
        <>
          <path d="M22 38 L30 8" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
          <path d="M50 38 L42 8" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
        </>
      )}
      {arms === 'wild' && (
        <>
          <path d="M20 40 L2 30" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
          <path d="M52 40 L70 30" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
        </>
      )}

      {/* Legs */}
      <path d="M28 76 L24 88" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />
      <path d="M44 76 L48 88" stroke="var(--line)" strokeWidth={6} strokeLinecap="round" />

      <text
        x={36}
        y={62}
        textAnchor="middle"
        fill="var(--accent-ink)"
        style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}
      >
        {label}
      </text>
    </svg>
  );
}
