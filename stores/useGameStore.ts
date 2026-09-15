'use client';

import { create } from 'zustand';
import {
  GATES,
  START,
  START_HEADING,
  STEP,
  gateAt,
  isRoad,
  isFinish,
  turnLeft,
  turnRight,
  type Heading,
} from '@/lib/gameTrack';

const UNLOCK_KEY = 'gateway-unlocked';
const BEST_KEY = 'gateway-best-gate';
const DRAFT_KEY = 'gateway-route-src';

const cellKey = (x: number, y: number) => `${x},${y}`;

/**
 * One thing the Python code asked for. The user's program produces a list of
 * these; nothing is animated while it runs.
 */
export type Command =
  | { kind: 'move'; steps: number }
  | { kind: 'turn'; dir: 'left' | 'right' }
  | { kind: 'jump' }
  | { kind: 'say'; text: string };

/** One frame of the replay, already validated against the track. */
export interface Frame {
  x: number;
  y: number;
  heading: Heading;
  jumping: boolean;
  /** Set when this frame is where the run ends badly. */
  crash: 'offroad' | null;
  /** True only for a frame that is an actual step forward — not a turn. */
  moved?: boolean;
  log?: string;
  /** Index into GATES when this frame is the first to reach that hairpin. */
  gate?: number;
}

export type RunStatus =
  | 'idle'
  | 'booting'
  | 'executing'
  | 'driving'
  | 'crashed'
  | 'won';

interface GameState {
  x: number;
  y: number;
  heading: Heading;
  jumping: boolean;

  status: RunStatus;
  console: string[];
  unlocked: boolean;

  /** Road squares touched during the current run, as "x,y". */
  trail: string[];
  /** Hairpins cleared in the current run. */
  gate: number;
  /** Best hairpin count across every attempt, kept between visits. */
  bestGate: number;
  /** The player's own source, restored between visits. Never seeded. */
  draft: string;

  hydrate: () => void;
  setStatus: (s: RunStatus) => void;
  log: (line: string) => void;
  reset: () => void;
  applyFrame: (f: Frame) => void;
  clearGate: (index: number) => void;
  saveDraft: (src: string) => void;
  markUnlocked: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  x: START.x,
  y: START.y,
  heading: START_HEADING,
  jumping: false,

  status: 'idle',
  console: [],
  unlocked: false,

  trail: [cellKey(START.x, START.y)],
  gate: 0,
  bestGate: 0,
  draft: '',

  hydrate: () => {
    try {
      const best = Number(window.localStorage.getItem(BEST_KEY) ?? 0);
      set({
        unlocked: window.localStorage.getItem(UNLOCK_KEY) === '1',
        bestGate: Number.isFinite(best) ? Math.min(best, GATES.length) : 0,
        draft: window.localStorage.getItem(DRAFT_KEY) ?? '',
      });
    } catch {
      // Storage unavailable; the gate simply stays closed for this visit.
    }
  },

  setStatus: (status) => set({ status }),

  log: (line) => set((s) => ({ console: [...s.console, line] })),

  reset: () =>
    set({
      x: START.x,
      y: START.y,
      heading: START_HEADING,
      jumping: false,
      status: 'idle',
      console: [],
      trail: [cellKey(START.x, START.y)],
      gate: 0,
    }),

  applyFrame: (f) =>
    set((s) => {
      const key = cellKey(f.x, f.y);
      return {
        x: f.x,
        y: f.y,
        heading: f.heading,
        jumping: f.jumping,
        // Only road squares earn a tyre track; the crash frame is off-road.
        trail:
          f.crash || s.trail.includes(key) ? s.trail : [...s.trail, key],
      };
    }),

  clearGate: (index) => {
    const reached = index + 1;
    if (reached > get().bestGate) {
      try {
        window.localStorage.setItem(BEST_KEY, String(reached));
      } catch {
        // Non-fatal — the badge just resets on the next visit.
      }
    }
    set((s) => ({
      gate: Math.max(s.gate, reached),
      bestGate: Math.max(s.bestGate, reached),
    }));
  },

  saveDraft: (draft) => {
    try {
      window.localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      // Non-fatal — the source just lives in memory for this visit.
    }
    set({ draft });
  },

  markUnlocked: () => {
    try {
      window.localStorage.setItem(UNLOCK_KEY, '1');
    } catch {
      // Non-fatal — the redirect still happens this session.
    }
    set({ unlocked: true, status: 'won' });
  },
}));

/**
 * Turns a command list into validated frames.
 *
 * Runs entirely before anything animates, which is what lets the player
 * write ordinary synchronous Python — no async/await, no colouring of their
 * functions — and still see the vehicle move one step at a time. It also
 * means a crash is known before the replay starts, so the console and the
 * sprite can never disagree.
 */
export function planRoute(commands: Command[]): Frame[] {
  const frames: Frame[] = [];
  let x = START.x;
  let y = START.y;
  let heading: Heading = START_HEADING;
  const gatesSeen = new Set<number>();

  for (const cmd of commands) {
    if (cmd.kind === 'turn') {
      heading = cmd.dir === 'right' ? turnRight(heading) : turnLeft(heading);
      frames.push({ x, y, heading, jumping: false, crash: null });
      continue;
    }

    if (cmd.kind === 'jump') {
      frames.push({ x, y, heading, jumping: true, crash: null });
      frames.push({ x, y, heading, jumping: false, crash: null });
      continue;
    }

    if (cmd.kind === 'say') {
      frames.push({ x, y, heading, jumping: false, crash: null, log: cmd.text });
      continue;
    }

    // move — one frame per step, so a loop is visible as separate motion
    const steps = Math.max(0, Math.floor(cmd.steps));
    for (let i = 0; i < steps; i++) {
      const nx = x + STEP[heading].x;
      const ny = y + STEP[heading].y;

      if (!isRoad(nx, ny)) {
        frames.push({
          x: nx,
          y: ny,
          heading,
          jumping: false,
          crash: 'offroad',
        });
        return frames; // everything after the crash is unreachable
      }

      x = nx;
      y = ny;

      // A hairpin only counts the first time it is crossed in a run, so
      // driving back and forth over one cannot inflate the progress badge.
      const gate = gateAt(x, y);
      const fresh = gate !== -1 && !gatesSeen.has(gate);
      if (fresh) gatesSeen.add(gate);

      frames.push({
        x,
        y,
        heading,
        jumping: false,
        crash: null,
        moved: true,
        ...(fresh ? { gate } : null),
      });

      if (isFinish(x, y)) return frames;
    }
  }

  return frames;
}

export const frameIsFinish = (f: Frame) => isFinish(f.x, f.y);
