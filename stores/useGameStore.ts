'use client';

import { create } from 'zustand';
import {
  START,
  START_HEADING,
  STEP,
  isRoad,
  isFinish,
  turnLeft,
  turnRight,
  type Heading,
} from '@/lib/gameTrack';

const UNLOCK_KEY = 'gateway-unlocked';

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
  log?: string;
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

  hydrate: () => void;
  setStatus: (s: RunStatus) => void;
  log: (line: string) => void;
  reset: () => void;
  applyFrame: (f: Frame) => void;
  markUnlocked: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  x: START.x,
  y: START.y,
  heading: START_HEADING,
  jumping: false,

  status: 'idle',
  console: [],
  unlocked: false,

  hydrate: () => {
    try {
      set({ unlocked: window.localStorage.getItem(UNLOCK_KEY) === '1' });
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
    }),

  applyFrame: (f) =>
    set({ x: f.x, y: f.y, heading: f.heading, jumping: f.jumping }),

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
      frames.push({ x, y, heading, jumping: false, crash: null });

      if (isFinish(x, y)) return frames;
    }
  }

  return frames;
}

export const frameIsFinish = (f: Frame) => isFinish(f.x, f.y);
