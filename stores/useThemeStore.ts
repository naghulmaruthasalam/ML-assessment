'use client';

import { create } from 'zustand';
import { DEFAULT_THEME, nextTheme, type Theme } from '@/lib/themes';

const STORAGE_KEY = 'anime-ml-theme';

/**
 * Writes the attribute the CSS engine reads. This is the only thing that has
 * to happen for the palette to swap — no component below needs to re-render.
 */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode / storage disabled. The theme still applies for this visit.
  }
}

interface ThemeState {
  theme: Theme;
  /** cyber-mecha -> sunny-beach -> batman-noir -> cyber-mecha */
  cycleTheme: () => void;
  setTheme: (theme: Theme) => void;
  /** Called once on mount to sync store + DOM with the saved choice. */
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,

  cycleTheme: () => {
    const upcoming = nextTheme(get().theme);
    applyTheme(upcoming);
    set({ theme: upcoming });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  hydrate: () => {
    let saved: Theme = DEFAULT_THEME;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored) saved = stored;
    } catch {
      // ignore
    }
    applyTheme(saved);
    set({ theme: saved });
  },
}));
