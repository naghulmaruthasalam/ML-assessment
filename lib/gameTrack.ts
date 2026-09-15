/**
 * Track definition for the gateway puzzle.
 *
 * The map is authored as ASCII so the switchback shape is legible in source
 * and easy to redraw. Row 0 is the top of the map.
 *
 *   .  off-road (trees / cliff — hitting this ends the run)
 *   #  road
 *   S  start (also road)
 *   F  finish (also road)
 */

export const TRACK_ROWS = [
  '..........',
  '.S#####...',
  '.....##...',
  '...####...',
  '...##.....',
  '...#####..',
  '.......#..',
  '..######..',
  '..#....#..',
  '..#####F..',
] as const;

export const GRID = TRACK_ROWS.length; // square map

export type Heading = 'N' | 'E' | 'S' | 'W';

export interface Cell {
  x: number;
  y: number;
}

/** Screen-space delta for one step in each heading. y grows downward. */
export const STEP: Record<Heading, Cell> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

/** Degrees of rotation for the sprite. North is the sprite's natural facing. */
export const HEADING_DEG: Record<Heading, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

const RIGHT: Record<Heading, Heading> = { N: 'E', E: 'S', S: 'W', W: 'N' };
const LEFT: Record<Heading, Heading> = { N: 'W', W: 'S', S: 'E', E: 'N' };

export const turnRight = (h: Heading) => RIGHT[h];
export const turnLeft = (h: Heading) => LEFT[h];

function findChar(ch: string): Cell {
  for (let y = 0; y < TRACK_ROWS.length; y++) {
    const x = TRACK_ROWS[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  throw new Error(`Track is missing its "${ch}" marker.`);
}

export const START: Cell = findChar('S');
export const FINISH: Cell = findChar('F');
export const START_HEADING: Heading = 'E';

export function isRoad(x: number, y: number): boolean {
  if (y < 0 || y >= TRACK_ROWS.length) return false;
  if (x < 0 || x >= TRACK_ROWS[y].length) return false;
  return TRACK_ROWS[y][x] !== '.';
}

export const isFinish = (x: number, y: number) =>
  x === FINISH.x && y === FINISH.y;

/** Terrain flavour for off-road cells, stable per coordinate. */
export function scenery(x: number, y: number): 'tree' | 'rock' | 'grass' {
  const h = (x * 7 + y * 13) % 5;
  if (h === 0) return 'tree';
  if (h === 1) return 'rock';
  return 'grass';
}
