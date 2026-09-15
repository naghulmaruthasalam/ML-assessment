'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import TrackMap from './TrackMap';
import { runPlayerCode } from '@/lib/gameBridge';
import { playCrash, playMove, playWin } from '@/lib/gameSounds';
import { GATES, GATE_COUNT } from '@/lib/gameTrack';
import {
  useGameStore,
  planRoute,
  frameIsFinish,
  type Frame,
} from '@/stores/useGameStore';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center font-mono text-xs text-[var(--ink-muted)]">
      Warming up the dashboard…
    </div>
  ),
});

/**
 * route.py opens empty, and stays empty.
 *
 * A starter snippet is the difference between a player solving the pass and
 * a player editing someone else's solution. The command set is not hidden —
 * it is one `help()` away, inside the runtime, where a driver would look for
 * it — but every line that reaches the flag is theirs.
 */

/** Milliseconds per replay frame. */
const FRAME_MS = 260;

/** How long the draft sits still before it is written to storage. */
const DRAFT_DEBOUNCE_MS = 400;

/**
 * How long the crash sits on screen — sound included — before the run wipes
 * back to a blank slate. Long enough to register as a consequence, short
 * enough that the player is back at the keyboard quickly.
 */
const RESTART_DELAY_MS = 1300;

const PATHS = [
  { name: 'Machine Learning', codename: 'The Pattern Alchemist' },
  { name: 'Deep Learning', codename: 'Neural Forge' },
  { name: 'Reinforcement Learning', codename: 'Autonomous Dojo' },
];

export default function GatewayGame() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [showWin, setShowWin] = useState(false);
  const timers = useRef<number[]>([]);
  const draftTimer = useRef<number | null>(null);

  const status = useGameStore((s) => s.status);
  const consoleLines = useGameStore((s) => s.console);
  const unlocked = useGameStore((s) => s.unlocked);
  const bestGate = useGameStore((s) => s.bestGate);
  const hydrate = useGameStore((s) => s.hydrate);
  const setStatus = useGameStore((s) => s.setStatus);
  const log = useGameStore((s) => s.log);
  const reset = useGameStore((s) => s.reset);
  const applyFrame = useGameStore((s) => s.applyFrame);
  const clearGate = useGameStore((s) => s.clearGate);
  const saveDraft = useGameStore((s) => s.saveDraft);
  const markUnlocked = useGameStore((s) => s.markUnlocked);

  // Restore whatever the player wrote last visit — their own work, never a
  // seeded solution.
  useEffect(() => {
    hydrate();
    const saved = useGameStore.getState().draft;
    if (saved) setCode(saved);
  }, [hydrate]);

  // Any pending replay must die with the component, or it will keep writing
  // to a store nobody is rendering.
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(
    () => () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    },
    [],
  );

  const onCodeChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? '';
      setCode(next);
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      draftTimer.current = window.setTimeout(
        () => saveDraft(next),
        DRAFT_DEBOUNCE_MS,
      );
    },
    [saveDraft],
  );

  /** Walks the planned frames, one per tick. */
  const replay = useCallback(
    (frames: Frame[]) => {
      setStatus('driving');

      frames.forEach((frame, i) => {
        const t = window.setTimeout(() => {
          applyFrame(frame);
          if (frame.moved) playMove();
          if (frame.log) log(frame.log);

          if (frame.gate !== undefined) {
            clearGate(frame.gate);
            log(
              `>> ${GATES[frame.gate].name} cleared — ${frame.gate + 1}/${GATE_COUNT}`,
            );
          }

          if (frame.crash) {
            setStatus('crashed');
            playCrash();
            log('>> off the road. the scooter does not do grass.');
            log('>> resetting — the pass does not forgive a wrong turn.');

            const restart = window.setTimeout(() => {
              reset();
              setCode('');
              saveDraft('');
              log(
                '>> scooter back at the start. route.py cleared — write the climb again.',
              );
            }, RESTART_DELAY_MS);
            timers.current.push(restart);
            return;
          }

          if (frameIsFinish(frame)) {
            log('>> flag reached.');
            playWin();
            markUnlocked();
            setShowWin(true);
            const go = window.setTimeout(() => router.push('/dashboard'), 3600);
            timers.current.push(go);
            return;
          }

          if (i === frames.length - 1) {
            setStatus('idle');
            log('>> program ended before the flag. the road goes on.');
          }
        }, i * FRAME_MS);

        timers.current.push(t);
      });

      if (frames.length === 0) {
        setStatus('idle');
        log('>> the program ran but issued no commands. the scooter is parked.');
      }
    },
    [applyFrame, clearGate, log, markUnlocked, reset, router, saveDraft, setStatus],
  );

  const execute = useCallback(async () => {
    clearTimers();
    reset();

    if (!code.trim()) {
      log('>> route.py is empty. the scooter has no instructions.');
      log('>> the onboard computer answers to help(). ask it something.');
      return;
    }

    setStatus('booting');
    log('>> booting python…');

    let result;
    try {
      result = await runPlayerCode(code);
    } catch {
      setStatus('idle');
      log('>> could not start python. check your connection and retry.');
      return;
    }

    setStatus('executing');
    result.output.forEach((line) => log(line));

    if (result.error) {
      setStatus('idle');
      log(result.error);
      return;
    }

    // A program that only asked the computer questions is not a failed run.
    if (result.commands.length === 0) {
      setStatus('idle');
      log('>> no driving commands in that one. the scooter is still parked.');
      return;
    }

    log(`>> ${result.commands.length} command(s) captured. rolling.`);
    replay(planRoute(result.commands));
  }, [code, clearTimers, log, replay, reset, setStatus]);

  const busy =
    status === 'booting' || status === 'executing' || status === 'driving';

  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-4 py-10 sm:px-8">
      <header className="mb-8">
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-[var(--ink-muted)]">
          GATEWAY // WRITE CODE TO PROCEED
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl italic uppercase leading-none tracking-tight sm:text-6xl">
          <span className="underline-wavy-accent">Switchback</span> Pass
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
          The road up the mountain doubles back on itself, four hairpins to the
          flag. Nobody left you a starter file — the scooter has an onboard
          computer, and it answers to{' '}
          <code className="font-mono text-[var(--ink)]">help()</code>. Work out
          the route, write it yourself, and the curriculum opens. Python runs in
          this tab; nothing is sent anywhere.
        </p>

        {bestGate > 0 && !unlocked && (
          <p className="mt-5 inline-block border-2 border-[var(--line)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest">
            FURTHEST CLIMB · {bestGate}/{GATE_COUNT} HAIRPINS
          </p>
        )}

        {unlocked && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="anime-chip mt-6 px-4 py-2 font-mono text-[11px] font-bold tracking-widest"
          >
            ALREADY CLEARED — SKIP TO THE PATHS →
          </button>
        )}
      </header>

      {/* Split screen */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="order-2 lg:order-1">
          <TrackMap />
        </section>

        <section className="order-1 flex flex-col gap-4 lg:order-2">
          <div className="anime-panel overflow-hidden">
            <div className="flex items-center gap-3 border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2 font-mono text-[10px] font-bold tracking-widest">
              <span>SYSTEM CONSOLE — route.py</span>
              <span className="ml-auto text-[var(--ink-muted)]">
                {busy ? 'BUSY' : code.trim() ? 'READY' : 'EMPTY FILE'}
              </span>
            </div>

            <MonacoEditor
              height="380px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={onCodeChange}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 14, bottom: 14 },
                renderLineHighlight: 'none',
                automaticLayout: true,
                readOnly: showWin,
                tabSize: 4,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={execute}
              disabled={busy || showWin}
              className="anime-chip px-5 py-2.5 font-mono text-xs font-bold tracking-widest disabled:opacity-60"
            >
              {status === 'booting'
                ? 'BOOTING…'
                : status === 'driving'
                  ? 'DRIVING…'
                  : 'EXECUTE SEQUENCE'}
            </button>

            <button
              type="button"
              onClick={() => {
                clearTimers();
                reset();
              }}
              disabled={showWin}
              className="border-2 border-[var(--line)] px-4 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              RESET SCOOTER
            </button>
          </div>

          {/* Console */}
          <div className="anime-panel">
            <div className="border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2 font-mono text-[10px] font-bold tracking-widest">
              OUTPUT
            </div>
            <div
              className="max-h-44 min-h-24 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
              aria-live="polite"
            >
              {consoleLines.length === 0 ? (
                <span className="text-[var(--ink-muted)]">
                  $ _ nothing has run yet
                </span>
              ) : (
                consoleLines.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Win sequence */}
      <AnimatePresence>
        {showWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--canvas)]/95"
          >
            {/* The track splitting open */}
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 border-b-2 border-[var(--accent)] bg-[var(--surface)]"
              initial={{ y: 0 }}
              animate={{ y: '-100%' }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 border-t-2 border-[var(--accent)] bg-[var(--surface)]"
              initial={{ y: 0 }}
              animate={{ y: '100%' }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
            />

            <motion.div
              className="relative w-full max-w-3xl px-6 text-center"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <p className="font-[family-name:var(--font-display)] text-3xl italic uppercase tracking-tight sm:text-5xl">
                Access granted
              </p>
              <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-[var(--ink-muted)]">
                YOU WROTE THE ROUTE · THE PASS FORKS THREE WAYS
              </p>

              {/* The road splitting. Each lane drops in as the halves clear. */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {PATHS.map((path, i) => (
                  <motion.div
                    key={path.name}
                    className="anime-panel bg-[var(--surface)] px-4 py-5"
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.25 + i * 0.18, duration: 0.4 }}
                  >
                    <p className="font-[family-name:var(--font-display)] text-lg italic uppercase leading-none tracking-tight">
                      {path.name}
                    </p>
                    <p className="mt-2 font-mono text-[10px] font-bold tracking-widest text-[var(--accent)]">
                      {path.codename}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="anime-chip mt-8 px-5 py-2.5 font-mono text-xs font-bold tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
              >
                PICK YOUR PATH →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
