'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimate, useReducedMotion } from 'framer-motion';
import CharacterSprite, {
  CHARACTER_W,
  type CharacterPose,
} from './CharacterSprite';
import { useThemeStore } from '@/stores/useThemeStore';
import { rippleTheme } from '@/lib/rippleTheme';
import {
  THEME_CAPSULE,
  THEME_LABEL,
  nextTheme,
  type Theme,
} from '@/lib/themes';

/**
 * Theme pull cord.
 *
 * One click runs a five-phase sequence, driven by `useAnimate` rather than
 * chained timeouts — each phase awaits the previous one, so the timeline
 * cannot drift and an interrupted run cannot leave the character stranded
 * mid-air.
 *
 *   1. POP     character appears beside the knob
 *   2. GRAB    reaches out, takes hold, squashes on contact
 *   3. PULL    hauls the cord down on a heavy spring
 *   4. RIPPLE  at the lowest point, the theme bursts outward from the knob
 *   5. LAUNCH  impact frame, then shot off the top of the screen
 *
 * Everything moves via transform and opacity. Nothing animates width,
 * height, top or left, so the whole sequence stays on the compositor.
 */

type Phase = 'idle' | 'pop' | 'grab' | 'pull' | 'ripple' | 'launch';

/** Canvas colour per theme, needed by the ripple veil before the swap. */
const CANVAS: Record<Theme, string> = {
  'cyber-mecha': '#06080f',
  'sunny-beach': '#fff6e2',
  'batman-noir': '#050505',
};

const PULL_DISTANCE = 96;

export default function ThemePullCord() {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const knobRef = useRef<HTMLButtonElement>(null);
  const running = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [pose, setPose] = useState<CharacterPose>('idle');

  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const hydrate = useThemeStore((s) => s.hydrate);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const pull = useCallback(async () => {
    if (running.current) return;
    running.current = true;

    const upcoming = nextTheme(theme);

    // Reduced motion: skip the theatrics, keep the outcome.
    if (reduceMotion) {
      cycleTheme();
      running.current = false;
      return;
    }

    try {
      /* -- 1. POP ---------------------------------------------------- */
      setPhase('pop');
      setPose('idle');
      await animate(
        '[data-character]',
        { opacity: [0, 1], scale: [0.4, 1.12, 1], x: [26, 6, 0] },
        { duration: 0.22, ease: [0.34, 1.56, 0.64, 1] },
      );

      /* -- 2. GRAB --------------------------------------------------- */
      setPhase('grab');
      setPose('grabbing');
      await animate(
        '[data-character]',
        { x: [0, -10], scaleX: [1, 1.14, 1], scaleY: [1, 0.88, 1] },
        { duration: 0.18, ease: 'easeOut' },
      );

      /* -- 3. PULL --------------------------------------------------- *
       * Heavy spring on both the cord and the character, so they travel
       * together as if the character's weight is what moves the knob.   */
      setPhase('pull');
      setPose('pulling');
      await Promise.all([
        animate(
          '[data-cord]',
          { scaleY: 1 + PULL_DISTANCE / 56 },
          { type: 'spring', stiffness: 400, damping: 25 },
        ),
        animate(
          '[data-knob]',
          { y: PULL_DISTANCE },
          { type: 'spring', stiffness: 400, damping: 25 },
        ),
        animate(
          '[data-character]',
          { y: PULL_DISTANCE, x: -10, rotate: -6 },
          { type: 'spring', stiffness: 400, damping: 25 },
        ),
      ]);

      /* -- 4. RIPPLE ------------------------------------------------- *
       * Fire from the knob's real position at its lowest point.         */
      setPhase('ripple');
      const box = knobRef.current?.getBoundingClientRect();
      const ox = box ? box.left + box.width / 2 : window.innerWidth - 40;
      const oy = box ? box.top + box.height / 2 : 60;

      await rippleTheme({
        x: ox,
        y: oy,
        apply: cycleTheme,
        incomingCanvas: CANVAS[upcoming],
      });

      /* -- 5. LAUNCH ------------------------------------------------- *
       * Impact frame first: a hard vertical stretch, held for two frames,
       * reads as the hit landing. Then off the top.                     */
      setPhase('launch');
      setPose('flying_upside_down');

      await animate(
        '[data-character]',
        { scaleX: [1, 0.62], scaleY: [1, 1.5], y: PULL_DISTANCE - 14 },
        { duration: 0.07, ease: 'easeIn' },
      );

      // The cord snaps back the instant the weight leaves it.
      animate('[data-cord]', { scaleY: 1 }, { type: 'spring', stiffness: 700, damping: 14 });
      animate('[data-knob]', { y: 0 }, { type: 'spring', stiffness: 700, damping: 14 });

      await animate(
        '[data-character]',
        {
          y: -1000,
          x: [-10, 34],
          rotateZ: 720,
          scaleX: 1,
          scaleY: 1,
          opacity: [1, 1, 0],
        },
        { duration: 0.72, ease: [0.3, 0, 0.9, 0.4] },
      );
    } finally {
      // Whatever happened, park the character offstage and reset the rig.
      await animate(
        '[data-character]',
        { opacity: 0, y: 0, x: 0, rotateZ: 0, scaleX: 1, scaleY: 1 },
        { duration: 0 },
      );
      setPose('idle');
      setPhase('idle');
      running.current = false;
    }
  }, [animate, cycleTheme, reduceMotion, theme]);

  return (
    <div
      ref={scope}
      className="fixed right-4 top-0 z-50 flex flex-col items-center sm:right-8"
    >
      {/* Ceiling mount */}
      <div className="h-3 w-14 border-x-2 border-b-2 border-[var(--line)] bg-[var(--surface-alt)]" />

      {/* Cord. Scales from its top edge so it reads as stretching, and
          scaleY is a transform — no height animation. */}
      <div
        data-cord
        aria-hidden
        className="w-[3px] bg-[var(--line)]"
        style={{ height: 56, transformOrigin: 'top center', willChange: 'transform' }}
      />

      {/* Knob */}
      <button
        ref={knobRef}
        data-knob
        type="button"
        onClick={pull}
        disabled={phase !== 'idle'}
        aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[nextTheme(theme)]}.`}
        className="anime-chip flex h-9 w-9 items-center justify-center rounded-full text-base disabled:cursor-wait"
        style={{ willChange: 'transform' }}
      >
        💡
      </button>

      {/* Character. Absolutely placed so it never affects the rig's layout. */}
      <div
        data-character
        className="pointer-events-none absolute"
        style={{
          top: 44,
          right: 38 + CHARACTER_W,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        <CharacterSprite pose={pose} />
      </div>

      {/* Mascot capsule */}
      <span className="anime-chip mt-3 select-none px-3 py-1 text-[11px] font-black tracking-widest">
        {THEME_CAPSULE[theme]}
      </span>
    </div>
  );
}
