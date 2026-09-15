export const THEME_ORDER = ['cyber-mecha', 'sunny-beach', 'batman-noir'] as const;

export type Theme = (typeof THEME_ORDER)[number];

export const DEFAULT_THEME: Theme = 'cyber-mecha';

/** Badge copy for the mascot capsule, keyed by theme. */
export const THEME_CAPSULE: Record<Theme, string> = {
  'cyber-mecha': '🤖 MECHA ARC',
  'sunny-beach': '☀️ BEACH ARC',
  'batman-noir': '🦇 GOTHAM ARC',
};

export const THEME_LABEL: Record<Theme, string> = {
  'cyber-mecha': 'Cyber Mecha',
  'sunny-beach': 'Sunny Beach',
  'batman-noir': 'Batman Noir',
};

export function nextTheme(current: Theme): Theme {
  const i = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(i + 1) % THEME_ORDER.length];
}
