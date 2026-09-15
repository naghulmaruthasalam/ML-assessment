'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StoryNarrative from './StoryNarrative';
import ConceptVideo from './ConceptVideo';
import ConceptScene from './ConceptScene';
import MentalModelSandbox from './MentalModelSandbox';
import CodeGround from './CodeGround';
import GamifiedAssessment from './GamifiedAssessment';
import CareerMindMap from '@/components/CareerMindMap';
import {
  useProgressStore,
  lessonKey,
  type StageId,
} from '@/stores/useProgressStore';
import type { Lesson, Subject } from '@/types/curriculum';

interface Props {
  subject: Subject;
  lesson: Lesson;
  next: Lesson | null;
}

/**
 * One lesson, played top to bottom.
 *
 * Every stage is always visible — gating the scroll would punish anyone who
 * wants to skim the code before reading the story. What the rail tracks is
 * what you have *done*, and only the final challenge advances the map.
 */
export default function LessonRunner({ subject, lesson, next }: Props) {
  const key = lessonKey(subject.id, lesson.slug);

  const markStage = useProgressStore((s) => s.markStage);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const hydrate = useProgressStore((s) => s.hydrate);
  const ready = useProgressStore((s) => s.ready);
  const done = useProgressStore((s) => s.completed.has(key));

  useEffect(() => {
    if (!ready) hydrate();
  }, [ready, hydrate]);

  const mark = useCallback(
    (stage: StageId) => markStage(key, stage),
    [markStage, key],
  );

  const stages: { id: StageId; label: string; present: boolean }[] = [
    { id: 'story', label: 'Read', present: true },
    {
      id: 'video',
      label: 'Watch',
      present: Boolean(lesson.scene || lesson.videoUrl),
    },
    { id: 'model', label: 'Picture', present: Boolean(lesson.mentalModel) },
    { id: 'code', label: 'Build', present: Boolean(lesson.codeGround) },
    { id: 'game', label: 'Clear', present: Boolean(lesson.assessmentGame) },
  ];

  const live = stages.filter((s) => s.present);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-24 sm:px-8">
      {/* Header */}
      <header>
        <Link
          href={subject.href}
          className="font-mono text-xs font-bold tracking-widest text-[var(--ink-muted)] hover:text-[var(--accent)]"
        >
          ← {subject.name}
        </Link>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl italic uppercase leading-[0.95] tracking-tight sm:text-5xl">
          {lesson.title}
        </h1>

        <p className="mt-4 text-lg text-[var(--ink-muted)]">{lesson.hook}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold tracking-wider">
          <span className="border-2 border-[var(--line)] px-2.5 py-1 text-[var(--ink-muted)]">
            {lesson.minutes} MIN
          </span>
          {live.map((s) => (
            <span
              key={s.id}
              className="border-2 border-[var(--line)] px-2.5 py-1 text-[var(--ink-muted)]"
            >
              {s.label.toUpperCase()}
            </span>
          ))}
          {done && (
            <span className="anime-chip px-2.5 py-1">CLEARED</span>
          )}
        </div>
      </header>

      {/* 1 — Story */}
      <Stage n={1} title="The story" onEnter={() => mark('story')}>
        <StoryNarrative markdown={lesson.narrativeText} />
      </Stage>

      {/* 2 — See it move. A drawn scene wins over footage when both exist. */}
      {lesson.scene ? (
        <Stage n={2} title="See it move">
          <ConceptScene
            scene={lesson.scene}
            caption={lesson.sceneCaption}
            beats={lesson.sceneBeats}
            onWatched={() => mark('video')}
          />
        </Stage>
      ) : (
        lesson.videoUrl && (
          <Stage n={2} title="See it move">
            <ConceptVideo
              src={lesson.videoUrl}
              poster={lesson.videoPoster}
              caption={lesson.videoCaption}
              onWatched={() => mark('video')}
            />
          </Stage>
        )
      )}

      {/* 3 — Mental model */}
      {lesson.mentalModel && (
        <Stage n={3} title="Build the picture">
          <MentalModelSandbox
            data={lesson.mentalModel}
            onMapped={() => mark('model')}
          />
        </Stage>
      )}

      {/* 4 — Code */}
      {lesson.codeGround && (
        <Stage n={4} title="Now write it">
          <CodeGround
            data={lesson.codeGround}
            onSolved={() => mark('code')}
          />
        </Stage>
      )}

      {/* 5 — Assessment */}
      {lesson.assessmentGame && (
        <Stage n={5} title="Clear the gate">
          <GamifiedAssessment
            data={lesson.assessmentGame}
            onCleared={() => {
              mark('game');
              completeLesson(key);
            }}
          />
        </Stage>
      )}

      {/* 6 — Progression */}
      <Stage n={6} title="Where that puts you">
        <CareerMindMap compact />

        {done && next && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Link
              href={`/${subject.id}/${next.slug}`}
              className="anime-panel flex items-center gap-4 p-5"
            >
              <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--ink-muted)]">
                NEXT
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg italic uppercase tracking-tight">
                {next.title}
              </span>
              <span aria-hidden className="ml-auto text-[var(--accent)]">
                ▶
              </span>
            </Link>
          </motion.div>
        )}

        {!done && (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">
            Clear the challenge above to open the next node.
          </p>
        )}
      </Stage>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Stage({
  n,
  title,
  children,
  onEnter,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  onEnter?: () => void;
}) {
  useEffect(() => {
    onEnter?.();
    // Runs once per stage mount; the store de-duplicates repeats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--line)] bg-[var(--surface-alt)] font-mono text-sm font-bold"
        >
          {n}
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-lg italic uppercase tracking-tight">
          {title}
        </h2>
        <span
          aria-hidden
          className="h-[2px] flex-1 bg-[var(--line)]"
        />
      </div>
      {children}
    </section>
  );
}
