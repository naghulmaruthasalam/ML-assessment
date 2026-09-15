'use client';

import { getPyodide } from '@/lib/pyodide';
import type { Command } from '@/stores/useGameStore';

/**
 * The Monaco → Pyodide → Framer Motion bridge.
 *
 * The design decision worth flagging: the injected commands *record* rather
 * than animate. A `for i in range(3): jump()` runs to completion in
 * milliseconds, appending three entries to a JS array; only afterwards does
 * the replay walk that array one frame at a time.
 *
 * The alternative — awaiting an animation inside each call — forces the
 * player's own functions to become `async`, so `for i in range(3): jump()`
 * would silently do nothing and they would have to write `await jump()`.
 * That is a Python lesson nobody asked for, on the landing page, before
 * they have learned anything. Recording keeps their code ordinary.
 *
 * The visible result is identical: the vehicle still moves step by step.
 */

export interface RunResult {
  commands: Command[];
  /** Anything the program printed, in order. */
  output: string[];
  /** Present when the Python raised. Already formatted as a traceback. */
  error: string | null;
}

/** Guard against a runaway loop locking the tab. */
const MAX_COMMANDS = 500;

export async function runPlayerCode(source: string): Promise<RunResult> {
  const commands: Command[] = [];
  const output: string[] = [];

  const py = await getPyodide();

  const guard = () => {
    if (commands.length >= MAX_COMMANDS) {
      throw new Error(
        `Too many commands (over ${MAX_COMMANDS}). Check for a loop that never ends.`,
      );
    }
  };

  // --- the JS side of the bridge ------------------------------------
  const bridge = {
    move(steps: number) {
      guard();
      commands.push({ kind: 'move', steps: Number(steps) || 0 });
    },
    turn(dir: string) {
      guard();
      commands.push({ kind: 'turn', dir: dir === 'left' ? 'left' : 'right' });
    },
    jump() {
      guard();
      commands.push({ kind: 'jump' });
    },
    say(text: string) {
      guard();
      commands.push({ kind: 'say', text: String(text) });
    },
  };

  // Pyodide exposes this object to Python as a proxy.
  (py as unknown as { globals: { set: (k: string, v: unknown) => void } })
    .globals.set('__bridge', bridge);

  py.setStdout({ batched: (s: string) => output.push(s) });
  py.setStderr({ batched: (s: string) => output.push(s) });

  // --- the Python side ----------------------------------------------
  // Thin wrappers so the player calls plain functions, not `__bridge.move`.
  const prelude = `
def move(steps=1):
    """Drive forward along the road."""
    __bridge.move(steps)

def turn_right():
    """Rotate 90 degrees clockwise. Does not move."""
    __bridge.turn("right")

def turn_left():
    """Rotate 90 degrees anticlockwise. Does not move."""
    __bridge.turn("left")

def jump():
    """Hop in place. Useful over a hazard."""
    __bridge.jump()

def say(text):
    """Print to the dashboard console."""
    __bridge.say(text)
`;

  try {
    await py.runPythonAsync(prelude);
    await py.runPythonAsync(source);
  } catch (err) {
    return { commands, output, error: String(err) };
  }

  return { commands, output, error: null };
}
