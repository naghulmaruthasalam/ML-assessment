'use client';

/**
 * Radial theme ripple.
 *
 * A clip-path can only reveal something that already exists, so there are
 * two honest ways to make a new theme burst outward from a point:
 *
 *   1. View Transitions API — the browser snapshots the old and new frames
 *      for us, so the *real* new UI expands. Best result, Chromium-only today.
 *   2. A veil painted in the incoming theme's canvas colour, expanded over
 *      the screen, with the attribute swapped once it has covered everything.
 *      The swap happens underneath an opaque layer, so it is never visible.
 *
 * Both animate clip-path only, which the compositor handles without layout.
 */

interface RippleOptions {
  x: number;
  y: number;
  /** Applies the theme. Called at the moment the screen is covered. */
  apply: () => void;
  /** Canvas colour of the theme being moved to, for the fallback veil. */
  incomingCanvas: string;
  durationMs?: number;
}

// `Document.startViewTransition` is typed by the DOM lib in current
// TypeScript. Older targets will simply take the fallback branch below.

/** Radius needed to reach the furthest screen corner from (x, y). */
function coverRadius(x: number, y: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

export function rippleTheme({
  x,
  y,
  apply,
  incomingCanvas,
  durationMs = 620,
}: RippleOptions): Promise<void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    apply();
    return Promise.resolve();
  }

  const r = coverRadius(x, y);

  // --- Path 1: real content ripple -----------------------------------
  if (document.startViewTransition) {
    const transition = document.startViewTransition(() => {
      apply();
    });

    return transition.ready
      .then(() =>
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`],
          },
          {
            duration: durationMs,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        ).finished,
      )
      .then(() => undefined)
      .catch(() => {
        // If the transition is interrupted, make sure the theme still lands.
        apply();
      });
  }

  // --- Path 2: veil wipe ---------------------------------------------
  return new Promise((resolve) => {
    const veil = document.createElement('div');
    veil.setAttribute('aria-hidden', 'true');
    Object.assign(veil.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '90',
      pointerEvents: 'none',
      background: incomingCanvas,
      clipPath: `circle(0px at ${x}px ${y}px)`,
      willChange: 'clip-path',
    } satisfies Partial<CSSStyleDeclaration>);

    document.body.appendChild(veil);

    const grow = veil.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`],
      },
      { duration: durationMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );

    grow.finished
      .then(() => {
        // Screen is fully covered — swap underneath, then fade the veil off.
        apply();
        return veil.animate({ opacity: [1, 0] }, { duration: 180, fill: 'forwards' })
          .finished;
      })
      .catch(() => apply())
      .finally(() => {
        veil.remove();
        resolve();
      });
  });
}
