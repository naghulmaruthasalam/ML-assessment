'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import TrackMap from './TrackMap';
import { runPlayerCode } from '@/lib/gameBridge';
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

const STARTER = `# Switchback Pass. Get the scooter to the flag.
#
#   move(n)       drive n squares forward
#   turn_right()  rotate 90 degrees, without moving
#   turn_left()   rotate the other way
#   say(text)     print to the console
#
# You start facing EAST. Loops work — try one.

move(4)
turn_right()
`;

/** Milliseconds per replay frame. */
const FRAME_MS = 260;

export default function GatewayGame() {
  const router = useRouter();
  const [code, setCode] = useState(STARTER);
  const [showWin, setShowWin] = useState(false);
  const timers = useRef<number[]>([]);

  const status = useGameStore((s) => s.status);
  const consoleLines = useGameStore((s) => s.console);
  const unlocked = useGameStore((s) => s.unlocked);
  const hydrate = useGameStore((s) => s.hydrate);
  const setStatus = useGameStore((s) => s.setStatus);
  const log = useGameStore((s) => s.log);
  const reset = useGameStore((s) => s.reset);
  const applyFrame = useGameStore((s) => s.applyFrame);
  const markUnlocked = useGameStore((s) => s.markUnlocked);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Any pending replay must die with the component, or it will keep writing
  // to a store nobody is rendering.
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Walks the planned frames, one per tick. */
  const replay = useCallback(
    (frames: Frame[]) => {
      setStatus('driving');

      frames.forEach((frame, i) => {
        const t = window.setTimeout(() => {
          applyFrame(frame);
          if (frame.log) log(frame.log);

          if (frame.crash) {
            setStatus('crashed');
            log('>> off the road. the scooter does not do grass.');
            return;
          }

          if (frameIsFinish(frame)) {
            log('>> flag reached.');
            markUnlocked();
            setShowWin(true);
            const go = window.setTimeout(() => router.push('/dashboard'), 2200);
            timers.current.push(go);
            return;
          }

          if (i === frames.length - 1) {
            setStatus('idle');
            log('>> program ended before the flag.');
          }
        }, i * FRAME_MS);

        timers.current.push(t);
      });

      if (frames.length === 0) {
        setStatus('idle');
        log('>> no commands. the scooter is still parked.');
      }
    },
    [applyFrame, log, markUnlocked, router, setStatus],
  );

  const execute = useCallback(async () => {
    clearTimers();
    reset();
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
          The road up the mountain doubles back on itself. Drive the scooter to
          the flag using Python and the curriculum opens. Python runs in this
          tab — nothing is sent anywhere.
        </p>

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
                {busy ? 'BUSY' : 'READY'}
              </span>
            </div>

            <MonacoEditor
              height="380px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? '')}
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
                <span className="text-[var(--ink-muted)]">$ _ nothing yet</span>
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
              className="relative text-center"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <p className="font-[family-name:var(--font-display)] text-3xl italic uppercase tracking-tight sm:text-5xl">
                Access granted
              </p>
              <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-[var(--ink-muted)]">
                THREE PATHS UNLOCKED
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
