import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  subjects,
  lessonsCount,
  interactivesCount,
} from '@/data/curriculum';

export function generateStaticParams() {
  return subjects.map((s) => ({ subject: s.id }));
}

// Next 15+ passes params as a Promise, so this page is async.
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: slug } = await params;
  const subject = subjects.find((s) => s.id === slug);
  if (!subject) notFound();

  const lessons = lessonsCount(subject);
  const labs = interactivesCount(subject);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-8 sm:pt-32">
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-widest text-[var(--ink-muted)] hover:text-[var(--accent)]"
      >
        ← All paths
      </Link>

      <header className="mt-8">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center border-2 border-[var(--line)] bg-[var(--surface-alt)] text-3xl"
        >
          {subject.icon}
        </span>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl italic uppercase leading-none tracking-tight sm:text-6xl">
          {subject.name}
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-xs font-bold tracking-widest text-[var(--accent)]">
          {subject.codename}
        </p>
        <p className="mt-5 max-w-xl text-[var(--ink-muted)]">{subject.tagline}</p>

        <p className="mt-6 font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--ink-muted)]">
          {lessons} lessons · {labs} runnable labs · {subject.tier.toLowerCase()} tier
        </p>
      </header>

      <hr className="anime-rule my-10" />

      <ol className="grid gap-4">
        {subject.lessons.map((lesson, i) => (
          <li key={lesson.slug}>
            <Link
              href={`/${subject.id}/${lesson.slug}`}
              className="anime-panel flex items-center gap-4 p-4"
            >
              <span className="w-8 shrink-0 font-mono text-sm font-bold text-[var(--ink-muted)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold sm:text-base">
                  {lesson.title}
                </span>
                <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                  {lesson.hook}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[10px] text-[var(--ink-muted)]">
                {lesson.minutes}m
              </span>
              {lesson.interactive && (
                <span className="anime-chip shrink-0 px-2 py-1 font-mono text-[10px] font-bold tracking-widest">
                  LAB
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm text-[var(--ink-muted)]">
        This list is generated straight from the curriculum data, so it fills
        in as soon as the real JSON is dropped in.
      </p>
    </main>
  );
}
