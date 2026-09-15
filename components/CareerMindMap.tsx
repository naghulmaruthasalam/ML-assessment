'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { subjects } from '@/data/curriculum';
import { useProgressStore, lessonKey } from '@/stores/useProgressStore';
import type { SubjectId } from '@/types/curriculum';

/**
 * The skill tree.
 *
 * Built as hand-laid SVG rather than React Flow: the graph is small and
 * its shape is known ahead of time, so a layout engine would add ~50kB
 * and a second theming system for no benefit. Every colour here is a CSS
 * variable, so the tree restyles with the rest of the app for free.
 */

const NODE_R = 15;
const ROW = 74;
const COL_TOP = 120;

type NodeState = 'done' | 'open' | 'locked';

interface Positioned {
  key: string;
  subject: SubjectId;
  slug: string;
  title: string;
  index: number;
  x: number;
  y: number;
  state: NodeState;
}

export default function CareerMindMap({
  compact = false,
}: {
  compact?: boolean;
}) {
  const completed = useProgressStore((s) => s.completed);
  const ready = useProgressStore((s) => s.ready);
  const reduceMotion = useReducedMotion();

  const width = 720;
  const columns = subjects.length;
  const colWidth = width / columns;

  const { nodes, height } = useMemo(() => {
    const out: Positioned[] = [];
    let tallest = 0;

    subjects.forEach((subject, col) => {
      const x = colWidth * col + colWidth / 2;

      subject.lessons.forEach((lesson, i) => {
        const key = lessonKey(subject.id, lesson.slug);
        const done = completed.has(key);

        // A lesson opens when its stated prerequisites are done, or — if it
        // declares none — when the lesson above it in the column is done.
        let unlocked: boolean;
        if (lesson.requires && lesson.requires.length > 0) {
          unlocked = lesson.requires.every((slug) =>
            completed.has(lessonKey(subject.id, slug)),
          );
        } else {
          const prev = subject.lessons[i - 1];
          unlocked = !prev || completed.has(lessonKey(subject.id, prev.slug));
        }

        out.push({
          key,
          subject: subject.id,
          slug: lesson.slug,
          title: lesson.title,
          index: i,
          x,
          y: COL_TOP + i * ROW,
          state: done ? 'done' : unlocked ? 'open' : 'locked',
        });

        tallest = Math.max(tallest, COL_TOP + i * ROW);
      });
    });

    return { nodes: out, height: tallest + 70 };
  }, [completed, colWidth]);

  const stroke = (state: NodeState) =>
    state === 'locked' ? 'var(--line)' : 'var(--accent)';

  return (
    <div className="anime-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2">
        <span className="font-mono text-[10px] font-bold tracking-widest">
          CAREER MAP
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--ink-muted)]">
          {ready ? `${completed.size} CLEARED` : '—'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[560px]"
          style={{ maxHeight: compact ? 420 : undefined }}
          role="img"
          aria-label="Skill tree showing lesson progress across the three subjects"
        >
          {/* Trunk */}
          <line
            x1={colWidth / 2}
            y1={62}
            x2={width - colWidth / 2}
            y2={62}
            stroke="var(--line)"
            strokeWidth={3}
          />

          {subjects.map((subject, col) => {
            const x = colWidth * col + colWidth / 2;
            const colNodes = nodes.filter((n) => n.subject === subject.id);

            return (
              <g key={subject.id}>
                {/* Branch stem */}
                <line
                  x1={x}
                  y1={62}
                  x2={x}
                  y2={COL_TOP}
                  stroke="var(--line)"
                  strokeWidth={3}
                />

                {/* Subject label */}
                <text
                  x={x}
                  y={44}
                  textAnchor="middle"
                  fill="var(--ink)"
                  className="font-mono"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}
                >
                  {subject.id.toUpperCase()}
                </text>

                {/* Rails between consecutive lessons */}
                {colNodes.slice(1).map((n, i) => (
                  <line
                    key={`r-${n.key}`}
                    x1={x}
                    y1={colNodes[i].y}
                    x2={x}
                    y2={n.y}
                    stroke={
                      colNodes[i].state === 'done'
                        ? 'var(--accent)'
                        : 'var(--line)'
                    }
                    strokeWidth={3}
                  />
                ))}

                {colNodes.map((n) => {
                  const locked = n.state === 'locked';

                  const circle = (
                    <>
                      {/* Pulse ring on the node you can play right now */}
                      {n.state === 'open' && !reduceMotion && (
                        <motion.circle
                          cx={n.x}
                          cy={n.y}
                          r={NODE_R}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          initial={{ opacity: 0.7, scale: 1 }}
                          animate={{ opacity: 0, scale: 2.1 }}
                          transition={{
                            duration: 1.9,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                        />
                      )}

                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={NODE_R}
                        fill={
                          n.state === 'done'
                            ? 'var(--accent)'
                            : 'var(--surface)'
                        }
                        stroke={stroke(n.state)}
                        strokeWidth={3}
                        opacity={locked ? 0.45 : 1}
                      />

                      <text
                        x={n.x}
                        y={n.y + 4}
                        textAnchor="middle"
                        className="font-mono"
                        style={{ fontSize: 11, fontWeight: 700 }}
                        fill={
                          n.state === 'done'
                            ? 'var(--accent-ink)'
                            : 'var(--ink-muted)'
                        }
                      >
                        {n.state === 'done' ? '✓' : locked ? '🔒' : n.index + 1}
                      </text>

                      <text
                        x={n.x + NODE_R + 10}
                        y={n.y + 4}
                        fill={locked ? 'var(--ink-muted)' : 'var(--ink)'}
                        opacity={locked ? 0.5 : 1}
                        style={{ fontSize: 11 }}
                      >
                        {locked ? 'Classified' : truncate(n.title, 22)}
                      </text>
                    </>
                  );

                  if (locked) {
                    return (
                      <g key={n.key} aria-label={`${n.title} — locked`}>
                        {circle}
                      </g>
                    );
                  }

                  return (
                    <Link
                      key={n.key}
                      href={`/${n.subject}/${n.slug}`}
                      aria-label={n.title}
                    >
                      <g style={{ cursor: 'pointer' }}>{circle}</g>
                    </Link>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="border-t-2 border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-muted)]">
        Clear a lesson&apos;s final challenge to open the next node.
      </p>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
