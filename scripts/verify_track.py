"""Prove the gateway track can be driven, and print a solution.

Ports the movement rules from stores/useGameStore.ts so the check exercises
the same semantics the browser will: move() advances one square at a time
and leaving the road ends the run.
"""

import re
import pathlib
from collections import deque

SRC = pathlib.Path('lib/gameTrack.ts').read_text()

rows = re.search(r'TRACK_ROWS = \[(.*?)\] as const', SRC, re.S).group(1)
TRACK = re.findall(r"'([.#SF]+)'", rows)

gates = re.search(r'GATES = \[(.*?)\] as const', SRC, re.S).group(1)
GATES = [(int(row), name) for row, name in re.findall(r'row:\s*(\d+),\s*name:\s*\'([^\']+)\'', gates)]

H = len(TRACK)
W = len(TRACK[0])

STEP = {'N': (0, -1), 'E': (1, 0), 'S': (0, 1), 'W': (-1, 0)}
RIGHT = {'N': 'E', 'E': 'S', 'S': 'W', 'W': 'N'}
LEFT = {v: k for k, v in RIGHT.items()}


def find(ch):
    for y, row in enumerate(TRACK):
        x = row.find(ch)
        if x != -1:
            return x, y
    raise SystemExit(f'track has no {ch}')


def is_road(x, y):
    return 0 <= y < H and 0 <= x < W and TRACK[y][x] != '.'


def solve():
    sx, sy = find('S')
    fx, fy = find('F')
    start = (sx, sy, 'E')

    seen = {start}
    q = deque([(start, [])])

    while q:
        (x, y, h), path = q.popleft()
        if (x, y) == (fx, fy):
            return path

        nx, ny = x + STEP[h][0], y + STEP[h][1]
        if is_road(nx, ny) and (nx, ny, h) not in seen:
            seen.add((nx, ny, h))
            q.append(((nx, ny, h), path + ['move']))

        for name, table in (('turn_right', RIGHT), ('turn_left', LEFT)):
            nh = table[h]
            if (x, y, nh) not in seen:
                seen.add((x, y, nh))
                q.append(((x, y, nh), path + [name]))

    return None


def check_gates():
    """Each gate row must be road the flag cannot be reached without crossing.

    The progress badge counts hairpins cleared, so a gate row that can be
    driven around would let a player bank credit for a climb they skipped -
    or, worse, make the last hairpin unreachable and the badge uncappable.
    Blanking the row and re-running the search proves it is a chokepoint.
    """
    global TRACK
    original = TRACK
    problems = []

    for row, name in GATES:
        if row >= H:
            problems.append(f'{name}: row {row} is off the map')
            continue
        if 'S' in TRACK[row] or 'F' in TRACK[row]:
            problems.append(f'{name}: row {row} holds the start or the flag')
            continue
        if '#' not in TRACK[row]:
            problems.append(f'{name}: row {row} holds no road')
            continue

        TRACK = list(original)
        TRACK[row] = '.' * W
        if solve() is not None:
            problems.append(f'{name}: row {row} can be driven around')

    TRACK = original
    return problems


def condense(path):
    """Collapse runs of `move` into move(n), as a player would write it."""
    out = []
    run = 0
    for step in path:
        if step == 'move':
            run += 1
            continue
        if run:
            out.append(f'move({run})')
            run = 0
        out.append(f'{step}()')
    if run:
        out.append(f'move({run})')
    return out


def main():
    print('\n'.join(TRACK))
    print()

    sx, sy = find('S')
    if not is_road(sx, sy):
        raise SystemExit('FAIL start is not on the road')

    path = solve()
    if path is None:
        raise SystemExit('FAIL the flag is unreachable from the start')

    program = condense(path)
    moves = sum(1 for s in path if s == 'move')
    turns = len(path) - moves

    print(f'ok  solvable in {moves} moves and {turns} turns')
    print(f'ok  {len(program)} lines of Python')

    problems = check_gates()
    if problems:
        for p in problems:
            print(f'FAIL {p}')
        raise SystemExit(1)
    print(f'ok  {len(GATES)} hairpins, every one unavoidable\n')
    print('reference solution:\n')
    for line in program:
        print(f'  {line}')


if __name__ == '__main__':
    main()
