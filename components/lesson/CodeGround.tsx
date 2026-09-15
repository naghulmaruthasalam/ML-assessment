'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { getPyodide } from '@/lib/pyodide';
import type { CodeGround as CodeGroundData } from '@/types/curriculum';

/**
 * Monaco ships its own workers and touches `window` on import, so it can
 * only load in the browser. The fallback keeps the panel from collapsing
 * while the editor arrives.
 */
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center font-mono text-xs text-[var(--ink-muted)]">
      Opening the editor…
    </div>
  ),
});

type CheckState = { id: string; label: string; passed: boolean; hint: string };
type RunStatus = 'idle' | 'booting' | 'running' | 'passed' | 'failed';

interface Props {
  data: CodeGroundData;
  /** Called the first time every check passes. */
  onSolved?: () => void;
}

export default function CodeGround({ data, onSolved }: Props) {
  const [code, setCode] = useState(data.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [checks, setChecks] = useState<CheckState[]>([]);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [showSolution, setShowSolution] = useState(false);
  const solvedOnce = useRef(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Keep the newest line in view without yanking the whole page.
  useEffect(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const run = useCallback(async () => {
    setOutput([]);
    setChecks([]);
    setStatus('booting');

    let py;
    try {
      py = await getPyodide();
    } catch {
      setStatus('failed');
      setOutput([
        'Could not start Python. Check your connection and run again —',
        'the runtime is fetched once, then cached for the session.',
      ]);
      return;
    }

    setStatus('running');
    const lines: string[] = [];
    const push = (s: string) => {
      lines.push(s);
      setOutput([...lines]);
    };

    py.setStdout({ batched: push });
    py.setStderr({ batched: push });

    try {
      if (data.setupCode) await py.runPythonAsync(data.setupCode);
      await py.runPythonAsync(code);
    } catch (err) {
      // Python errors arrive as a formatted traceback string.
      push(String(err));
      setStatus('failed');
      return;
    }

    // Checks run in the same namespace, so they can inspect the learner's
    // variables directly.
    const results: CheckState[] = [];
    for (const check of data.validationLogic) {
      let passed = false;
      try {
        passed = Boolean(await py.runPythonAsync(`bool(${check.expression})`));
      } catch {
        passed = false;
      }
      results.push({
        id: check.id,
        label: check.label,
        hint: check.hint,
        passed,
      });
    }
    setChecks(results);

    const allPassed = results.every((r) => r.passed);
    setStatus(allPassed ? 'passed' : 'failed');

    if (allPassed && !solvedOnce.current) {
      solvedOnce.current = true;
      onSolved?.();
    }
  }, [code, data, onSolved]);

  const busy = status === 'booting' || status === 'running';

  return (
    <section className="grid gap-5">
      {/* Scenario */}
      <div className="anime-panel p-5">
        <p className="font-mono text-[10px] font-bold tracking-widest text-[var(--ink-muted)]">
          REAL-TIME SCENARIO
        </p>
        <p className="mt-3 text-base leading-relaxed">{data.scenario}</p>

        {data.dataPreview && (
          <pre className="mt-4 overflow-x-auto border-2 border-[var(--line)] bg-[var(--surface-alt)] p-3 font-mono text-xs leading-relaxed">
            {data.dataPreview}
          </pre>
        )}
      </div>

      {/* Editor */}
      <div className="anime-panel overflow-hidden">
        <div className="flex items-center gap-3 border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2">
          <span className="font-mono text-[10px] font-bold tracking-widest">
            main.py
          </span>
          <span className="ml-auto font-mono text-[10px] text-[var(--ink-muted)]">
            {busy ? 'WORKING' : status === 'passed' ? 'SOLVED' : 'READY'}
          </span>
        </div>

        <MonacoEditor
          height="340px"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? '')}
          options={{
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 14, bottom: 14 },
            lineNumbersMinChars: 3,
            renderLineHighlight: 'none',
            tabSize: 4,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="anime-chip px-5 py-2.5 font-mono text-xs font-bold tracking-widest disabled:opacity-60"
        >
          {status === 'booting'
            ? 'STARTING PYTHON…'
            : status === 'running'
              ? 'RUNNING…'
              : 'RUN CODE'}
        </button>

        <button
          type="button"
          onClick={() => setCode(data.starterCode)}
          className="border-2 border-[var(--line)] px-4 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          RESET
        </button>

        {data.solutionCode && (
          <button
            type="button"
            onClick={() => {
              setShowSolution((s) => !s);
              if (!showSolution) setCode(data.solutionCode!);
            }}
            className="ml-auto font-mono text-xs font-bold tracking-widest text-[var(--ink-muted)] underline hover:text-[var(--accent)]"
          >
            {showSolution ? 'HIDE ANSWER' : 'SHOW ME THE ANSWER'}
          </button>
        )}
      </div>

      {/* Terminal */}
      <div className="anime-panel">
        <div className="border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2 font-mono text-[10px] font-bold tracking-widest">
          OUTPUT
        </div>
        <div
          ref={terminalRef}
          className="max-h-56 min-h-24 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
          aria-live="polite"
        >
          {output.length === 0 ? (
            <span className="text-[var(--ink-muted)]">
              Nothing yet. Run your code to see what it prints.
            </span>
          ) : (
            output.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Checks */}
      <AnimatePresence>
        {checks.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-2"
          >
            {checks.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 border-2 border-[var(--line)] bg-[var(--surface)] p-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-[var(--line)] text-[10px] font-bold"
                  style={{
                    background: c.passed ? 'var(--accent)' : 'transparent',
                    color: c.passed ? 'var(--accent-ink)' : 'var(--ink-muted)',
                  }}
                >
                  {c.passed ? '✓' : '·'}
                </span>
                <div className="text-sm">
                  <p>{c.label}</p>
                  {!c.passed && (
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {c.hint}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
