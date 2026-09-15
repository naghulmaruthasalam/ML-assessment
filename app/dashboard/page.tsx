import Link from 'next/link';
import CareerMindMap from '@/components/CareerMindMap';
import {
  subjects,
  lessonsCount,
  interactivesCount,
  totalLessons,
  totalInteractives,
  type Tier,
} from '@/data/curriculum';

const TIER_VAR: Record<Tier, string> = {
  Novice: 'var(--tier-1)',
  Adept: 'var(--tier-2)',
  Master: 'var(--tier-3)',
};

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8">
      {/* ---------------- HERO ---------------- */}
      <section className="pb-16 pt-24 sm:pt-32">
        <p className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.3em] text-[var(--ink-muted)]">
          THREE PATHS. ONE RUNTIME.
        </p>

        <h1 className="mt-5 max-w-4xl font-[family-name:var(--font-display)] text-5xl italic uppercase leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="underline-wavy-accent">Learn it</span> by running it
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Every equation on this site is a cell you can edit. Python runs in your
          browser tab — no account, no GPU bill, no waiting on a server to
          answer.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 font-[family-name:var(--font-mono)] text-xs font-bold">
          <span className="anime-chip px-3 py-1.5">{totalLessons} LESSONS</span>
          <span className="anime-chip px-3 py-1.5">{totalInteractives} LABS</span>
          <span className="border-2 border-[var(--line)] px-3 py-1.5 text-[var(--ink-muted)]">
            FREE + OPEN
          </span>
        </div>
      </section>

      <hr className="anime-rule" />

      {/* ---------------- PATHWAYS ---------------- */}
      <section className="py-14" aria-labelledby="pathways-heading">
        <h2
          id="pathways-heading"
          className="font-[family-name:var(--font-display)] text-2xl italic uppercase tracking-tight sm:text-3xl"
        >
          Pick a path
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--ink-muted)]">
          Start anywhere. Each path assumes only what the one before it taught.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const lessons = lessonsCount(subject);
            const labs = interactivesCount(subject);

            return (
              <li key={subject.id}>
                <Link
                  href={subject.href}
                  className="anime-panel flex h-full flex-col p-6 focus-visible:outline-none"
                >
                  {/* Icon + tier */}
                  <div className="flex items-start justify-between gap-4">
                    <span
                      aria-hidden
                      className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-[var(--line)] bg-[var(--surface-alt)] text-2xl"
                    >
                      {subject.icon}
                    </span>

                    <span
                      className="border-2 border-[var(--line)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] font-bold tracking-widest"
                      style={{ color: TIER_VAR[subject.tier] }}
                    >
                      {subject.tier.toUpperCase()}
                    </span>
                  </div>

                  {/* Title block */}
                  <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl italic uppercase leading-none tracking-tight">
                    {subject.name}
                  </h3>
                  <p className="mt-2 font-[family-name:var(--font-mono)] text-xs font-bold tracking-widest text-[var(--accent)]">
                    {subject.codename}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {subject.tagline}
                  </p>

                  {/* Footer: counts are derived, never typed */}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[var(--line)] pt-4 font-[family-name:var(--font-mono)] text-[11px] font-bold tracking-wider">
                    <span>
                      {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
                    </span>
                    <span className="h-3 w-[2px] bg-[var(--line)]" aria-hidden />
                    <span>
                      {labs} {labs === 1 ? 'lab' : 'labs'}
                    </span>
                    <span className="ml-auto text-[var(--accent)]" aria-hidden>
                      START
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <hr className="anime-rule" />

      {/* ---------------- CAREER MAP ---------------- */}
      <section className="py-14" aria-labelledby="map-heading">
        <h2
          id="map-heading"
          className="font-[family-name:var(--font-display)] text-2xl italic uppercase tracking-tight sm:text-3xl"
        >
          Your map so far
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--ink-muted)]">
          Nodes open as you clear the challenge at the end of each lesson.
        </p>
        <div className="mt-8">
          <CareerMindMap />
        </div>
      </section>

      <hr className="anime-rule" />

      {/* ---------------- HOW IT RUNS ---------------- */}
      <section className="grid gap-8 py-14 md:grid-cols-3">
        {[
          {
            h: 'Edit any cell',
            p: 'Change a learning rate, rerun, and watch the boundary move. Nothing is a screenshot.',
          },
          {
            h: 'Runs in your tab',
            p: 'Pyodide compiles Python to WebAssembly on first load, then everything executes locally.',
          },
          {
            h: 'Your work stays put',
            p: 'Edits save to this browser. Close the tab and pick the same lesson back up later.',
          },
        ].map((item) => (
          <div key={item.h}>
            <h3 className="font-[family-name:var(--font-display)] text-lg italic uppercase tracking-tight">
              {item.h}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
              {item.p}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
