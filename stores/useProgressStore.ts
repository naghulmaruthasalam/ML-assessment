'use client';

import { create } from 'zustand';
import type { SubjectId } from '@/types/curriculum';

const STORAGE_KEY = 'anime-ml-progress';

/** Key used everywhere a lesson is identified globally. */
export const lessonKey = (subject: SubjectId, slug: string) =>
  `${subject}/${slug}`;

interface Persisted {
  completed: string[];
  stages: Record<string, string[]>;
}

function read(): Persisted {
  if (typeof window === 'undefined') return { completed: [], stages: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [], stages: {} };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      completed: parsed.completed ?? [],
      stages: parsed.stages ?? {},
    };
  } catch {
    return { completed: [], stages: {} };
  }
}

function write(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable. Progress still holds for this session.
  }
}

/** The stages a learner ticks off inside a single lesson. */
export type StageId = 'story' | 'video' | 'model' | 'code' | 'game';

interface ProgressState {
  completed: Set<string>;
  /** Per-lesson set of finished stages, for the in-page rail. */
  stages: Record<string, Set<StageId>>;
  /** Set once the store has read localStorage, so SSR and client agree. */
  ready: boolean;

  hydrate: () => void;
  isComplete: (key: string) => boolean;
  markStage: (key: string, stage: StageId) => void;
  hasStage: (key: string, stage: StageId) => boolean;
  /** Called when a gamified assessment is passed. */
  completeLesson: (key: string) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  completed: new Set<string>(),
  stages: {},
  ready: false,

  hydrate: () => {
    const saved = read();
    const stages: Record<string, Set<StageId>> = {};
    for (const [k, v] of Object.entries(saved.stages)) {
      stages[k] = new Set(v as StageId[]);
    }
    set({ completed: new Set(saved.completed), stages, ready: true });
  },

  isComplete: (key) => get().completed.has(key),

  hasStage: (key, stage) => Boolean(get().stages[key]?.has(stage)),

  markStage: (key, stage) => {
    const current = get().stages[key];
    if (current?.has(stage)) return; // no-op, avoids a pointless re-render
    const next = new Set(current ?? []);
    next.add(stage);
    const stages = { ...get().stages, [key]: next };
    set({ stages });
    persist(get().completed, stages);
  },

  completeLesson: (key) => {
    if (get().completed.has(key)) return;
    const completed = new Set(get().completed);
    completed.add(key);
    set({ completed });
    persist(completed, get().stages);
  },

  reset: () => {
    set({ completed: new Set(), stages: {} });
    write({ completed: [], stages: {} });
  },
}));

function persist(
  completed: Set<string>,
  stages: Record<string, Set<StageId>>,
) {
  const flat: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(stages)) flat[k] = [...v];
  write({ completed: [...completed], stages: flat });
}
