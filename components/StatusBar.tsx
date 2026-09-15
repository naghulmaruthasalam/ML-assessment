import { totalLessons, totalInteractives } from '@/data/curriculum';

export default function StatusBar() {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--line)] bg-[var(--surface)]"
      aria-label="Runtime status"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto whitespace-nowrap px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-bold tracking-widest text-[var(--ink-muted)] sm:text-[11px]">
        <span className="flex items-center gap-2 text-[var(--ink)]">
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 border-2 border-[var(--line)] bg-[var(--accent)]"
          />
          CORE ENGINE: PYODIDE (CLIENT-SIDE WASM)
        </span>

        <span aria-hidden className="h-3 w-[2px] shrink-0 bg-[var(--line)]" />

        <span>LATENCY: 0ms</span>

        <span aria-hidden className="h-3 w-[2px] shrink-0 bg-[var(--line)]" />

        <span className="hidden sm:inline">
          LESSONS: {totalLessons} / LABS: {totalInteractives}
        </span>

        <span className="ml-auto hidden md:inline">NO SERVER ROUNDTRIP</span>
      </div>
    </footer>
  );
}
