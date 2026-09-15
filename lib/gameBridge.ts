'use client';

import { getPyodide } from '@/lib/pyodide';
import {
  START,
  START_HEADING,
  STEP,
  isFinish,
  isRoad,
  roadAhead,
  turnLeft,
  turnRight,
  type Pose,
} from '@/lib/gameTrack';
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
 *
 * Recording alone is not enough for the sensors, though. `scan()` has to
 * answer *while the program is still running*, so the bridge also keeps a
 * shadow pose that walks the same track the replay will walk. The player
 * can therefore write a real program — `while scan() > 0: move(1)` — and
 * have it mean what it says.
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

/**
 * Sensors are free of the command budget, which leaves one way to hang the
 * tab: a loop that polls and never drives, `while not at_flag(): scan()`.
 * Reads get their own, much larger ceiling.
 */
const MAX_SENSOR_READS = 50_000;

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

  let reads = 0;
  const readGuard = () => {
    reads += 1;
    if (reads > MAX_SENSOR_READS) {
      throw new Error(
        'The sensors are being read forever. Is there a loop that never calls move()?',
      );
    }
  };

  // The shadow pose. Mirrors `planRoute`, which stays the authority for what
  // is drawn; this one exists purely so the sensors can answer in real time.
  const pose: Pose = { x: START.x, y: START.y, heading: START_HEADING };
  let wrecked = false;
  let arrived = false;

  /**
   * Advances the shadow pose, stopping the moment it leaves the road — and
   * also the moment it reaches the flag, because that is where `planRoute`
   * ends the run. Without the second stop a program that overshoots would
   * win on screen while `at_flag()` had already gone back to False.
   */
  const drive = (steps: number) => {
    for (let i = 0; i < steps && !wrecked && !arrived; i++) {
      const nx = pose.x + STEP[pose.heading].x;
      const ny = pose.y + STEP[pose.heading].y;
      if (!isRoad(nx, ny)) {
        wrecked = true;
        return;
      }
      pose.x = nx;
      pose.y = ny;
      if (isFinish(pose.x, pose.y)) {
        arrived = true;
        return;
      }
    }
  };

  // --- the JS side of the bridge ------------------------------------
  const bridge = {
    move(steps: number) {
      guard();
      const n = Math.max(0, Math.floor(Number(steps) || 0));
      commands.push({ kind: 'move', steps: n });
      drive(n);
    },
    turn(dir: string) {
      guard();
      const left = dir === 'left';
      commands.push({ kind: 'turn', dir: left ? 'left' : 'right' });
      if (!wrecked && !arrived) {
        pose.heading = left ? turnLeft(pose.heading) : turnRight(pose.heading);
      }
    },
    jump() {
      guard();
      commands.push({ kind: 'jump' });
    },
    say(text: string) {
      guard();
      commands.push({ kind: 'say', text: String(text) });
    },

    // Sensors. These read the shadow pose and cost no command slot, so a
    // player can poll them as often as their program likes.
    scan: () => {
      readGuard();
      return wrecked || arrived ? 0 : roadAhead(pose);
    },
    atFlag: () => {
      readGuard();
      return arrived;
    },
    x: () => {
      readGuard();
      return pose.x;
    },
    y: () => {
      readGuard();
      return pose.y;
    },
    heading: () => {
      readGuard();
      return pose.heading;
    },
  };

  // Pyodide exposes this object to Python as a proxy.
  (py as unknown as { globals: { set: (k: string, v: unknown) => void } })
    .globals.set('__bridge', bridge);

  py.setStdout({ batched: (s: string) => output.push(s) });
  py.setStderr({ batched: (s: string) => output.push(s) });

  // --- the Python side ----------------------------------------------
  // Thin wrappers so the player calls plain functions, not `__bridge.move`.
  //
  // Nothing here is pre-typed into the editor. `help()` is the one thread to
  // pull: it names the controls, and the route is still the player's problem.
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
    """Print to the dashboard console, mid-drive."""
    __bridge.say(text)

def scan():
    """Clear squares of road straight ahead. 0 means the next one is a cliff."""
    return int(__bridge.scan())

def at_flag():
    """True once the scooter is standing on the flag."""
    return bool(__bridge.atFlag())

def where():
    """Current (x, y, heading)."""
    return (int(__bridge.x()), int(__bridge.y()), str(__bridge.heading()))

def help():
    """The command set. You are reading it."""
    print("ONBOARD COMPUTER v1.2 — switchback pass")
    print("")
    print("  move(n)        drive n squares the way you face")
    print("  turn_right()   rotate 90 deg clockwise, stays put")
    print("  turn_left()    rotate 90 deg anticlockwise, stays put")
    print("  jump()         hop in place")
    print("  say(text)      write a line to the console mid-drive")
    print("")
    print("  scan()         clear squares straight ahead -> int")
    print("  at_flag()      standing on the flag? -> bool")
    print("  where()        (x, y, heading) right now")
    print("")
    print("route.py is ordinary python: if, while, for, def, variables.")
    print("the road is the only ground the scooter holds. find the flag.")
`;

  try {
    await py.runPythonAsync(prelude);
    await py.runPythonAsync(source);
  } catch (err) {
    return { commands, output, error: String(err) };
  }

  return { commands, output, error: null };
}
